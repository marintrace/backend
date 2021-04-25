from enum import Enum


# ENUMS - Use String Mixin to make JSON Serializeable: https://stackoverflow.com/a/51976841/4501002
class StatusColor(str, Enum):
    """
    Summary Item colors for admin dashboard items
    """
    UNHEALTHY = "danger"
    WARNING = 'yellow'
    UNKNOWN = "gray"
    HEALTHY = "success"


class ResponseStatus(str, Enum):
    """
    Possible response statuses from the API
    """
    MALFORMED = "MALFORMED"
    UNEXPECTED_ERROR = "UNEXPECTED"
    SUCCESS = "SUCCESS"
    QUEUED = "QUEUED"
    ACCESS_DENIED = "ACCESS_DENIED"


class TestType(str, Enum):
    """
    Test Type of the report
    """
    POSITIVE = "positive"
    NEGATIVE = "negative"


class UserLocationStatus(str, Enum):
    """
    User Report Permissions
    """
    CAMPUS = "campus"
    REMOTE = "remote"
    QUARANTINE = "quarantined"

    @staticmethod
    def get_blocked() -> frozenset:
        """
        :return: set of blocked user locations
        """
        return frozenset({UserLocationStatus.QUARANTINE.value, UserLocationStatus.REMOTE.value})


class EntryReason(str, Enum):
    """
    Reason for school entry
    """
    HEALTH = "health"
    LOCATION = "location"
    VACCINE = "vaccine"


class VaccinationStatus(str, Enum):
    """
    User's vaccination status
    """
    VACCINATED = "vaccinated"
    NOT_VACCINATED = "not_vaccinated"

    @staticmethod
    def from_radio(text: str):
        if text == "yes":
            return VaccinationStatus.VACCINATED
        return VaccinationStatus.NOT_VACCINATED


class UserStatus(str, Enum):
    """
    User status
    """
    INACTIVE = "inactive"
    ACTIVE = "active"
