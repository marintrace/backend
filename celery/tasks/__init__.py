"""
Enable Celery Automatic Task Discovery
"""
from celery import signals
from shared.logger import logger
from shared.service.celery_wrapper import get_celery

from .notification_tasks import notify_risk
from .reporting_tasks import (report_active_user, report_health,
                              report_interaction)
from .scheduled_tasks import send_daily_digest
from .user_mgmt_tasks import admin_create_user

celery = get_celery()


@signals.task_retry.connect
@signals.task_failure.connect
@signals.task_revoked.connect
def on_task_failure(**kwargs):
    """
    Abort transaction on task errors.
    """
    # celery exceptions will not be published to `sys.excepthook`. therefore we have to create another handler here.
    logger.exception('Failed: [task:%s:%s]' % (kwargs.get('task_id'), kwargs['sender'].request.correlation_id,))


if __name__ == "__main__":
    print("Celery:", get_celery())
