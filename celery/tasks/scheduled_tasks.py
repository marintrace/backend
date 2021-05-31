from typing import Dict
from datetime import timedelta
from gql import gql

from shared.date_utils import get_pst_time, DATE_FORMAT
from shared.logger import logger
from shared.models.dashboard_entities import DailyDigestRequest, CreateInvoiceRequest
from shared.models.enums import UserLocationStatus, VaccinationStatus
from shared.models.user_entities import User
from shared.service.celery_wrapper import GLOBAL_CELERY_OPTIONS, get_celery
from shared.service.sendgrid_api import SendgridAPI
from shared.service.wave_api import WaveAPI
from shared.service.neo4j_api import Neo4JGraph, current_day_node
from shared.service.vault_api import VaultConnection

celery = get_celery()


def get_active_inactive_counts(school: str) -> Dict[str, int]:
    """
    Get the number of active and inactive users inside Neo4J
    :param school: the user's school
    :return: a dictionary containing the number of active and inactive users
    """
    with Neo4JGraph() as graph:
        active_users = graph.run(
            """MATCH (m: Member {school: $school, status: "active", disabled: false}) RETURN COUNT(m) as cnt""",
            school=school
        ).evaluate()

        inactive_users = graph.run(  # include school switched and unactivated users
            """MATCH (m: Member {school: $school, disabled: false}) WHERE COALESCE(m.status, "inactive") <> "active" 
            RETURN COUNT(m) as cnt""",
            school=school
        ).evaluate()

    return dict(active=active_users, inactive=inactive_users)


@celery.task(name='tasks.send_invoice', **GLOBAL_CELERY_OPTIONS)
def send_invoice(self, task_data: CreateInvoiceRequest):
    """
    Generate an invoice in Wave accounting software based on the number of active/inactive
    users in Neo4J

    :param task_data: invoice creation request
    """
    logger.info(f"Generating Monthly Invoice for School: {task_data.school}")
    with VaultConnection() as vault:
        school_invoice_config = vault.read_secret(secret_path=f'schools/{task_data.school}/invoicing')

    object_identifiers = WaveAPI.retrieve_invoice_config()
    mutation = gql("""mutation ($input: InvoiceCreateInput!){ invoiceCreate(input: $input){ didSucceed } }""")

    logger.info("Retrieving current inactive/active user accounts")
    user_counts = get_active_inactive_counts(school=task_data.school)

    logger.info(f"{task_data.school} has {user_counts['active']} AUs and {user_counts['inactive']} IUs")

    invoice_create_input: Dict = {
        'businessId': object_identifiers['business_id'],
        'customerId': object_identifiers['customers'][task_data.school],
        'dueDate': (get_pst_time() + timedelta(days=object_identifiers['due_days'])).strftime(DATE_FORMAT),
        'items': [
            {'productId': object_identifiers['services']['active_user'],
             'unitPrice': school_invoice_config['per_active_user'], 'quantity': user_counts['active']},
            {'productId': object_identifiers['services']['inactive_user'],
             'unitPrice': school_invoice_config['per_inactive_user'], 'quantity': user_counts['inactive']}
        ]
    }

    logger.info(f"Sending Invoice for {task_data.school} with {invoice_create_input}")
    WaveAPI.send_request(gql=mutation, variable_values=dict(input=invoice_create_input))


@celery.task(name='tasks.send_daily_digest', **GLOBAL_CELERY_OPTIONS)
def send_daily_digest(self, task_data: DailyDigestRequest, sender: User = None):
    """
    Periodically send a daily digest to a specified school
    containing a list of individuals who haven't yet reported.

    :param task_data: daily digest request with school (must match Neo4J)
    :param sender: a single (authorized) user to send the daily digest to, rather than the whole group
    """
    logger.info(f"Sending Daily Digest for School: {task_data.school}")
    day_node = current_day_node(school=task_data.school)  # get or create current day node in graph

    with VaultConnection() as vault:
        digest_config = vault.read_secret(secret_path=f'schools/{task_data.school}/daily_digest_config')
        ignore_vaccine = digest_config['ignore_vaccine']
        authorized_recipients = digest_config['recipients']

    with Neo4JGraph() as g:
        no_report_members = [member['email'] for member in list(g.run(
            f"""MATCH (m: Member {{school: $school}}) WHERE NOT EXISTS {{
                    MATCH (m)-[:reported]-(d: DailyReport {{date: $date}})
             }} AND m.location = $allowed_loc {"" if ignore_vaccine else 'AND COALESCE(m.vaccinated, "") <> $fully_vax'}
              AND m.disabled = false
             RETURN m.email as email ORDER BY email""",
            school=task_data.school, allowed_loc=UserLocationStatus.CAMPUS.value, date=day_node["date"],
            fully_vax=VaccinationStatus.VACCINATED
        )) if not member['email'] in digest_config['exclusions']]

        logger.info(f"Located {len(no_report_members)} members with no report.")

    if sender:
        assert sender.email.lower() in authorized_recipients or sender.email.lower() \
               in SendgridAPI.retrieve_sendgrid_config(field='bcc_emails'), "User is not authorized to receive digests"

    SendgridAPI.send_email(
        template_name='daily_digest',
        recipients=[sender.email] if sender else authorized_recipients,  # send only to single user/all users
        template_data={
            'no_report': no_report_members,
            'date': get_pst_time().strftime('%m/%d/%Y')
        }
    )
    logger.info("Done.")
