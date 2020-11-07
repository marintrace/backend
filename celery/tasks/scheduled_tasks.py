from celery.schedules import crontab

from shared.logger import logger
from shared.service.celery_config import get_celery, CELERY_RETRY_OPTIONS
from shared.service.vault_config import VaultConnection

celery = get_celery()


@celery.on_after_configure.connect
def create_daily_admin_digest_beat(sender, **kwargs):
    """
    Setup Daily Administrator "Digests" for schools who would like
    them. Schools will configure their desired time in Vault (if they desire)
    and we will create Celery periodic tasks for each one.
    """

    with VaultConnection() as vault:
        logger.info("Reading School Digest from Vault")
        school_report_times = vault.read_secret(secret_path='schools/daily_digest')

        for school in school_report_times:
            hour, minute = school_report_times[school].split(':')  # split 24hr time into hour and minute at colon
            sender.add_periodic_task(
                crontab(hour=hour, minute=minute, day_of_week='1-5'),  # every WEEKDAY only
                send_daily_digest.s(school)  # define signature to be of school
            )


@celery.task(name='tasks.daily_digest', **CELERY_RETRY_OPTIONS)
def send_daily_digest(school: str):
    """
    Periodically send a daily digest to a specified school
    containing a list of individuals who haven't yet reported.

    :param school: school name (must match Neo4J)
    """
    pass
