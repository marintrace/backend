from typing import List, Optional

from pydantic import BaseModel

from shared.models.enums import (UserLocationStatus, UserStatus,
                                 VaccinationStatus)
from shared.models.risk_entities import (DatedUserHealthHolder, UserHealthItem,
                                         UserLocationItem)
from shared.models.user_entities import (HealthReport, Paginated,
                                         PaginatedResponse, Response, User,
                                         UserIdentifier)


class AdminDashboardUser(User):
    """
    User who is using the admin dashboard
    """
    roles: Optional[List[str]]

    def can_manage(self, school: str) -> bool:
        """
        Get whether or not an admin dashboard user to authorized
        to administrate over a given campus
        :param school: the school to check
        :return: true/false
        """
        for role in self.roles:
            if role.split('-admin')[0] == school:
                return True
        return False


class TaskStatusResponse(BaseModel):
    """
    Celery Task Status response
    """
    status: str


class BriefingEnabledResponse(BaseModel):
    """
    Response for whether or not the daily briefing is enabled
    """
    enabled: bool


class AdminHealthReport(HealthReport, UserIdentifier):
    """
    Impersonator logged health report request
    """
    pass


class UpdateLocationRequest(BaseModel):
    """
    Model for updating a user's location (to quarantined/remote/campus)
    """
    email: str
    location: UserLocationStatus


class UpdateVaccinationRequest(BaseModel):
    """
    Model for updating a user's vaccination status
    """
    email: str
    status: VaccinationStatus


class DailyDigestRequest(BaseModel):
    """
    Model for a Daily Digest Send Request
    """
    school: str


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
    status: UserStatus = UserStatus.ACTIVE


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
