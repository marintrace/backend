from typing import List

from pydantic import BaseModel

from shared.models.enums import UserLocationStatus, VaccinationStatus

BULK_IMPORT_SCHEMA = ['Email', 'FirstName', 'LastName', 'Vaccinated', 'Location']


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
