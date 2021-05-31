from py2neo import Relationship, RelationshipMatcher

from shared.date_utils import pst_timestamp
from shared.logger import logger
from shared.models.dashboard_entities import (AdminHealthReport,
                                              UpdateLocationRequest,
                                              UpdateVaccinationRequest)
from shared.models.enums import UserStatus, VaccinationStatus
from shared.models.risk_entities import ScoredUserHealthItem
from shared.models.user_entities import HealthReport, InteractionReport, User
from shared.service.celery_wrapper import GLOBAL_CELERY_OPTIONS, get_celery
from shared.service.neo4j_api import Neo4JGraph, current_day_node

celery = get_celery()


def add_health_report(sender: User, report: HealthReport, additional_data: dict = None):
    """
    Add a Report Relationship between the specified user and the school's
    day tracking node
    :param sender: authorized user
    :param report: the report model
    :param additional_data: dictionary of additional data to store as edge properties
    """
    with Neo4JGraph() as g:
        authorized_user_node = g.nodes.match("Member", email=sender.email, school=sender.school).first()
        if authorized_user_node.get('status') == UserStatus.SCHOOL_SWITCHED:
            logger.warning("Cannot create reports for a node that was switched to a different campus!")
            return

        day_node = current_day_node(school=sender.school)
        graph_edge = RelationshipMatcher(graph=g).match(nodes={authorized_user_node, day_node}).first()
        if graph_edge:  # if we already have an existing report
            logger.info("Found existing graph edge between user and school day node. Updating with new properties...")
            serialized_report = report.dict()
            # we don't want users overwriting reports to bypass check in—we only allow overwriting by admin
            if isinstance(report, AdminHealthReport) or report.test_only():
                logger.info("Unlocking Report...")
                for prop in serialized_report:
                    if serialized_report[prop] is not None:
                        graph_edge[prop] = serialized_report[prop]
                for additional_key in ({} or additional_data):
                    graph_edge[additional_key] = additional_data[additional_key]
                g.push(graph_edge)
            else:
                logger.info("Report is locked... skipping.")
        else:
            serialized_report = report.dict()
            for additional_key in ({} or additional_data):
                serialized_report[additional_key] = additional_data[additional_key]

            g.create(Relationship(
                authorized_user_node, "reported", day_node,
                **serialized_report
            ))


def update_user_properties(sender: User, data: dict, change_all_nodes: bool = True):
    """
    Update/Add information on a user node
    :param sender: the user to update properties on
    :param data: data to upsert into the user node
    :param change_all_nodes: whether or not to change all nodes (across all campuses) - default true
    """
    logger.info(f"Updating user properties for authorized user across all copies.")
    with Neo4JGraph() as graph:

        if change_all_nodes:
            matches = graph.nodes.match("Member", email=sender.email)
        else:
            matches = graph.nodes.match("Member", email=sender.email, school=sender.school)

        for node in matches:
            for prop, value in data.items():
                node[prop] = value
            graph.push(node)


@celery.task(name='tasks.report_interaction', **GLOBAL_CELERY_OPTIONS)
def report_interaction(self, *, sender: User, task_data: InteractionReport):
    """
    Asynchronously log an interaction between two members of the school
    :param sender: authorized user model
    :param task_data: interaction report model
    """
    logger.info("Reporting interaction for the authorized user.")
    with Neo4JGraph() as g:
        authorized_user_node = g.nodes.match("Member", email=sender.email, school=sender.school).first()

        if authorized_user_node.get('status') == UserStatus.SCHOOL_SWITCHED:
            logger.warning("Cannot report interaction for an inactive copy...")
            return

        for target_member in task_data.targets:
            interacted_user = g.nodes.match('Member', email=target_member, school=sender.school).first()
            if not interacted_user:
                logger.error(f"Cannot locate node with email {target_member} and school {sender.school}- Skipping")
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


@celery.task(name='tasks.report_health', **GLOBAL_CELERY_OPTIONS)
def report_health(self, *, sender: User, task_data: HealthReport):
    """
    Asynchronously add daily report edge from the authorized user to the current day
    :param sender: authorized user model
    :param task_data: daily report model
    """
    logger.info("Adding health report to daily record for authorized user...")

    user_risk = ScoredUserHealthItem(school=sender.school).from_health_report(health_report=task_data)

    logger.info(f"Updating user risk: {task_data}")
    add_health_report(sender=sender, report=task_data, additional_data={'risk_score': user_risk.risk_score})

    if user_risk.at_risk(include_warning=False):
        task_id = sender.queue_task(task_name='tasks.notify_risk',
                                    task_data=user_risk)
        logger.warning(f"*Health Report indicates possible COVID-19. Notifying risk with task id {task_id}*")


@celery.task(name='tasks.report_vaccination', **GLOBAL_CELERY_OPTIONS)
def report_vaccination(self, *, sender: User, task_data: UpdateVaccinationRequest):
    """
    Asynchronously update the user to be vaccinated
    :param sender: authorized user model
    :param task_data: API request from API
    """
    logger.info("Setting authorized user's vaccination status to 'vaccinated'")
    update_user_properties(sender=sender, data={'vaccinated': task_data.status}, change_all_nodes=True)


@celery.task(name='tasks.report_active_user', **GLOBAL_CELERY_OPTIONS)
def report_active_user(self, *, sender: User):
    """
    Asynchronously update the authorized user's status to active
    :param sender: authorized user model
    """
    logger.info("Setting authorized user's state to active...")
    # we don't want to change school-switched nodes to active
    update_user_properties(sender=sender, data={'status': UserStatus.ACTIVE.value}, change_all_nodes=False)


@celery.task(name='tasks.report_location_status', **GLOBAL_CELERY_OPTIONS)
def report_location_status(self, *, sender: User, task_data: UpdateLocationRequest):
    """
    Asynchronously update authorized user's location status
    :param sender: Assumed location change target user
    :param task_data: API request from API
    """
    logger.info(f"Setting authorized user's location state to {task_data.location}... authorized by {sender.email}")
    update_user_properties(sender=sender, data={'location': task_data.location}, change_all_nodes=False)
