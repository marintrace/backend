from enum import Enum


class SummaryColors:
    """
    Summary Item colors for admin-dashboard items
    """
    URGENT = "danger"
    WARNING = 'yellow'
    NO_REPORT = "gray"
    HEALTHY = "success"


class RiskScores:
    """
    Weights for Risks in calculating risk score
    """
    POSITIVE_TEST = 50
    PROXIMITY = 20
    PER_SYMPTOM = 5  # 5 Risk Score Points / symptom
    COMMERCIAL_FLIGHT = 4


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


class UserStatus(str, Enum):
    """
    User status
    """

    INACTIVE = "inactive"
    ACTIVE = "active"
