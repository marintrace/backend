from py2neo import Relationship, RelationshipMatcher
from pydantic import BaseModel

from shared.logger import logger
from shared.models import (HealthReport, InteractionReport, User, ScoredUserRiskItem, UserStatus)
from shared.service.celery_config import CELERY_RETRY_OPTIONS, get_celery
from shared.service.neo_config import Neo4JGraph, current_day_node
from shared.service.vault_config import VaultConnection
from shared.utilities import pst_timestamp

celery = get_celery()


def update_active_user_report(user: User, report: BaseModel, additional_data=None):
    """
    Add a Report Relationship between the specified user and the school's
    day tracking node
    :param user: authorized user
    :param report: the report model
    :param additional_data: dictionary of additional data to store as edge properties
    """
    with Neo4JGraph() as g:
        authorized_user_node = g.nodes.match("Member", email=user.email, school=user.school).first()
        day_node = current_day_node(school=user.school)
        graph_edge = RelationshipMatcher(graph=g).match(nodes={authorized_user_node, day_node}).first()
        if graph_edge:
            logger.info("Found existing graph edge between user and school day node. Updating with new properties...")
            for prop, value in report:
                graph_edge[prop] = value
            for additional_key in ({} or additional_data):
                graph_edge[additional_key] = additional_data[additional_key]
            g.push(graph_edge)
        else:
            g.create(Relationship(authorized_user_node, "reported", day_node, **report.dict()))


@celery.task(name='tasks.report_interaction', **CELERY_RETRY_OPTIONS)
def report_interaction(self, *, user: User, task_data: InteractionReport):
    """
    Asynchronously log an interaction between two members of the school
    :param user: authorized user model
    :param task_data: interaction report model
    """
    logger.info("Reporting interaction for the authorized user.")
    with Neo4JGraph() as g:
        authorized_user_node = g.nodes.match("Member", email=user.email, school=user.school).first()
        for target_member in task_data.targets:
            interacted_user = g.nodes.match('Member', email=target_member, school=user.school).first()
            if not interacted_user:
                logger.error(f"Cannot locate node with email {target_member} and school {user.school}- Skipping")
                continue

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


@celery.task(name='tasks.report_health', **CELERY_RETRY_OPTIONS)
def report_health(self, *, user: User, task_data: HealthReport):
    """
    Asynchronously add daily report edge from the authorized user to the current day
    :param user: authorized user model
    :param task_data: daily report model
    """
    logger.info("Adding health report to daily record for authorized user...")

    with VaultConnection() as vault:
        min_symptoms = vault.read_secret(secret_path=f'schools/{user.school}/symptom_criteria')['minimum_symptoms']

    user_risk = ScoredUserRiskItem().from_health_report(health_report=task_data, min_risk_symptoms=int(min_symptoms))
    update_active_user_report(user=user, report=task_data, additional_data={'risk_score': user_risk.risk_score})

    if user_risk.at_risk(include_warning=False):
        task_id = user.queue_task(task_name='tasks.notify_risk',
                                  task_data=user_risk)
        logger.warning(f"*Health Report indicate possible COVID 19. Notifying risk with task id {task_id}*")


@celery.task(name='tasks.report_active_user', **CELERY_RETRY_OPTIONS)
def report_active_user(self, *, user: User):
    """
    Asynchronously update the authorized user's status to active
    :param user: authorized user model
    """
    logger.info("Setting authorized user's state to active...")
    with Neo4JGraph() as g:
        authorized_user_node = g.nodes.match("Member", email=user.email, school=user.school).first()
        authorized_user_node['status'] = UserStatus.ACTIVE.value
        g.push(authorized_user_node)
