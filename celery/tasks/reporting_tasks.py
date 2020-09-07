from py2neo import Relationship, RelationshipMatcher

from shared.logger import logger
from shared.models import (InteractionReport, RiskNotification, SymptomReport,
                           TestReport, TestType, User, UserStatus)
from shared.service.celery_config import CELERY_RETRY_OPTIONS, celery
from shared.service.neo_config import acquire_db_graph
from shared.service.vault_config import VaultConnection
from shared.utilities import pst_timestamp

from .utilities import update_active_user_report


@celery.task(name='tasks.report_interaction', **CELERY_RETRY_OPTIONS)
def report_interaction(self, *, user: User, task_data: InteractionReport):
    """
    Asynchronously log an interaction between two members of the school
    :param user: authorized user model
    :param task_data: interaction report model
    """
    logger.info("Reporting interaction for the authorized user.")
    with acquire_db_graph() as g:
        authorized_user_node = g.nodes.match("Member", email=user.email, school=user.school).first()
        for target_member in task_data.targets:
            interacted_user = g.nodes.match('Member', email=target_member, school=user.school).first()
            if not interacted_user:
                logger.error(f"Cannot locate node with email {target_member} and school {user.school}")

            # If a relationship already exists, we just update the timestamp
            edge_matcher = RelationshipMatcher(graph=g)
            relationship = edge_matcher.match({authorized_user_node, interacted_user}).first()
            if relationship:
                logger.info("Found existing graph edge between specified targets... updating timestamp")
                relationship['timestamp'] = round(pst_timestamp())
                g.push(relationship)
            else:
                g.create(Relationship(authorized_user_node, "interacted_with", interacted_user,
                                      timestamp=pst_timestamp()))


@celery.task(name='tasks.report_test', **CELERY_RETRY_OPTIONS)
def report_test(self, *, user: User, task_data: TestReport):
    """
    Asynchronously add a test report edge from the authorized user to the current day
    :param user: authorized user model
    :param task_data: test report model
    """
    logger.info("Adding test report to daily record for authorized user...")
    update_active_user_report(user=user, report=task_data)

    if task_data.test_type == TestType.POSITIVE:
        task_id = user.queue_task(task_name='tasks.notify_risk',
                                  task_data=RiskNotification(criteria=task_data.get_test()))
        logger.warning(f"*Test indicates that the authorized user has COVID-19. Notifying risk with task id {task_id}*")


@celery.task(name='tasks.report_symptoms', **CELERY_RETRY_OPTIONS)
def report_symptoms(self, *, user: User, task_data: SymptomReport):
    """
    Asynchronously add symptom report edge from the authorized user to the current day
    :param user: authorized user model
    :param task_data: symptom report model
    """
    logger.info("Adding symptom report to daily record for authorized user...")
    update_active_user_report(user=user, report=task_data)

    with VaultConnection() as vault:
        min_symptoms = vault.read_secret(secret_path=f'schools/{user.school}/symptom_criteria')['minimum_symptoms']

    if task_data.num_symptoms >= int(min_symptoms):  # notify the administrators of potential risk
        task_id = user.queue_task(task_name='tasks.notify_risk',
                                  task_data=RiskNotification(criteria=f"{task_data.num_symptoms} symptoms"))
        logger.warning(f"*Symptoms indicate possible COVID 19. Notifying risk with task id {task_id}*")


@celery.task(name='tasks.report_active_user', **CELERY_RETRY_OPTIONS)
def report_active_user(self, *, user: User):
    """
    Asynchronously update the authorized user's status to active
    :param user: authorized user model
    """
    logger.info("Setting authorized user's state to active...")
    with acquire_db_graph() as g:
        authorized_user_node = g.nodes.match("Member", email=user.email, school=user.school).first()
        authorized_user_node['status'] = UserStatus.ACTIVE.value
        g.push(authorized_user_node)
