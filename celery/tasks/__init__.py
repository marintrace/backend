"""
Enable Celery Automatic Task Discovery
"""
from shared.service.celery_config import get_celery

from .notification_tasks import notify_risk
from .reporting_tasks import (report_active_user, report_health,
                              report_interaction)
from .scheduled_tasks import send_daily_digest

celery = get_celery()

if __name__ == "__main__":
    print("Celery:", get_celery())
