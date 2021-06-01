from celery import group, states

from shared.logger import logger
from shared.models.enums import UserStatus
from shared.models.user_entities import (MultipleUserIdentifiers,
                                         UserIdentifier)
from shared.models.dashboard_entities import AdminDashboardUser
from shared.models.user_mgmt_entitities import (AddCommunityMemberRequest,
                                                BulkAddCommunityMemberRequest,
                                                BulkSwitchReportNodeRequest,
                                                BulkToggleAccessRequest,
                                                SwitchReportNodeRequest,
                                                ToggleAccessRequest)
from shared.service.celery_wrapper import GLOBAL_CELERY_OPTIONS, get_celery
from shared.service.neo4j_api import Neo4JGraph

from .user_mgmt_helpers.helpers import (add_user_to_role, create_user,
                                        delete_user, get_user,
                                        remove_community_roles,
                                        send_campus_switch_email,
                                        send_password_reset, update_user)

celery = get_celery()


@celery.task(name='tasks.admin_create_user', **GLOBAL_CELERY_OPTIONS)
def admin_create_user(self, *, sender: AdminDashboardUser, task_data: AddCommunityMemberRequest):
    """
    Create a user in Auth0 and Neo4j asynchronously
    :param sender: the admin user who sent the request
    :param task_data: the add community member request
    """
    logger.info(f"Adding user {task_data.email} to Auth0 at the request of {sender.email}")
    existing_user = get_user(email=task_data.email, fields=['user_id'])

    if not existing_user:
        created_user_id = create_user(email=task_data.email, first_name=task_data.first_name,
                                      last_name=task_data.last_name)
        add_user_to_role(user_id=created_user_id, school=sender.school)
        send_password_reset(email=task_data.email, first_name=task_data.first_name)
    else:
        # the user could not be created because of a conflict, switch their report node
        # to the school we are dealing with.
        admin_switch_report_node(
            sender=sender,
            task_data=SwitchReportNodeRequest(
                email=task_data.email,
                target_campus=sender.school,
                auth0_id=existing_user['user_id']  # provide the id since we already know it
            ), merge_existing_node=False)

    with Neo4JGraph() as graph:
        # we do an optional match because we don't want a duplicate node if the user already exists
        graph.run("""MERGE (m: Member {email: $email, school: $school})
                    SET m.first_name=$first_name, m.last_name=$last_name, m.location=$location, 
                    m.vaccinated=$vaccination, m.disabled=false, m.status='inactive'""",
                  first_name=task_data.first_name, last_name=task_data.last_name, email=task_data.email,
                  location=task_data.location, vaccination=task_data.vaccinated, school=sender.school)


@celery.task(name='tasks.admin_switch_report_node', **GLOBAL_CELERY_OPTIONS)
def admin_switch_report_node(self, *, sender: AdminDashboardUser, task_data: SwitchReportNodeRequest,
                             merge_existing_node: bool = True):
    """
    Switch a user's health record to another campus. Creates the record if it doesn't exist.
    :param sender: the user that initiated the task
    :param task_data: a request payload to switch a user's health record
    :param merge_existing_node: whether or not to merge the user properties from the existing user into a new node.
    """
    logger.info(f"Switching health record of {task_data.email} to {task_data.target_campus} at the request of "
                f"{sender.email}")

    if not sender.can_manage(school=task_data.target_campus): # TODO: check perms over old node
        logger.warning(f"**{sender.email} is not permitted to administrate over {task_data.target_campus}**")
        raise Exception(f'Admin is not permitted to administrate over {task_data.target_campus}')

    user_id = task_data.auth0_id or get_user(email=task_data.email, fields=['user_id'])['user_id']
    remove_community_roles(user_id=user_id)  # remove only the user's community roles
    add_user_to_role(user_id=user_id, school=task_data.target_campus)

    with Neo4JGraph() as graph:
        logger.info("Setting other user records to inactive")
        transaction = graph.begin()
        if merge_existing_node:
            transaction.run("""MATCH (m: Member {email: $email})
                               MERGE (n: Member {email: $email, school: $target_campus})
                               SET n.first_name=m.first_name, n.last_name=m.last_name, n.vaccinated=m.vaccinated,
                               n.disabled=m.disabled, n.location=m.location, n.status='inactive'
                            """, email=task_data.email, target_campus=task_data.target_campus,
                            switched_status=UserStatus.SCHOOL_SWITCHED)
        transaction.run(
            """MATCH (member {email: $email}) WHERE member.school <> $target_campus 
            SET member.status=$switched_status""",
            email=task_data.email, target_campus=task_data.target_campus, switched_status=UserStatus.SCHOOL_SWITCHED
        )

        transaction.commit()

    logger.info("Migrated User in Database... Sending SendGrid Campus Switch Notification")
    send_campus_switch_email(email=task_data.email, school=task_data.target_campus)


