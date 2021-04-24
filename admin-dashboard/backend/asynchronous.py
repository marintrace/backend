from fastapi import APIRouter, status

from shared.logger import logger
from shared.models.admin_entities import (AdminDashboardUser,
                                          AdminHealthReport,
                                          DailyDigestRequest,
                                          UpdateLocationRequest,
                                          UpdateVaccinationRequest)
from shared.models.user_entities import CreatedAsyncTask, User

from .authorization import OIDC_COOKIE

ASYNC_ROUTER = APIRouter()

GENERAL_ASYNC_PARAMS = dict(
    response_model=CreatedAsyncTask,
    status_code=status.HTTP_202_ACCEPTED
)


@ASYNC_ROUTER.post("/queue-location-change", operation_id="update_user_location",
                   description="Queue a location change for a user from admin dashboard", **GENERAL_ASYNC_PARAMS)
async def queue_location_change(location_change: UpdateLocationRequest, admin: AdminDashboardUser = OIDC_COOKIE):
    """
    Queue a user location change in the backend. Allows administrators to change
    whether or not users can receive "healthy" statuses
    * Requires a Location Change Payload in an HTTP POST Request
    * Requires OIDC Cookie (kc-access) with a Auth0 JWT
    """
    logger.info(f"Processing Location Change request")
    # build up the "authorized" user through request information. because an admin user is authenticated
    # they essentially "assume" the role of the target user to change their information - scoped to their school
    assumed_user = User(impersonator=admin.email, email=location_change.email, school=admin.school)
    return CreatedAsyncTask(task_id=assumed_user.queue_task(task_name='tasks.report_location_status',
                                                            task_data=location_change))


@ASYNC_ROUTER.post("/modify-health", operation_id="modify-health",
                   description="Modify a user's health in the admin dashboard", **GENERAL_ASYNC_PARAMS)
async def modify_health(report: AdminHealthReport, admin: AdminDashboardUser = OIDC_COOKIE):
    """
    Queue a health report modification in the backend. Allows administrators to change a user's
    health report if they desire.
    * Requires an identified health report in an HTTP POST Request
    * Requires an OIDC Cookie (kc-access) with Auth0 JWT
    """
    logger.info(f"Processing Health Modification Request")
    # administrator impersonating the target user to modify/change a health report
    assumed_user = User(impersonator=admin.email, email=report.email, school=admin.school)
    return CreatedAsyncTask(task_id=assumed_user.queue_task(task_name='tasks.report_health',
                                                            task_data=report))


@ASYNC_ROUTER.post("/send-targeted-digest", operation_id="send-targeted-digest",
                   description="Send a daily digest to a specific authorized user", **GENERAL_ASYNC_PARAMS)
async def send_targeted_digest(admin: AdminDashboardUser = OIDC_COOKIE):
    """
    Queue a targeted digest to the user currently signed into the dashboard
    * Uses the claimed email from the JSON web token
    * Does not send an email if the claimed email is not authorized to receive daily digests
    * Requires an OIDC Cookie (kc-access) with Auth0 JWT
    """
    logger.info(f"Processing Targeted Digest Request")
    return CreatedAsyncTask(task_id=admin.queue_task(task_name='tasks.send_daily_digest',
                                                     task_data=DailyDigestRequest(school=admin.school)))


@ASYNC_ROUTER.post("/modify-vaccination", operation_id="modify-vaccination",
                   description="Modify a user's vaccination status in the admin dashboard", **GENERAL_ASYNC_PARAMS)
async def modify_vaccination(report: UpdateVaccinationRequest, admin: AdminDashboardUser = OIDC_COOKIE):
    """
    Queue a vaccination modification in the backend. Either set to unvaccinated or vaccinated
    * Requires a vaccination request as JSON payload in an HTTP POST request
    * Requires an OIDC Cookie (kc-access) with Auth0 JWT
    """
    logger.info(f"Processing vaccine modification request")
    assumed_user = User(impersonator=admin.email, email=report.email, school=admin.school)
    return CreatedAsyncTask(task_id=assumed_user.queue_task(task_name='tasks.report_vaccination',
                                                            task_data=report))
