"""
Operation Handling and Callbacks from Flask API
"""
from worker import celery
from shared.neo4j import Member, Neo4JConfig
from shared.school import Schools


class Callbacks:
    """
    Callbacks for API Routes
    """

    @staticmethod
    def list_users(*, logger, flask_request):
        """
        List the Users in the Neo4J
        :param logger: Flask App Logger
        :param flask_request: Flask request object
        :return: list of member emails objects
        """
        logger.info("Processing List Users Query...")
        school = flask_request.headers['X-School']
        if not Schools.is_valid(school):
            logger.warn("Invalid School specified... Terminating Request")
            raise Exception(f"Invalid School {school}")

        with Neo4JConfig.acquire_graph() as g:
            logger.info("Acquired Neo4J Graph... Running Selection query")
            result_set = Member.select(g).where(school=school).all()

        return [member.email for member in result_set]

    @staticmethod
    def report_interaction(*, logger, flask_request):
        """
        Asynchronously Log an Interaction between two individuals, offloading the task to celery via Redis.
        :param logger: Flask App Logger
        :param flask_request: Flask request object
        :return: Celery task ID
        """
        logger.info("Processing Interaction Reporting Query...")
        try:
            task = celery.send_task('tasks.report_interaction', args=[], kwargs={
                'memberA': flask_request.json['memberA'],
                'memberB': flask_request.json['memberB'],
                'school': flask_request.headers['X-School']
            })
            logger.info("Offloaded Task to Redis Queue")
            return task.id  # Celery assigned task id after inserting into Redis
        except KeyError as e:
            logger.exception("Encountered Key Error:")
            raise Exception(f"Missing Parameter in Body/HTTP Header: {e}")

    @staticmethod
    def notify_risk(*, logger, flask_request):
        """
        Asynchronously notify school administrators of COVID-19 Risk
        within their community by offloading request to Celery via Redis
        :param logger: Flask App Logger
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
        return {
            Operations.OPERATION_MAP[operation]
        }
