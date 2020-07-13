"""
Enable Celery Automatic Task Discovery
"""
from .reporting_tasks import report_active_user, report_interaction, report_symptoms, report_test
from .notification_tasks import notify_risk

from shared.service.celery_config import celery

