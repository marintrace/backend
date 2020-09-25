# -*- coding: utf-8 -*-
"""
API Models for type validation and API doc generation
"""
from typing import List, Optional

from pydantic import BaseModel, Field

from shared.service.celery_config import get_celery
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


class DailyReport(Timestamped):
    """
    Symptom Report
    """
    num_symptoms: int = 0
    proximity: bool = False
    test_type: Optional[TestType] = None
    commercial_flight: bool = False


class Report(BaseModel):
    """
    Base Report Holder
    """
    interactions: List[InteractionReport] = []
    tests: List[TestReport] = []
    symptoms: List[DailyReport] = []


# REST Entities
class User(BaseModel):
    """
    User Schema for API validation and documentation
    """
    first_name: str
    last_name: str
    email: str
    school: str
    status: UserStatus = None

    def queue_task(self, *, task_name: str, task_data: Optional[BaseModel] = None) -> str:
        """
        Send a task to service via rabbitmq
        :param task_name: the task name to queue the task to
        :param task_data: data to send to the target worker
        :return: the task id
        """
        task_params = {'user': self}

        if task_data:
            task_params['task_data'] = task_data

        queued_task = get_celery().send_task(
            name=task_name, args=[], kwargs=task_params
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
