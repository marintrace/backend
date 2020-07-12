# -*- coding: utf-8 -*-
"""
Asynchronous API for long-running operations and non-response notifications
"""
from fastapi import APIRouter, status

from authorization.headers import AUTH_USER
from shared.logger import logger
from shared.models import InteractionReport, User, TestReport, SymptomReport, CreatedAsyncTask

# Asynchronous API Router -- mountable to main API
ASYNC_ROUTER = APIRouter()

GENERAL_ASYNC_PARAMS = dict(
    response_model=CreatedAsyncTask,
    status_code=status.HTTP_202_ACCEPTED
)


@ASYNC_ROUTER.post('/interaction', operation_id="queue_interaction_report",
                   description="Log contact  between a user and multiple users", **GENERAL_ASYNC_PARAMS)
async def queue_interaction_report(contact: InteractionReport, user: User = AUTH_USER):
    """
    Queue an interaction report asynchronously in the backend via service
    * Specify the interaction model in the JSON body (schema in docs)
    """
    logger.info(f"Processing Interaction Report Task... {contact}")
    return CreatedAsyncTask(task_id=user.queue_task(task_name='tasks.report_interaction',
                                                    task_data=dict(interaction=contact)))


@ASYNC_ROUTER.post('/test', operation_id="queue_test_report",
                   description="Log a test under specified user", **GENERAL_ASYNC_PARAMS)
async def queue_test_report(test: TestReport, user: User = AUTH_USER):
    """
    Queue a test report asynchronously in the backend via service
    * Specify the test model in the JSON body
    """
    logger.info(f"Processing Test Reporting Task... {test}")
    return CreatedAsyncTask(task_id=user.queue_task(task_name='tasks.report_test', task_data=dict(test=test)))


@ASYNC_ROUTER.post('/symptoms', operation_id='queue_symptom_report',
                   description="Log symptoms under the specified user", **GENERAL_ASYNC_PARAMS)
async def queue_symptoms_report(symptoms: SymptomReport, user: User = AUTH_USER):
    """
    Queue a symptom report asynchronously in the backend via service
    * Specify the symptoms model in the JSON Body
    """
    logger.info(f"Processing Symptoms Reporting Task... {symptoms}")
    return CreatedAsyncTask(task_id=user.queue_task(task_name='tasks.report_symptoms',
                                                    task_data=dict(symptoms=symptoms)))


@ASYNC_ROUTER.post('/set-active-user', operation_id='queue_set_active_user',
                   description="Notify the system that a user has logged in for the first time", **GENERAL_ASYNC_PARAMS)
async def change_status(user: User = AUTH_USER):
    """
    Queue a change in the specified user's state in the database
    * Specify info model in the request body
    """
    logger.info(f"Processing User Status Notification Task....")
    return CreatedAsyncTask(task_id=user.queue_task(task_name='tasks.report_active_user'))
