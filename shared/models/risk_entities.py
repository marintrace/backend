from enum import Enum
from typing import List, Union, Optional

from pydantic import BaseModel

from shared.models.enums import HTMLColors, UserLocationStatus, EntryReason
from shared.models.user_entities import HealthReport, TestType
from shared.service.vault_config import VaultConnection


class UserLocationItem(BaseModel):
    """
    Entity representing user location
    """
    color: HTMLColors = None
    location: UserLocationStatus = None

    def set_location(self, location: Union[UserLocationStatus, str]):
        self.location = location
        comp_location = location.value if isinstance(location, Enum) else location
        if comp_location in UserLocationStatus.get_blocked():
            self.color = HTMLColors.DANGER
        else:
            self.color = HTMLColors.SUCCESS
        return self

    def entry_blocked(self):
        return self.color == HTMLColors.DANGER


class UserHealthItem(BaseModel):
    """
    Entity representing user risk
    """
    color: HTMLColors = None
    criteria: List[str] = []

    def at_risk(self, include_warning=False) -> bool:
        """
        Whether the user has any urgent
        risk factors
        """
        return (self.color == HTMLColors.DANGER) or \
               (include_warning and self.color == HTMLColors.YELLOW)

    def from_health_report(self, health_report: HealthReport, minimum_symptoms=1):
        """
        Create a new User Risk Item from a Daily Report Object
        :param minimum_symptoms: number of minimum symptoms to trigger unhealthy state
        :param health_report: Daily Report Object

        :return: UserRiskItem
        """
        if health_report.num_symptoms >= minimum_symptoms:
            self.add_symptoms(num_symptoms=health_report.num_symptoms)
        if health_report.test_type:
            self.add_test(test_type=health_report.test_type)
        if health_report.proximity:
            self.add_proximity()
        if health_report.commercial_flight:
            self.add_commercial_travel()
        if not self.color:
            self.color = HTMLColors.SUCCESS
            self.criteria.append('Healthy')
        return self

    def set_location_blocked(self, location: Union[UserLocationStatus, str]):
        self.color = HTMLColors.DANGER
        if isinstance(location, Enum):
            self.criteria.append(location.value.title())
        else:
            self.criteria.append(location.title())
        return self

    def set_incomplete(self):
        self.color = HTMLColors.GRAY
        self.criteria.append('No Report')
        return self

    def add_test(self, test_type: Union[str, Enum]):
        if test_type == TestType.POSITIVE:
            self.color = HTMLColors.DANGER
            self.criteria.append('Positive Test')
        elif test_type == TestType.NEGATIVE:
            self.color = HTMLColors.SUCCESS
            self.criteria.append('Negative Test')
        return self

    def add_proximity(self):
        self.color = HTMLColors.DANGER
        self.criteria.append('COVID Proximity')
        return self

    def add_symptoms(self, num_symptoms: int):
        self.color = HTMLColors.DANGER
        self.criteria.append(f'{num_symptoms} symptoms')
        return self

    def add_commercial_travel(self):
        self.color = HTMLColors.DANGER
        self.criteria.append('Commercial Travel')
        return self

    def format_criteria(self, joiner: str = ' & '):
        """
        Join the criteria list by chr (& by default)
        :param joiner: string to join criteria by
        """
        return joiner.join(self.criteria)


class IdentifiedUserEntryItem(BaseModel):
    """
    Status of whether or not a user is permitted to enter the school
    """
    name: Optional[str]
    reason: EntryReason
    report: Union[UserLocationStatus, UserHealthItem]


class ScoredUserRiskItem(UserHealthItem):
    """
    User Risk Item that keeps track of risk score
    """
    risk_score: int = 0
    school: str

    def retrieve_symptom_criteria(self):
        """
        Retrieve symptom criteria from Vault for the specified school
        :return: dictionary of risk scores
        """
        with VaultConnection() as vault:
            return vault.read_secret(secret_path=f"schools/{self.school}/symptom_criteria")

    def from_health_report(self, health_report: HealthReport, minimum_symptoms=1):
        """
        Create a new User Risk Item from a Health Report Object with score
        :param minimum_symptoms: minimum symptoms to trigger alert
        :param health_report: Health Report Object
        :return: ScoredUserRiskItem
        """
        symptom_criteria = self.retrieve_symptom_criteria()
        if health_report.num_symptoms >= minimum_symptoms:
            self.add_symptoms(num_symptoms=health_report.num_symptoms)
            self.risk_score += symptom_criteria['score_per_symptom'] * health_report.num_symptoms
        if health_report.test_type:
            self.add_test(test_type=health_report.test_type)
            if health_report.test_type == TestType.POSITIVE:
                self.risk_score += symptom_criteria['score_positive_test']
        if health_report.proximity:
            self.add_proximity()
            self.risk_score += symptom_criteria['score_proximity']
        if health_report.commercial_flight:
            self.add_commercial_travel()
            self.risk_score += symptom_criteria['score_commercial_travel']
        if not self.color:
            self.color = HTMLColors.SUCCESS
            self.criteria.append('Healthy')

        return self
