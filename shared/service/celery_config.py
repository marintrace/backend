# -*- coding: utf-8 -*-
"""
Setup Celery Queue Access from Flask
"""
import os

from celery import Celery

CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://redis:6379")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", "redis://redis:6379")
CELERY_CONFIG_OPTIONS = {
    'task_serializer': 'pickle',
    'task_create_missing_queues': True,
    'accept_content': ['pickle', 'json'],
    'worker_hijack_root_logger': False
}

CELERY_RETRY_OPTIONS = dict(
    bind=True, autoretry_for=(Exception,), retry_kwargs={'max_retries': 5},
    exponential_backoff=2, retry_jitter=os.environ.get('DEV', False)  # set to true for production
)

celery: Celery = Celery("tasks", broker=CELERY_BROKER_URL, backend=CELERY_RESULT_BACKEND)
celery.conf.update(CELERY_CONFIG_OPTIONS)
