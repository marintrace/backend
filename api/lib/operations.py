"""
Operation Handling and Callbacks from Flask API
"""
from py2neo.matching import NodeMatcher

from worker import celery
from shared.neo4j import Neo4JConfig
from shared.school import Schools
import logging

logger = logging.getLogger('app.operations')


class Callbacks:
    """
    Callbacks for API Routes
    """

    @staticmethod
    def list_users(*, flask_request):
        """
        List the Users in the Neo4J
        :param flask_request: Flask request object
        :return: list of member emails objects
        """
        logger.info("Processing List Users Query...")
        try:
            school = flask_request.headers['X-School']
            if not Schools.is_valid(school):
                logger.warning("Invalid School specified... Terminating Request")
                raise Exception(f"Invalid School '{school}'")

            with Neo4JConfig.acquire_graph() as g:
                logger.info("Acquired Neo4J Graph... Running Selection query")
                result_set = list(NodeMatcher(graph=g).match("Member").where(f"_.school = '{school}'"))
            return [
                {'email': member['email'], 'cohort': member['cohort'], 'name': member['name']} for member in result_set
            ]
        except KeyError as e:
            logger.exception(f"Missing Data: '{e}'")
            raise Exception(f"HTTP Header/JSON Property '{e}' is missing")

    @staticmethod
    def report_interaction(*, flask_request):
        """
        Asynchronously Log an Interaction between two individuals, offloading the task to celery via Redis.
        :param flask_request: Flask request object
        :return: Celery task ID
        """
        logger.info("Processing Interaction Reporting Query...")
        try:
            task = celery.send_task('tasks.report_interaction', args=[], kwargs={
                'reporter': flask_request.json['memberA'],
                'targets': flask_request.json['memberB'],
                'school': flask_request.headers['X-School']
            })
            logger.info("Offloaded Task to Redis Queue")
            return task.id  # Celery assigned task id after inserting into Redis
        except KeyError as e:
            logger.exception("Encountered Key Error:")
            raise Exception(f"Missing Parameter in Body/HTTP Header: {e}")

    @staticmethod
    def notify_risk(*, flask_request):
        """
        Asynchronously notify school administrators of COVID-19 Risk
        within their community by offloading request to Celery via Redis
        :param flask_request: Flask request object
        :return: Celery task id
        """
        logger.info("Process Risk Notification Reporting Query...")
        try:
            task = celery.send_task('tasks.notify_risk', args=[], kwargs={
                'member': flask_request.json['member'],
                'criteria': flask_request.json['criteria'],
                'school': flask_request.headers['X-School']
            })
            logger.info("Offloaded Task to Redis Queue")
            return task.id
        except KeyError as e:
            logger.exception("Encountered Key Error:")
            raise Exception(f"Missing Parameter in JSON/Header {e}")


class Operations:
    """
    Operations supported for API
    """
    LIST_USERS = 'list_users'
    REPORT_INTERACTION = 'report_interaction'
    NOTIFY_RISK = 'notify_risk'

    OPERATION_MAP = {
        LIST_USERS: Callbacks.list_users,
        REPORT_INTERACTION: Callbacks.report_interaction,
        NOTIFY_RISK: Callbacks.notify_risk
    }

    @staticmethod
    def build(operation):
        """
        Build an operation function for execution
        :param operation: Operation name (must be in operation hash map)
        :return: Operation callable
        """
        operation_func = Operations.OPERATION_MAP.get(operation)
        if not operation_func:
            raise Exception(f"Invalid operation {operation}")
        return operation_func
