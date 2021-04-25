from fastapi import APIRouter, status

from shared.logger import logger
from shared.models.dashboard_entities import (AdminDashboardUser, Paginated)
from shared.models.user_entities import CreatedAsyncTask, UserIdentifier
from shared.models.user_mgmt_entitities import AddCommunityMemberRequest, ToggleAccessRequest

from .authorization import OIDC_COOKIE

USER_MGMT_ROUTER = APIRouter()

GENERAL_ASYNC_PARAMS = dict(
    response_model=CreatedAsyncTask,
    status_code=status.HTTP_202_ACCEPTED
)


@USER_MGMT_ROUTER.post('/create-user', operation_id='admin_create_user',
                       description='Add a community user to MarinTrace, provisioning them in SSO and the DB',
                       **GENERAL_ASYNC_PARAMS)
async def create_user(target: AddCommunityMemberRequest, admin: AdminDashboardUser = OIDC_COOKIE):
    """
    Add a new community user to Auth0 and Neo4J
    * Requires a User payload with email, first name, and last name in an HTTP POST Request
    * Requires OIDC Cookie (kc-access) with a Auth0 JWT
    """
    logger.info("Processing Create Community Member Request...")
    return CreatedAsyncTask(task_id=admin.queue_task(task_name='tasks.admin_create_user',
                                                     task_data=target))


@USER_MGMT_ROUTER.delete('/delete-user', operation_id='admin_delete_user',
                         description='Delete a community member from MarinTrace, from SSO and DB',
                         **GENERAL_ASYNC_PARAMS)
async def delete_user(request: UserIdentifier, admin: AdminDashboardUser = OIDC_COOKIE):
    """
    Delete a specified community member from MarinTrace
    * Requires a User email to delete from the database
    * Requires an OIDC cookie (kc-access) with an Auth0 JWT
    """
    logger.info("Processing Delete Community Member Request...")
    return CreatedAsyncTask(task_id=admin.queue_task(task_name='tasks.admin_delete_user',
                                                     task_data=request))


@USER_MGMT_ROUTER.post('/toggle-access', operation_id='admin_toggle_access',
                       description='Toggle the ability to use MarinTrace for a member')
async def toggle_access(request: ToggleAccessRequest, admin: AdminDashboardUser = OIDC_COOKIE):
    """
    Toggle a user's ability to use MarinTrace
    * Requires a Toggle Access Request payload with the user's id and whether to block them or not
    * Requires an OIDC cookie (kc-access) with an Auth0 JWT
    """
    logger.info("Processing Toggle Access Request...")
    return CreatedAsyncTask(task_id=admin.queue_task(task_name='tasks.admin_toggle_access',
                                                     task_data=request))
