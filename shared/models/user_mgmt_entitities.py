from typing import List, Optional

from pydantic import BaseModel

from shared.models.enums import UserLocationStatus, VaccinationStatus, UserStatus
from shared.models.user_entities import PaginatedResponse

BULK_IMPORT_SCHEMA = ['Email', 'FirstName', 'LastName', 'Vaccinated', 'Location']


class MemberAccessInfo(BaseModel):
    """
    Detail of a community member's access info
    """
    email: str
    name: str
    blocked: bool
    status: UserStatus


class MultipleMemberAccessInfo(PaginatedResponse):
    """
    Detail of multiple community member's access info
    """
    users: List[MemberAccessInfo]


class AddCommunityMemberRequest(BaseModel):
    """
    Request to add a community member
    """
    first_name: str
    last_name: str
    email: str
    vaccinated: VaccinationStatus = VaccinationStatus.NOT_VACCINATED
    location: UserLocationStatus = UserLocationStatus.CAMPUS


class BulkAddCommunityMemberRequest(BaseModel):
    """
    Request to add multiple community members
    """
    users: List[AddCommunityMemberRequest]


class ToggleAccessRequest(BaseModel):
    """
    Request to block/unblock a community user from MarinTrace
    """
    email: str
    block: bool = True


class BulkToggleAccessRequest(BaseModel):
    """
    Request to block/unblock many community members from MarinTrace
    """
    users: List[ToggleAccessRequest]


class UserRolesResponse(BaseModel):
    roles: List[str]


class InviteStatsResponse(BaseModel):
    """
    Response for invite stats containing active and pending users
    """
    active: int
    inactive: int


class SwitchReportNodeRequest(BaseModel):
    """
    Request to switch a user's active health record to a new campus
    """
    email: str
    target_campus: str


class BulkSwitchReportNodeRequest(BaseModel):
    """
    Request to switch many users' active health record to new campuses
    """
    requests: List[SwitchReportNodeRequest]
