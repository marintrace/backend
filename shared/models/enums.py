from enum import Enum
from typing import Union


class SummaryColors:
    """
    Summary Item colors for admin-dashboard items
    """
    URGENT = "danger"
    WARNING = 'yellow'
    NO_REPORT = "gray"
    HEALTHY = "success"


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
    QUARANTINE = "quarantine"

    @staticmethod
    def blocked(location: Union[Enum, str]):
        """
        Return whether or not the user is blocked from entry or not
        :return: bool
        """
        if isinstance(location, Enum):
            return location in {UserLocationStatus.QUARANTINE, UserLocationStatus.REMOTE}
        return location in {UserLocationStatus.REMOTE, UserLocationStatus.QUARANTINE}


class UserStatus(str, Enum):
    """
    User status
    """
    INACTIVE = "inactive"
    ACTIVE = "active"
