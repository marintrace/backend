# -*- coding: utf-8 -*-
"""
Utility functions for interacting with vault_server
"""
from os import environ as env_vars

from hvac import Client
from hvac.exceptions import InvalidRequest
from retry import retry

from shared.logger import logger


class VaultConnection:
    """
    Utility class for interacting with the vault_server service
    """
    VAULT_URL = f'{env_vars["VAULT_ADDRESS"]}:8200'
    MAX_REFRESH_ATTEMPTS = env_vars.get("MAX_AUTHENTICATION_ATTEMPTS", 3)
    VAULT_ROLE = env_vars['VAULT_ROLE']

    with open('/var/run/secrets/kubernetes.io/serviceaccount/token', 'r') as token_secret_file:
        VAULT_SERVICE_TOKEN = token_secret_file.read()

    assert len(VAULT_SERVICE_TOKEN) > 1, "Unable to read Kubernetes Service Account Token"

    def __init__(self):
        self.client = Client(url=VaultConnection.VAULT_URL)
        self.refresh_token()

    def __enter__(self):
        """
        Return the VaultConnection in a context manager
        :return: the vault_server connection
        """
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Cleanup after context manager scope is exited
        :param exc_type: the exception type raised (if any)
        :param exc_val: the exception value raised (if any)
        :param exc_tb: the exception traceback raised (if any)
        """
        self.close()

    def refresh_token(self):
        """
        Get the authentication token from the approle
        :return: token if successful authentication
        """
        logger.info("Retrieving new vault_server token via k8s service account...")
        vault_response = self.client.auth_kubernetes(role=VaultConnection.VAULT_ROLE,
                                                     jwt=VaultConnection.VAULT_SERVICE_TOKEN)

        if vault_response and vault_response['auth'] and vault_response['auth']['client_token']:
            self.client.token = vault_response['auth']['client_token']
        else:
            raise Exception("Unable to authorize Kubernetes auth from Vault")

    @retry((InvalidRequest,), tries=3, delay=2)
    def read_secret(self, *, secret_path: str):
        """
        Read a Secret from Vault KV
        :param secret_path: the vault_server path to the secret (excluding kv)
        :return: the secret from vault_server
        """
        if not self.client.is_authenticated():
            self.refresh_token()

        try:
            logger.info(f"Reading Encrypted Secret from vault_server @ {secret_path}")
            return self.client.secrets.kv.read_secret_version(path=secret_path)['data']['data']
        except InvalidRequest:
            logger.exception(f"Could not read the secret @ {secret_path} (on {VaultConnection.VAULT_URL})")
            self.refresh_token()
            raise

    def close(self):
        """
        Close the Vault Connection
        """
        self.client.close()
