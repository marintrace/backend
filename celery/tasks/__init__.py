"""
Enable Celery Automatic Task Discovery
"""
from shared.service.celery_config import celery
from shared.logger import logger

from .notification_tasks import notify_risk
from .reporting_tasks import (report_active_user, report_interaction,
                              report_symptoms, report_test)
