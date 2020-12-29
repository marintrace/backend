from fastapi import APIRouter, status

from shared.models import CreatedAsyncTask, UpdateLocationRequest

from .authorization import OIDC_COOKIE

# Asynchronous API Router -- mountable to main API
ASYNC_ROUTER = APIRouter()

GENERAL_ASYNC_PARAMS = dict(
    response_model=CreatedAsyncTask,
    status_code=status.HTTP_202_ACCEPTED
)

@ASYNC_ROUTER.post("/queue-location-change", operation_id="update_user_location",
                   description="Queue a location change for a user from admin dashboard", **GENERAL_ASYNC_PARAMS)
async def queue_location_change(location_change: UpdateLocationRequest):
    """
    Queue a user location change in the backend. Allows administrators to change
    whether or not users can receive "healthy" statuses
    * Requires OIDC Cookie (kc-access) with a Auth0 JWT
    """
