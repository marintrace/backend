from enum import Enum
from typing import List, Optional, Union

from pydantic import BaseModel

from shared.logger import logger
from shared.models.enums import (EntryReason, StatusColor, UserLocationStatus,
                                 VaccinationStatus)
from shared.models.user_entities import HealthReport, TestType
from shared.service.vault_config import VaultConnection


class SymptomConfigRetriever:
    """
    Get or Retrieve symptom configurations from specific schools
    """
    _CONFIGS = {}

    @staticmethod
    def get(school: str):
        """
        Get or retrieve the symptom configuration for a given school
        :param school: school name
        :return: the symptom criteria
        """
        if school in SymptomConfigRetriever._CONFIGS:
            return SymptomConfigRetriever._CONFIGS[school]

        with VaultConnection() as vault:
            logger.info(f"Unable to find '{school}' symptom configuration in cache... retrieving from Vault.")
            configuration = vault.read_secret(secret_path=f"schools/{school}/symptom_criteria")

        SymptomConfigRetriever._CONFIGS[school] = configuration
        return configuration


class UserLocationItem(BaseModel):
    """
    Entity representing user location
    """
    color: StatusColor = None
    location: UserLocationStatus = None

    def set_location(self, location: Union[UserLocationStatus, str]):
        self.location = location
        comp_location = location.value if isinstance(location, Enum) else location
        if comp_location in UserLocationStatus.get_blocked():
            self.color = StatusColor.UNHEALTHY
        else:
            self.color = StatusColor.HEALTHY
        return self

    def entry_blocked(self):
        return self.color == StatusColor.UNHEALTHY


class UserHealthItem(BaseModel):
    """
    Entity representing user risk
    """
    vaccinated: bool = False
    color: StatusColor = None
    school: str
    criteria: List[str] = []

    def update_status_if_more_risk(self, color: StatusColor, override_vaccine: bool = False):
        """
        Change a user's status color if it increases the user's risk.
        :param color: the color to attempt to change to
        :param override_vaccine: whether or not to override the vaccination setting to warning
        """
        if override_vaccine:
            self.color = color
        else:
            if color == StatusColor.UNHEALTHY:
                if self.vaccinated:  # we should show a user as a "warning" if they are a risk and
                    self.color = StatusColor.WARNING
                else:
                    self.color = StatusColor.UNHEALTHY
            elif color == StatusColor.WARNING:
                if not self.color == StatusColor.UNHEALTHY:
                    self.color = color
            else:
                if not self.color == StatusColor.UNHEALTHY or StatusColor.UNHEALTHY:
                    self.color = color

    def is_incomplete(self) -> bool:
        return self.color == StatusColor.UNKNOWN

    def at_risk(self, include_warning=False) -> bool:
        """
        Whether the user has any urgent
        risk factors
        """
        return (self.color == StatusColor.UNHEALTHY) or \
               (include_warning and self.color == StatusColor.WARNING)

    def from_health_report(self, health_report: HealthReport):
        """
        Create a new User Risk Item from a Daily Report Object
        :param health_report: Daily Report Object

        :return: UserRiskItem
        """
        symptom_config = SymptomConfigRetriever.get(self.school)

        if health_report.num_symptoms and health_report.num_symptoms >= symptom_config['minimum_symptoms']:
            self.add_symptoms(num_symptoms=health_report.num_symptoms)
        if health_report.test_type:
            self.add_test(test_type=health_report.test_type)
        if health_report.proximity:
            self.add_proximity()
        if health_report.commercial_flight:
            self.add_commercial_travel()
        if not self.color:
            self.update_status_if_more_risk(StatusColor.HEALTHY)
            self.criteria.append('Healthy')
        return self

    def set_incomplete(self):
        self.update_status_if_more_risk(StatusColor.UNKNOWN)
        self.criteria.append('No Report')
        return self

    def add_test(self, test_type: Union[str, Enum]):
        if test_type == TestType.POSITIVE:
            self.update_status_if_more_risk(StatusColor.UNHEALTHY)
            self.criteria.append('Positive Test')
        elif test_type == TestType.NEGATIVE:
            self.update_status_if_more_risk(StatusColor.HEALTHY)
            self.criteria.append('Negative Test')
        return self

    def add_vaccination(self, status: Union[str, Enum]):
        if status == VaccinationStatus.VACCINATED:
            if self.color == StatusColor.UNHEALTHY:  # if the user was unhealthy when vax added, change to warning
                self.color = StatusColor.WARNING
            else:
                self.color = StatusColor.HEALTHY
            self.criteria.append('Fully Vaccinated')
            self.vaccinated = True
        return self

    def add_proximity(self):
        self.update_status_if_more_risk(StatusColor.UNHEALTHY)
        self.criteria.append('COVID Proximity')
        return self

    def add_symptoms(self, num_symptoms: int):
        self.update_status_if_more_risk(StatusColor.UNHEALTHY)
        self.criteria.append(f'{num_symptoms} symptoms')
        return self

    def add_commercial_travel(self):
        self.update_status_if_more_risk(StatusColor.UNHEALTHY)
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
    entry: bool
    reason: EntryReason
    health: UserHealthItem = None
    location: UserLocationItem = None

    def set_reports(self, *, health: UserHealthItem, location: UserLocationItem):
        self.health = health
        self.location = location
        return self


class DatedUserHealthHolder(BaseModel):
    """
    User health item with a timestamp for identification
    """
    timestamp: str
    dated_report: UserHealthItem


class ScoredUserHealthItem(UserHealthItem):
    """
    User Risk Item that keeps track of risk score
    """
    risk_score: int = 0

    def from_health_report(self, health_report: HealthReport):
        """
        Create a new User Risk Item from a Health Report Object with score
        :param health_report: Health Report Object
        :return: ScoredUserRiskItem
        """
        symptom_criteria = SymptomConfigRetriever.get(school=self.school)

        if health_report.num_symptoms and health_report.num_symptoms >= symptom_criteria['minimum_symptoms']:
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
            self.update_status_if_more_risk(StatusColor.HEALTHY)
            self.criteria.append('Healthy')

        return self
