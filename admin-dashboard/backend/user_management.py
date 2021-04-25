import csv

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from shared.logger import logger
from shared.models.dashboard_entities import AdminDashboardUser
from shared.models.enums import UserLocationStatus, VaccinationStatus
from shared.models.user_entities import CreatedAsyncTask, UserIdentifier
from shared.models.user_mgmt_entitities import (BULK_IMPORT_SCHEMA,
                                                AddCommunityMemberRequest,
                                                BulkAddCommunityMemberRequest,
                                                ToggleAccessRequest)

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
    reader = csv.DictReader(users.file.readlines())
    if not reader.fieldnames == BULK_IMPORT_SCHEMA:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid CSV format")
    else:
        user_objects = []  # convert csv lines to pydantic models for processing
        for line in reader:
            user_objects.append(AddCommunityMemberRequest(
                first_name=line['FirstName'],
                last_name=line['LastName'],
                email=line['Email'],
                vaccinated=VaccinationStatus.from_radio(line['Vaccinated']),  # convert yes/no to vaccination enum
                location=line['Location']
            ))
        return CreatedAsyncTask(task_id=admin.queue_task(task_name='tasks.admin_bulk_import',
                                                         task_data=BulkAddCommunityMemberRequest(users=user_objects)))


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