@celery.task(name='tasks.admin_password_reset', **GLOBAL_CELERY_OPTIONS)
def admin_password_reset(self, *, sender: AdminDashboardUser, task_data: UserIdentifier):
    """
    Resend a change password invite to a given user
    :param sender: the user that initiated the task
    :param task_data: a user identifier containing an email for which to send a password resest
    """
    logger.info(f"Sending password reset to {task_data.email} at the request of {sender.email}")
    send_password_reset(email=task_data.email)


@celery.task(name='tasks.admin_delete_user', **GLOBAL_CELERY_OPTIONS)
def admin_delete_user(self, *, sender: AdminDashboardUser, task_data: UserIdentifier):
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
def admin_delete_user_copy(self, *, sender: AdminDashboardUser, task_data: UserIdentifier):
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
def admin_toggle_access(self, *, sender: AdminDashboardUser, task_data: ToggleAccessRequest):
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
def admin_bulk_import(self, *, sender: AdminDashboardUser, task_data: BulkAddCommunityMemberRequest):
    """
    Bulk import a set of users into Auth0 and Neo4J.
    :param sender: the sender of the task
    :param task_data: a list of users to import into Neo4J and Auth0
    """
    # list of celery jobs to complete in parallel
    create_sigs = [admin_create_user.s(task_data=user, sender=sender) for user in task_data.users]
    logger.info(f"Importing {len(create_sigs)} users into MarinTrace for {sender.email}")
    group(create_sigs).apply_async()


@celery.task(name='tasks.admin_bulk_switch_node', **GLOBAL_CELERY_OPTIONS)
def admin_bulk_switch_health_record(self, *, sender: AdminDashboardUser, task_data: BulkSwitchReportNodeRequest):
    """
    Bulk switch a set of user's health record
    :param sender: the sender of the task
    :param task_data: a list of requests to change a user's report node
    """
    switch_sigs = [admin_switch_report_node.s(task_data=req, sender=sender) for req in task_data.requests]
    logger.info(f"Switching the report nodes for {len(switch_sigs)} users for {sender.email}")
    group(switch_sigs).apply_async()


@celery.task(name='tasks.admin_bulk_password_reset', **GLOBAL_CELERY_OPTIONS)
def admin_bulk_password_reset(self, *, sender: AdminDashboardUser, task_data: MultipleUserIdentifiers):
    """
    Bulk reset the passwords for a set of users.
    :param sender: the sender of the task
    :param task_data: a list of identifiers to reset the passwords for
    """
    reset_sigs = [admin_password_reset.s(task_data=identifier, sender=sender) for identifier in
                  task_data.identifiers]
    logger.info(f"Resetting the passwords of {len(reset_sigs)} users from MarinTrace for {sender.email}")
    group(reset_sigs).apply_async()


@celery.task(name='tasks.admin_bulk_delete_user', **GLOBAL_CELERY_OPTIONS)
def admin_bulk_delete_users(self, *, sender: AdminDashboardUser, task_data: MultipleUserIdentifiers):
    """
    Bulk delete a set of users in Auth0 and Neo4j.
    :param sender: the sender of the task
    :param task_data: a list of user identifiers to delete
    """
    delete_sigs = [admin_delete_user.s(task_data=identifier, sender=sender) for identifier in task_data.identifiers]
    logger.info(f"Deleting {len(delete_sigs)} users from MarinTrace for {sender.email}")
    group(delete_sigs).apply_async()


@celery.task(name='tasks.admin_bulk_toggle_access', **GLOBAL_CELERY_OPTIONS)
def admin_bulk_toggle_access(self, *, sender: AdminDashboardUser, task_data: BulkToggleAccessRequest):
    """
    Bulk enables/disables a set of users in Auth0, revoking their JWTs.
    :param sender: the sender of the task
    :param task_data: a list of emails and access states
    """
    toggle_sigs = [admin_toggle_access.s(task_data=user, sender=sender) for user in task_data.users]
    logger.info(f"Changing access for {len(toggle_sigs)} users for {sender.email}")
    group(toggle_sigs).apply_async()
