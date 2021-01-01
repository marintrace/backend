from typing import List, Optional

from pydantic import BaseModel

from shared.models.enums import UserLocationStatus
from shared.models.risk_entities import UserHealthItem, UserLocationItem, DatedUserHealthHolder
from shared.models.user_entities import (Paginated, PaginatedResponse,
                                         Response, User, UserIdentifier)


class UpdateLocationRequest(BaseModel):
    """
    Model for updating a user's location (to quarantined/remote/campus)
    """
    email: str
    location: UserLocationStatus


class OptIdPaginationRequest(Paginated):
    """
    Identification for a user pagination optionally by their email
    """
    email: str = None


class IdUserPaginationRequest(UserIdentifier, Paginated):
    """
    Pagination identification for a user by their email
    """
    pass


# Models
class SingleUserDualStatus(BaseModel):
    """
    User Status Response for the Dashboard
    """
    health: UserHealthItem
    location: UserLocationItem


class IdSingleUserDualStatus(SingleUserDualStatus, UserIdentifier):
    """
    Identified User Dual Status (with email)
    """
    pass


class MultipleUserDualStatuses(PaginatedResponse):
    """
    Multiple users status in the admin dashboard
    """
    statuses: List[IdSingleUserDualStatus]


class SingleUserHealthHistory(PaginatedResponse):
    """
    Health history of a single user
    """
    health_reports: List[DatedUserHealthHolder]


class AdminDashboardUser(User):
    """
    User who is using the admin dashboard
    """
    pass


class UserInfoDetail(BaseModel):
    """
    Entity representing user info detail on the user
    detail page
    """
    email: str
    first_name: str
    last_name: str
    cohort: Optional[int]
    active: bool
    school: str


class NumericalWidgetResponse(Response):
    """
    Numerical Widget Value on the homescreen of the admin-dashboard
    """
    value: int


class UserInteraction(BaseModel):
    """
    Interaction between two users on the admin-dashboard
    """
    email: str
    timestamp: str


class UserInteractionHistory(Paginated):
    """
    User Interactions for the Dasboard
    """
    users: List[UserInteraction]
