from shared.logger import logger
from shared.models.admin_entities import AddCommunityMemberRequest
from shared.models.user_entities import User
from shared.service.celery_config import GLOBAL_CELERY_OPTIONS, get_celery
from shared.service.neo_config import Neo4JGraph

from .helpers.user_mgmt_helpers import (add_role_in_auth0,
                                        create_user_in_auth0,
                                        send_user_password_invite)

celery = get_celery()


@celery.task(name='tasks.admin_create_user', **GLOBAL_CELERY_OPTIONS)
def admin_create_user(self, *, user: User, task_data: AddCommunityMemberRequest):
    """
    Create a user in Auth0 and Neo4j asynchronously
    :param user: the admin user who sent the request
    :param task_data: the add community member request
    """
    logger.info(f"Adding user {task_data.email} to Auth0 at the request of {user.email}")
    user_id = create_user_in_auth0(email=task_data.email, first_name=task_data.first_name,
                                   last_name=task_data.last_name)
    logger.info(f"Adding the role to created user: {user_id}")
    add_role_in_auth0(user_id=user_id, school=user.school)

    with Neo4JGraph() as graph:
        graph.run("""CREATE (m: Member {first_name: $first_name, last_name: $last_name, email: $email, 
                            location: $location, vaccinated: $vaccination})""",
                  first_name=task_data.first_name, last_name=task_data.last_name, email=task_data.email,
                  location=task_data.location, vaccination=task_data.vaccinated)
