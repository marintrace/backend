from typing import List, Optional

from pydantic import BaseModel

from shared.models.entities import Paginated, Response
from shared.models.enums import UserLocationStatus
from shared.models.risk_entities import UserRiskItem


class UserEmailIdentifier(BaseModel):
    """
    Identification for a user by their email
    """
    email: str


class UpdateLocationRequest(BaseModel):
    """
    Model for updating a user's location (to quarantined/remote/campus)
    """
    email: str
    location: UserLocationStatus


class OptionalPaginatedUserEmailIdentifier(Paginated):
    """
    Identification for a user pagination optionally by their email
    """
    email: str = None


class PaginatedUserEmailIdentifier(UserEmailIdentifier, Paginated):
    """
    Pagination identification for a user by their email
    """
    pass


class AdminDashboardUser(BaseModel):
    """
    User who is using the admin admin-dashboard
    """
    first_name: str
    last_name: str
    email: str
    school: str


class DashboardUserInfoDetail(BaseModel):
    """
    Entity representing user info detail on the user
    detail page
    """
    email: str
    first_name: str
    last_name: str
    cohort: Optional[int]
    location: str
    active: bool
    school: str


class DashboardNumericalWidgetResponse(Response):
    """
    Numerical Widget Value on the homescreen of the admin-dashboard
    """
    value: int


class DashboardUserSummaryResponse(Paginated):
    """
    User Summary Response for the Dashboard
    """
    records: List[UserRiskItem]


class DashboardUserInteraction(BaseModel):
    """
    Interaction between two users on the admin-dashboard
    """
    email: str
    timestamp: str


class DashboardUserInteractions(Paginated):
    """
    User Interactions for the Dasboard
    """
    users: List[DashboardUserInteraction]
