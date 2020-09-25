from enum import Enum
from typing import List, Optional, Union

from pydantic import BaseModel

from shared.models.entities import DailyReport, TestType
from shared.models.enums import SummaryColors


class UserRiskItem(BaseModel):
    """
    Entity representing user risk
    """
    email: Optional[str]
    timestamp: Optional[str]
    color: str = SummaryColors.HEALTHY
    criteria: List[str] = []

    def at_risk(self, include_warning=False) -> bool:
        """
        Whether the user has any urgent
        risk factors
        """
        return (self.color == SummaryColors.URGENT) or \
               (include_warning and self.color == SummaryColors.WARNING)

    @staticmethod
    def from_daily_report(daily_report: DailyReport, min_risk_symptoms: int = 1):
        """
        Create a new User Risk Item from a Daily Report Object
        :param daily_report: Daily Report Object
        :param min_risk_symptoms: the minimum symptoms to trigger an urgent
            status
        :return: UserRiskItem
        """
        risk_item = UserRiskItem()
        if daily_report.num_symptoms >= min_risk_symptoms:
            risk_item.add_symptoms(num_symptoms=daily_report.num_symptoms)
        if daily_report.test_type == TestType.POSITIVE:
            risk_item.add_test(test_type=daily_report.test_type)
        if daily_report.proximity:
            risk_item.add_proximity()
        if daily_report.commercial_flight:
            risk_item.add_commercial_travel()

        return risk_item

    def add_incomplete(self):
        self.color = SummaryColors.NO_REPORT
        self.criteria.append('No Report')
        return self

    def add_test(self, test_type: Union[str, Enum]):
        if test_type == TestType.POSITIVE:
            self.color = SummaryColors.URGENT
        elif test_type == TestType.NEGATIVE:
            self.color = SummaryColors.HEALTHY
        self.criteria.append(test_type)
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

    def format_criteria(self, joiner: str = '& '):
        """
        Join the criteria list by chr (& by default)
        :param joiner: string to join criteria by
        """
        return joiner.join(self.criteria)
