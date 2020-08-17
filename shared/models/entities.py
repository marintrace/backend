# -*- coding: utf-8 -*-
"""
API Models for type validation and API doc generation
"""
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field

from shared.service.celery_config import celery
from shared.utilities import pst_timestamp


# Base Classes
class Timestamped(BaseModel):
    """
    Base Timestamped model
    """

    timestamp: int = Field(default_factory=lambda: int(pst_timestamp()))


class Paginated(BaseModel):
    """
    Request for paginated data
    """
    pagination_token: int = 0
    limit: int = 20


class PaginatedResponse(Timestamped):
    """
    Response from retrieving paginated data
    """
    pagination_token: Optional[int]


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


# Entities and Reports
class InteractionReport(BaseModel):
    """
    Interaction report schema for API validation and documentation
    """

    targets: List[str]


class TestReport(Timestamped):
    """
    Report either a positive or negative test
    """

    test_type: TestType

    def get_test(self):
        """
        Get the test type as a string
        :return: string version of the test
        """
        if self.test_type == TestType.POSITIVE:
            return "Positive Test"
        elif self.test_type == TestType.NEGATIVE:
            return "Negative Test"
        raise Exception(f"Unknown Test Type {self.test_type}")


class SymptomReport(Timestamped):
    """
    Symptom Report
    """
    fever_chills: bool = False
    cough: bool = False
    shortness_breath: bool = False
    difficulty_breathing: bool = False
    fatigue: bool = False
    muscle_body_aches: bool = False
    headache: bool = False
    loss_taste_smell: bool = False
    sore_throat: bool = False
    congestion_runny_nose: bool = False
    nausea_vomiting: bool = False
    diarrhea: bool = False

    def get_symptoms(self):
        """
        Retrieve symptoms for which the patient is positive
        """
        non_symptom_attributes = ('timestamp',)
        return [symptom_name.replace('_', ' ').title() for (symptom_name, is_symptomatic) in self if
                is_symptomatic and symptom_name not in non_symptom_attributes]


class Report(BaseModel):
    """
    Base Report Holder
    """
    interactions: List[InteractionReport] = []
    tests: List[TestReport] = []
    symptoms: List[SymptomReport] = []


class RiskNotification(BaseModel):
    """
    Risk Notification model
    """
    criteria: List[str]


# REST Entities
class AdminDashboardUser(BaseModel):
    """
    User who is using the admin dashboard
    """
    first_name: str
    last_name: str
    email: str
    school: str


class DashboardUserSummaryItem(BaseModel):
    """
    Entity representing a summary item on the dashboard
    """
    first_name: str
    last_name: str
    color: str
    message: str
    healthy: bool

    def get_full_name(self):
        """
        Get the fullname of a dashboard
        user summary item
        """
        return f"{self.first_name} {self.last_name}"


class User(BaseModel):
    """
    User Schema for API validation and documentation
    """
    first_name: str
    last_name: str
    email: str
    school: str
    signup_at: UserStatus = UserStatus.INACTIVE

    def queue_task(self, *, task_name: str, task_data: Optional[BaseModel] = None, high_priority: bool = False) -> str:
        """
        Send a task to service via redis
        :param task_name: the task name to queue the task to
        :param task_data: data to send to the target worker
        :param high_priority: whether or not the request should be routed to the high priority celery queue
        :return: the task id
        """
        task_params = {'user': self}

        if task_data:
            task_params['task_data'] = task_data

        queued_task = celery.send_task(
            name=task_name, args=[], kwargs=task_params,
            queue='priority' if high_priority else 'default'
        )
        return queued_task.id

    class Config:
        """
        Pydantic configuration
        """
        use_enum_values = True  # Serialize enum values to strings


# Responses
class Response(Timestamped):
    """
    Base API Response back to client
    """
    status: ResponseStatus = ResponseStatus.SUCCESS


class FailureResponse(Response):
    """
    Failure Response Model back to client
    """

    reason: str


class ListUsersResponse(Response):
    """
    Listing users in the database response
    """
    users: List[User]


class CreatedAsyncTask(Response):
    """
    Created Asynchronous task with service
    """
    status = ResponseStatus.QUEUED
    task_id: str


class DashboardNumericalWidgetResponse(Response):
    """
    Numerical Widget Value on the homescreen of the dashboard
    """
    value: int


class DashboardUserSummaryResponse(Paginated):
    """
    User Summary Response for the Dashboard
    """
    records: List[DashboardUserSummaryItem]
