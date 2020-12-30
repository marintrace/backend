from enum import Enum


class HTMLColors:
    """
    Summary Item colors for admin-dashboard items
    """
    DANGER = "danger"
    YELLOW = 'yellow'
    GRAY = "gray"
    SUCCESS = "success"


# ENUMS - Use String Mixin to make JSON Serializeable: https://stackoverflow.com/a/51976841/4501002
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


class UserStatus(str, Enum):
    """
    User status
    """
    INACTIVE = "inactive"
    ACTIVE = "active"
