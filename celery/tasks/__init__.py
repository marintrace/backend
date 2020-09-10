"""
Enable Celery Automatic Task Discovery
"""
from shared.service.celery_config import celery

from .notification_tasks import notify_risk
from .reporting_tasks import (report_active_user, report_interaction,
                              report_symptoms, report_test)

if __name__ == "__main__":
    print("Celery:", celery)
