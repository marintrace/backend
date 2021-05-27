# -*- coding: utf-8 -*-
"""
API Models for type validation and API doc generation
"""
from typing import List, Optional, Tuple

from pydantic import BaseModel, Field

from celery.result import AsyncResult
from shared.date_utils import pst_timestamp
from shared.logger import logger
from shared.models.enums import ResponseStatus, TestType
from shared.service.celery_config import get_celery


class User(BaseModel):
    """
    User Schema for API validation and documentation
    """
    impersonator: Optional[str] = None  # allow administrators to impersonate users to log information on their behalf
    first_name: Optional[str]  # optional fields to provide more information but not required for ID
    last_name: Optional[str]
    email: str
    school: str

    def _send_task(self, *, task_name: str, task_data: Optional[BaseModel] = None, extra_fields: Tuple = (),
                   compression: str = 'lzma', default_sender_fields=('impersonator', 'school', 'email')) -> AsyncResult:
        """
        Send a task to service via rabbitmq, returning the AsyncResult from celery
        :param task_name: the task name to queue the task to
        :param task_data: data to send to the target worker
        :param extra_fields: fields to keep during serialization in addition to the default fields
        :param compression: the compression algorithm to use when compressing messages
        :param default_sender_fields: the fields of the sender to keep during serialization (by default-base)
        :return: the AsyncResult from celery
        """
        if getattr(self, 'impersonator'):
            logger.warning(f"User Scope for task {task_name} impersonated by {self.impersonator}...")

        compressed_sender = self.copy()

        for field in compressed_sender.dict():
            if field not in default_sender_fields and field not in extra_fields:
                logger.debug(f"Sending Task... Deleting field {field}")
                delattr(compressed_sender, field)

        task_params = {'sender': compressed_sender}

        if task_data:
            task_params['task_data'] = task_data

        task: AsyncResult = get_celery().send_task(
            name=task_name, args=[], kwargs=task_params, compression=compression
        )
        return task

    def queue_task(self, *, task_name: str, task_data: Optional[BaseModel] = None, extra_fields: Tuple = (),
                   compression: str = 'lzma') -> str:
        """
        Send a task to celery asynchronously, returning the task id
        :return: the task id for the queued task
        """
        queued_task: AsyncResult = self._send_task(task_name=task_name, task_data=task_data, compression=compression,
                                                   extra_fields=extra_fields)
        return queued_task.id

    def execute_task(self, *, task_name: str, task_data: Optional[BaseModel] = None, extra_fields: Tuple = (),
                     compression: str = 'lzma'):
        """
        Send a task to celery and wait for the result
        :return: the result of the executed task
        """
        queued_task: AsyncResult = self._send_task(task_name=task_name, task_data=task_data, compression=compression,
                                                   extra_fields=extra_fields)
        return queued_task.get()  # wait for task to complete

    class Config:
        """
        Pydantic configuration
        """
        use_enum_values = True  # Serialize enum values to strings


# Base Classes
class UserIdentifier(BaseModel):
    """
    Identification for a user by their email
    """
    name: Optional[str]
    email: str


class MultipleUserIdentifiers(BaseModel):
    """
    Multiple user identifiers in a list
    """
    identifiers: List[UserIdentifier]


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


class HealthReport(Timestamped):
    """
    Health Report Report
    """
    num_symptoms: Optional[int] = None
    proximity: Optional[bool] = None
    test_type: Optional[TestType] = None
    commercial_flight: Optional[bool] = None

    def test_only(self):
        """
        Only updating the test
        :return: whe
        """
        return self.test_type is not None \
               and self.proximity is None \
               and self.commercial_flight is None \
               and self.num_symptoms is None


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
