# -*- coding: utf-8 -*-
"""
Setup Celery Queue Access from Flask
"""
import os
import ssl

from celery import Celery
from celery.schedules import crontab
from shared.logger import logger
from shared.service.vault_config import VaultConnection

CELERY_CONFIG_OPTIONS = {
    'task_serializer': 'pickle',
    'task_create_missing_queues': True,
    'accept_content': ['pickle', 'json'],
    'worker_hijack_root_logger': False,
    'timezone': 'America/Los_Angeles',
    'broker_use_ssl': {
        'ca_certs': '/var/run/rmq-tls/ca.pem',
        'certfile': '/var/run/rmq-tls/rmq-client.pem',
        'keyfile': '/var/run/rmq-tls/rmq-client-key.pem',
        'cert_reqs': ssl.CERT_REQUIRED,
        'ssl_version': ssl.PROTOCOL_TLSv1_2
    }
}

GLOBAL_CELERY_OPTIONS = dict(
    bind=True, autoretry_for=(Exception,), retry_kwargs={'max_retries': 5},
    exponential_backoff=2, retry_jitter=os.environ.get('DEV', False)  # set to true for production
)

CELERY_CONNECTION = None


class RabbitMQCredentials:
    """
    Namespace for RabbitMQ Credentials
    """

    def __init__(self):
        self.connection_string = None

    def create_connection_string(self):
        """
        Retrieve RabbitMQ Auth information from Vault
        and return the connection string. Uses cached connection
        string if it can be used
        :return: connection string
        """
        if not self.connection_string:
            logger.info("No Cached RabbitMQ Connection String... Retrieving from Vault.")
            with VaultConnection() as vault:
                rmq_auth = vault.read_secret(secret_path="rabbitmq")
                self.connection_string = f"{rmq_auth['username']}:{rmq_auth['password']}@" \
                                         f"{os.environ['RABBITMQ_ADDRESS']}/{rmq_auth['vhost']}"
            logger.info("Retrieved new connection string and added to cache.")
        return self.connection_string


def create_daily_admin_digest_beat():
    """
    Setup Daily Administrator "Digests" for schools who would like
    them. Schools will configure their desired time in Vault (if they desire)
    and we will create Celery periodic tasks for each one.
    :return: Dictionary Config for Celery with Periodic Tasks
    """
    beat_tasks = {}

    with VaultConnection() as vault:
        logger.info("Reading School Digest from Vault")
        school_report_times = vault.read_secret(secret_path='schools/daily_digest')

        for school in school_report_times:
            hour, minute = school_report_times[school].split(':')  # split 24hr time into hour and minute at colon
            beat_tasks[f"{school}-daily-digest"] = dict(
                task='tasks.send_daily_digest',
                schedule=crontab(hour=hour, minute=minute, day_of_week='1-5'),
                args=(school,)
            )

    return beat_tasks


def get_celery():
    """
    Return Celery Object
    :return: celery object
    """
    global CELERY_CONNECTION
    if not CELERY_CONNECTION:
        connection_string = RabbitMQCredentials().create_connection_string()
        CELERY_CONNECTION = Celery("tasks", broker=f'amqp://{connection_string}',
                                   backend=f'rpc://{connection_string}')
        CELERY_CONNECTION.conf.beat_schedule = create_daily_admin_digest_beat()
        CELERY_CONNECTION.conf.update(CELERY_CONFIG_OPTIONS)
    return CELERY_CONNECTION


if __name__ == "__main__":
    celery_connection = get_celery()
    print(celery_connection)
