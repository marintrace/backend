import time
import random
from celery import group, states
from shared.logger import logger
from shared.models.user_entities import (MultipleUserIdentifiers, User,
                                         UserIdentifier)
from shared.models.enums import UserStatus
from shared.models.user_mgmt_entitities import (AddCommunityMemberRequest,
                                                BulkAddCommunityMemberRequest,
                                                BulkToggleAccessRequest,
                                                ToggleAccessRequest)
from shared.service.celery_config import GLOBAL_CELERY_OPTIONS, get_celery
from shared.service.neo_config import Neo4JGraph

from .user_mgmt_helpers.helpers import (add_role, create_user, delete_user,
                                        get_user, send_password_reset,
                                        update_user)

celery = get_celery()


@celery.task(name='tasks.admin_create_user', **GLOBAL_CELERY_OPTIONS)
def admin_create_user(self, *, sender: User, task_data: AddCommunityMemberRequest):
    """
    Create a user in Auth0 and Neo4j asynchronously
    :param sender: the admin user who sent the request
    :param task_data: the add community member request
    """
    logger.info(f"Adding user {task_data.email} to Auth0 at the request of {sender.email}")
    created_user_id = create_user(email=task_data.email, first_name=task_data.first_name,
                                  last_name=task_data.last_name)

    if not created_user_id:  # the user could not be created because of a conflict
        logger.info("User could not be created because of a conflict... adding an additional copy of existing user")
        existing_user_id = get_user(email=task_data.email, fields=['user_id'])['user_id']
        add_role(user_id=existing_user_id, school=sender.school)  # allows us to identify which school a user belongs to
    else:
        add_role(user_id=created_user_id, school=sender.school)
        send_password_reset(email=task_data.email, first_name=task_data.first_name)

    with Neo4JGraph() as graph:
        logger.info("Adding Node to Database with Composite Email+School Identifier...")
        graph.run("""OPTIONAL MATCH (m: Member {email: $email, school: $school})
                    WITH m WHERE m IS NULL
                    CREATE (member: Member {first_name: $first_name, last_name: $last_name, email: $email, 
                        location: $location, vaccinated: $vaccination, school: $school, disabled: false})""",
                  first_name=task_data.first_name, last_name=task_data.last_name, email=task_data.email,
                  location=task_data.location, vaccination=task_data.vaccinated, school=sender.school)

        logger.info("Changing the status of other inactive nodes to inactive copies...")
        graph.run("""MATCH (m: Member {email: $email}) WHERE m.school <> $school 
                    SET m.status=$inactive_status""", school=sender.school,
                  inactive_status=UserStatus.INACTIVE_COPY)


@celery.task(name='tasks.admin_password_reset', **GLOBAL_CELERY_OPTIONS)
def admin_password_reset(self, *, sender: User, task_data: UserIdentifier):
    """
    Resend a change password invite to a given user
    :param sender: the user that initiated the task
    :param task_data: a user identifier containing an email for which to send a password resest
    """
    logger.info(f"Sending password reset to {task_data.email} at the request of {sender.email}")
    send_password_reset(email=task_data.email)


@celery.task(name='tasks.admin_delete_user', **GLOBAL_CELERY_OPTIONS)
def admin_delete_user(self, *, sender: User, task_data: UserIdentifier):
    """
    Delete a user from Auth0 and Neo4J
    :param sender: the user that initiated the task
    :param task_data: the user identifier to delete
    """
    logger.info(f"Deleting user {task_data.email} at the request of {sender.email}")
    logger.info(f"Removing user {task_data.email} from Neo4J")
    with Neo4JGraph() as graph:
        # Remove the user from Neo4J and delete all associated edges with the matched node
        graph.run("""MATCH (m: Member {email: $email}) DETACH DELETE m""", email=task_data.email)

    user_id = get_user(email=task_data.email, fields=['user_id'])['user_id']  # get the user's user id from Auth0

    if user_id:
        delete_user(user_id=user_id)


