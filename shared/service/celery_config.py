# -*- coding: utf-8 -*-
"""
Setup Celery Queue Access from Flask
"""
import os
import ssl

from shared.service.vault_config import VaultConnection
from shared.logger import logger

CELERY_CONFIG_OPTIONS = {
    'task_serializer': 'pickle',
    'task_create_missing_queues': True,
    'accept_content': ['pickle', 'json'],
    'worker_hijack_root_logger': False,
    'broker_use_ssl': {
        'ca_certs': '/var/run/rmq-tls/ca.pem',
        'certfile': '/var/run/rmq-tls/rabbitmq.pem',
        'keyfile': '/var/run/rmq-tls/rabbitmq-key.pem',
        'cert_reqs': ssl.CERT_REQUIRED
    }
}

CELERY_RETRY_OPTIONS = dict(
    bind=True, autoretry_for=(Exception,), retry_kwargs={'max_retries': 5},
    exponential_backoff=2, retry_jitter=os.environ.get('DEV', False)  # set to true for production
)


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
                self.connection_string = f"amqp://{rmq_auth.username}:{rmq_auth.password}@" \
                                         f"{os.environ['RABBITMQ_ADDRESS']}/{rmq_auth.vhost}"
            logger.info("Retrieved new connection string and added to cache.")
        return self.connection_string


def get_celery():
    """
    Return Celery Object
    :return: celery object
    """
    from celery import Celery
    connection_string = RabbitMQCredentials().create_connection_string()
    celery: Celery = Celery("tasks", broker=connection_string, backend=connection_string)
    celery.conf.update(CELERY_CONFIG_OPTIONS)
    return celery


if __name__ == "__main__":
    celery_connection = get_celery()
    print(celery_connection)
