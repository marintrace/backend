import csv

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from shared.logger import logger
from shared.models.dashboard_entities import (AdminDashboardUser,
                                              OptIdPaginationRequest)
from shared.models.enums import VaccinationStatus
from shared.models.user_entities import CreatedAsyncTask, UserIdentifier, MultipleUserIdentifiers
from shared.models.user_mgmt_entitities import (BULK_IMPORT_SCHEMA,
                                                AddCommunityMemberRequest,
                                                BulkAddCommunityMemberRequest,
                                                MemberAccessInfo,
                                                BulkToggleAccessRequest,
                                                MultipleMemberAccessInfo,
                                                ToggleAccessRequest)
from shared.service.neo_config import Neo4JGraph

from .authorization import OIDC_COOKIE

USER_MGMT_ROUTER = APIRouter()

GENERAL_ASYNC_PARAMS = dict(
    response_model=CreatedAsyncTask,
    status_code=status.HTTP_202_ACCEPTED
)


@USER_MGMT_ROUTER.post('/bulk-import-users', operation_id='admin_bulk_import',
                       description='Bulk import users from a CSV to MarinTrace, provisioning them in SSO and the DB')
async def bulk_import(users: UploadFile = File(...), admin: AdminDashboardUser = OIDC_COOKIE):
    """
    Bulk import a set of community users, provisioning them in Auth0 and in the Database
    * Requires a CSV file with the schema provided in static/sample_files/sample_import.csv
    * Requires an OIDC Cookie (kc-access) with an Auth0 JWT
    """
    logger.info(f"Processing Bulk Import Request for {admin.school}...")
    # Decode the user bytes object into text so we can process it
    reader = csv.DictReader((await users.read()).decode('utf-8-sig').split('\n'))

    if not reader.fieldnames == BULK_IMPORT_SCHEMA:
        logger.error(f"Invalid CSV Schema Provided: {reader.fieldnames}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid CSV format")

    user_objects = []  # convert csv lines to pydantic models for processing and serialization via pickle
    for line in reader:
        user_objects.append(AddCommunityMemberRequest(
            first_name=line['FirstName'],
            last_name=line['LastName'],
            email=line['Email'],
            vaccinated=VaccinationStatus.from_radio(line['Vaccinated']),  # convert yes/no to vaccination enum
            location=line['Location']
        ))
    return CreatedAsyncTask(task_id=admin.queue_task(task_name='tasks.admin_bulk_import',
                                                     task_data=BulkAddCommunityMemberRequest(users=user_objects),
                                                     compression='lzma'))


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


@USER_MGMT_ROUTER.delete('/delete-users', operation_id='admin_delete_user',
                         description='Delete a community member from MarinTrace, from SSO and DB',
                         **GENERAL_ASYNC_PARAMS)
async def delete_user(request: MultipleUserIdentifiers, admin: AdminDashboardUser = OIDC_COOKIE):
    """
    Delete a specified community member from MarinTrace
    * Requires a User email to delete from the database
    * Requires an OIDC cookie (kc-access) with an Auth0 JWT
    """
    logger.info("Processing Delete Community Member Request...")
    return CreatedAsyncTask(task_id=admin.queue_task(task_name='tasks.admin_bulk_delete_user',
                                                     task_data=request))


@USER_MGMT_ROUTER.post('/toggle-access', operation_id='admin_bulk_toggle_access')
async def toggle_access(request: BulkToggleAccessRequest, admin: AdminDashboardUser = OIDC_COOKIE):
    """
    Toggle multiple user's abilities to use MarinTrace
    * Requires a Bulk Toggle Access Request payload with one or more user's email (id) and whether to block them or not
    * Requires an OIDC cookie (kc-access) with an Auth0 JWT
    """
    logger.info(f"Processing Bulk Toggle Access Request for {len(request.users)} users...")
    return CreatedAsyncTask(task_id=admin.queue_task(task_name='tasks.admin_bulk_toggle_access',
                                                     task_data=request))


@USER_MGMT_ROUTER.post('/password-reset', operation_id='admin_bulk_password_reset',
                       description='Send a password reset invite to multiple emails')
async def password_reset(request: MultipleUserIdentifiers, admin: AdminDashboardUser = OIDC_COOKIE):
    """
    Send a password reset email to multiple users
    * Requires a list of user emails
    * Requires an OIDC cookie (kc-access) with an Auth0 JWT
    """
    logger.info("Processing Bulk Password Reset Request")
    return CreatedAsyncTask(task_id=admin.queue_task(task_name='tasks.admin_bulk_password_reset',
                                                     task_data=request))


@USER_MGMT_ROUTER.post('/paginate-users', operation_id='admin_paginate_users',
                       description='Paginate a list of users in the database')
async def paginate_users(request: OptIdPaginationRequest, admin: AdminDashboardUser = OIDC_COOKIE):
    """
    Paginate a list of users from MarinTrace
    * Requires a pagination token and limit in JSON body
    * Requires an OIDC cookie (kc-access) with an Auth0 JWT
    """
    logger.info("Processing User Pagination Request...")
    with Neo4JGraph() as graph:
        records = list(graph.run(
            f"""MATCH (m: Member {{school: $school}})
            {"WHERE m.email STARTS WITH $email" if request.email else ''}
            RETURN m as member ORDER BY m.email
            SKIP $pag_token LIMIT $limit
            """, school=admin.school, email=request.email, pag_token=request.pagination_token,
            limit=request.limit
        ))

    details = []
    for record in records:
        member = record['member']
        details.append(MemberAccessInfo(email=member['email'], name=f"{member['first_name']} {member['last_name']}",
                                        blocked=member['disabled'], active=member['active']))

    return MultipleMemberAccessInfo(users=details, pagination_token=request.pagination_token + request.limit)
