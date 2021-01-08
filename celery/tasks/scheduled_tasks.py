from shared.logger import logger
from shared.models.enums import UserLocationStatus
from shared.service.celery_config import GLOBAL_CELERY_OPTIONS, get_celery
from shared.service.email_config import EmailClient
from shared.service.neo_config import Neo4JGraph, current_day_node
from shared.service.vault_config import VaultConnection
from shared.utilities import get_pst_time

EMAIL_CLIENT = EmailClient()

celery = get_celery()


@celery.task(name='tasks.send_daily_digest', **GLOBAL_CELERY_OPTIONS)
def send_daily_digest(self, school: str):
    """
    Periodically send a daily digest to a specified school
    containing a list of individuals who haven't yet reported.

    :param school: school name (must match Neo4J)
    """
    logger.info(f"Sending Daily Digest for School: {school}")
    day_node = current_day_node(school=school)  # get or create current day node in graph
    with Neo4JGraph() as g:
        no_report_members = [member['email'] for member in list(g.run(
            """MATCH (m: Member {school: $school}) WHERE NOT EXISTS {
                    MATCH (m)-[:reported]-(d: DailyReport {date: $date})
             } AND m.location = $allowed_loc
            RETURN m.email as email ORDER BY email""",
            school=school, allowed_loc=UserLocationStatus.CAMPUS.value, date=day_node["date"]
        ))]
        logger.info(f"Located {len(no_report_members)} members with no report.")

    with VaultConnection() as vault:
        digest_config = vault.read_secret(secret_path=f'schools/{school}/daily_digest_config')

    truncated_members = no_report_members[:int(digest_config['max_display'])] if digest_config['max_display'] else \
        no_report_members

    logger.info("Sending Daily Digest")
    EMAIL_CLIENT.setup()
    EMAIL_CLIENT.send_email(
        template_name='daily_digest',
        recipients=digest_config['recipients'].split(','),
        template_data={
            'no_report': truncated_members,
            'date': get_pst_time().strftime('%m/%d/%Y')
        }
    )
    logger.info("Done.")
