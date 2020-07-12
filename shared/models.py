# -*- coding: utf-8 -*-
"""
API Models for type validation and API doc generation
"""
from enum import Enum
from typing import List, Dict, Optional

from pydantic import BaseModel, Field

from shared.utilities import pst_timestamp
from shared.service.celery_config import celery


# Base Classes
class Timestamped(BaseModel):
    """
    Base Timestamped model
    """

    timestamp = Field(default_factory=pst_timestamp)


# ENUMS - Use String Mixin to make JSON Serializeable: https://stackoverflow.com/a/51976841/4501002
class ResponseStatus(str, Enum):
    """
    Possible response statuses from the API
    """

    MALFORMED = "MALFORMED"
    UNEXPECTED_ERROR = "UNEXPECTED"
    SUCCESS = "SUCCESS"
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


class ServiceStatus(str, Enum):
    """
    Service Statuses for components of the API
    """

    ONLINE = "online"
    OFFLINE = "offline"


# ENTITIES
class User(BaseModel):
    """
    User Schema for API validation and documentation
    """

    first_name: str
    last_name: str
    email: str
    school: str
    signup_at: UserStatus = UserStatus.INACTIVE

    def queue_task(self, *, task_name: str, task_data: Optional[Dict] = None) -> str:
        """
        Send a task to service via redis
        :param task_name: the task name to queue the task to
        :param task_data: data to send to the target worker
        :return: the task id
        """
        task_data = task_data or {}

        for key in task_data:
            if isinstance(task_data[key], BaseModel):  # Serialize PyDantic models to JSON
                task_data[key] = task_data[key].dict()

        queued_task = celery.send_task(
            name=task_name, args=[], kwargs=dict(user=self.dict(), **(task_data or {}))
        )
        return queued_task.id


# REPORTS
class InteractionReport(Timestamped):
    """
    Interaction report schema for API validation and documentation
    """

    targets: List[str]


class TestReport(Timestamped):
    """
    Report either a positive or negative test
    """

    test_type: TestType


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

    task_id: str