@celery.task(name='tasks.admin_delete_user_copy', **GLOBAL_CELERY_OPTIONS)
def admin_delete_user_copy(self, *, sender: User, task_data: UserIdentifier):
    """
    Delete a user's copy from the database, but leave them in Auth0 (to keep a migration)
    :param sender: the user that initiated the task
    :param task_data: the user id to delete
    """
    logger.info(f"Deleting user copy {task_data.email} at the request of {sender.email}")
    with Neo4JGraph() as graph:
        # Remove the user from Neo4J and delete all associated edges with the matched node
        graph.run("""MATCH (m: Member {email: $email, school: $school}) DETACH DELETE m""",
                  email=task_data.email, school=sender.school)


@celery.task(name='tasks.admin_toggle_access', **GLOBAL_CELERY_OPTIONS)
def admin_toggle_access(self, *, sender: User, task_data: ToggleAccessRequest):
    """
    Toggle a user's access to MarinTrace in Auth0 and Neo4j
    :param sender: the user that initiated the task
    :param task_data: the user identifier to toggle
    """
    logger.info(f"Setting block={task_data.block} for the user {task_data.email} at the request of {sender.email}")

    with Neo4JGraph() as graph:
        graph.run("""MATCH (m: Member {email: $email, school: $school}) SET m.disabled = $blocked""",
                  email=task_data.email, school=sender.school, blocked=task_data.block)

    user_id = get_user(email=task_data.email, fields=['user_id'])['user_id']

    if user_id:
        update_user(user_id=user_id, content={'blocked': task_data.block})
        logger.info(f"Toggling user {task_data.email} in Neo4J")


@celery.task(name='tasks.admin_bulk_import', **GLOBAL_CELERY_OPTIONS)
def admin_bulk_import(self, *, sender: User, task_data: BulkAddCommunityMemberRequest):
    """
    Bulk import a set of users into Auth0 and Neo4J. Processes creating users in parallel
    and waits until all have completed
    :param sender: the sender of the task
    :param task_data: a list of users to import into Neo4J and Auth0
    """
    # list of celery jobs to complete in parallel
    create_sigs = [admin_create_user.s(task_data=user, sender=sender) for user in task_data.users]
    logger.info(f"Importing {len(create_sigs)} users into MarinTrace for {sender.email}")
    group(create_sigs).apply_async()


@celery.task(name='tasks.admin_bulk_password_reset', **GLOBAL_CELERY_OPTIONS)
def admin_bulk_password_reset(self, *, sender: User, task_data: MultipleUserIdentifiers):
    """
    Bulk reset the passwords for a set of users. Processes the tasks in parallel and waits
    until they have all completed
    :param sender: the sender of the task
    :param task_data: a list of identifiers to reset the passwords for
    """
    reset_sigs = [admin_password_reset.s(task_data=identifier, sender=sender) for identifier in task_data.identifiers]
    logger.info(f"Resetting the passwords of {len(reset_sigs)} users from MarinTrace for {sender.email}")
    group(reset_sigs).apply_async()


@celery.task(name='tasks.admin_bulk_delete_user', **GLOBAL_CELERY_OPTIONS)
def admin_bulk_delete_users(self, *, sender: User, task_data: MultipleUserIdentifiers):
    """
    Bulk delete a set of users in Auth0 and Neo4j. Processes deleting users in parallel
    and waits until all have completed
    :param sender: the sender of the task
    :param task_data: a list of user identifiers to delete
    """
    delete_sigs = [admin_delete_user.s(task_data=identifier, sender=sender) for identifier in task_data.identifiers]
    logger.info(f"Deleting {len(delete_sigs)} users from MarinTrace for {sender.email}")
    group(delete_sigs).apply_async()


@celery.task(name='tasks.admin_bulk_toggle_access', **GLOBAL_CELERY_OPTIONS)
def admin_bulk_toggle_access(self, *, sender: User, task_data: BulkToggleAccessRequest):
    """
    Bulk enables/disables a set of users in Auth0, revoking their JWTs. Processes these
    requests in parallel and waits until all have completed
    :param sender: the sender of the task
    :param task_data: a list of emails and access states
    """
    toggle_sigs = [admin_toggle_access.s(task_data=user, sender=sender) for user in task_data.users]
    logger.info(f"Changing access for {len(toggle_sigs)} users for {sender.email}")
    group(toggle_sigs).apply_async()
