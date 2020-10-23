from enum import Enum
from typing import List, Optional, Union

from pydantic import BaseModel

from shared.models.entities import HealthReport, TestType
from shared.models.enums import SummaryColors, RiskScores


class UserRiskItem(BaseModel):
    """
    Entity representing user risk
    """
    email: Optional[str]
    name: Optional[str]
    timestamp: Optional[str]
    color: str = None
    criteria: List[str] = []

    def at_risk(self, include_warning=False) -> bool:
        """
        Whether the user has any urgent
        risk factors
        """
        return (self.color == SummaryColors.URGENT) or \
               (include_warning and self.color == SummaryColors.WARNING)

    def from_health_report(self, health_report: HealthReport, min_risk_symptoms: int = 1):
        """
        Create a new User Risk Item from a Daily Report Object
        :param health_report: Daily Report Object
        :param min_risk_symptoms: the minimum symptoms to trigger an urgent
            status
        :return: UserRiskItem
        """
        if health_report.num_symptoms >= min_risk_symptoms:
            self.add_symptoms(num_symptoms=health_report.num_symptoms)
        if health_report.test_type:
            self.add_test(test_type=health_report.test_type)
        if health_report.proximity:
            self.add_proximity()
        if health_report.commercial_flight:
            self.add_commercial_travel()

        if not self.color:
            self.color = SummaryColors.HEALTHY
            self.criteria.append('Healthy')

        return self

    def add_incomplete(self):
        self.color = SummaryColors.NO_REPORT
        self.criteria.append('No Report')
        return self

    def add_test(self, test_type: Union[str, Enum]):
        if test_type == TestType.POSITIVE:
            self.color = SummaryColors.URGENT
            self.criteria.append('Positive Test')
        elif test_type == TestType.NEGATIVE:
            self.color = SummaryColors.HEALTHY
            self.criteria.append('Negative Test')
        return self

    def add_proximity(self):
        self.color = SummaryColors.URGENT
        self.criteria.append('COVID Proximity')
        return self

    def add_symptoms(self, num_symptoms: int):
        self.color = SummaryColors.URGENT
        self.criteria.append(f'{num_symptoms} symptoms')
        return self

    def add_commercial_travel(self):
        if self.color != SummaryColors.URGENT:
            self.color = SummaryColors.WARNING
        self.criteria.append('Commercial Travel')
        return self

    def format_criteria(self, joiner: str = ' & '):
        """
        Join the criteria list by chr (& by default)
        :param joiner: string to join criteria by
        """
        return joiner.join(self.criteria)


class ScoredUserRiskItem(UserRiskItem):
    """
    User Risk Item that keeps track of risk score
    """
    risk_score: int = 0

    def from_health_report(self, health_report: HealthReport, min_risk_symptoms: int = 1):
        """
        Create a new User Risk Item from a Health Report Object with score
        :param health_report: Health Report Object
        :param min_risk_symptoms: the minimum symptoms to trigger an urgent
            status
        :return: ScoredUserRiskItem
        """
        if health_report.num_symptoms >= min_risk_symptoms:
            self.add_symptoms(num_symptoms=health_report.num_symptoms)
            self.risk_score += RiskScores.PER_SYMPTOM * health_report.num_symptoms
        if health_report.test_type:
            self.add_test(test_type=health_report.test_type)
            if health_report.test_type == TestType.POSITIVE:
                self.risk_score += RiskScores.POSITIVE_TEST
        if health_report.proximity:
            self.add_proximity()
            self.risk_score += RiskScores.PROXIMITY
        if health_report.commercial_flight:
            self.add_commercial_travel()
            self.risk_score += RiskScores.COMMERCIAL_FLIGHT
        if not self.color:
            self.color = SummaryColors.HEALTHY
            self.criteria.append('Healthy')

        return self
