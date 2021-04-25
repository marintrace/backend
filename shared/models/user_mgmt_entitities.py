from pydantic import BaseModel
from shared.models.enums import VaccinationStatus, UserLocationStatus


class AddCommunityMemberRequest(BaseModel):
    """
    Request to add a community member
    """
    first_name: str
    last_name: str
    email: str
    vaccinated: VaccinationStatus = VaccinationStatus.NOT_VACCINATED
    location: UserLocationStatus = UserLocationStatus.CAMPUS


class ToggleAccessRequest(BaseModel):
    """
    Request to block/unblock a community user from MarinTrace
    """
    email: str
    block: bool = True
