# -*- coding: utf-8 -*-
"""
Utility functions for interacting with vault
"""
from os import environ as env_vars

from hvac import Client
from hvac.exceptions import InvalidRequest

from shared.logger import logger


class VaultConnection:
    """
    Utility class for interacting with the vault service
    """
    VAULT_URL = env_vars.get("VAULT_ADDRESS", "http://vault:8200")  # use docker-compose networking
    MAX_REFRESH_ATTEMPTS = env_vars.get("MAX_AUTHENTICATION_ATTEMPTS", 3)
    VAULT_APPROLE_ID = env_vars["ROLE_ID"]
    VAULT_APPROLE_SECRET = env_vars["SECRET_ID"]

    def __init__(self):
        self.client = Client(url=VaultConnection.VAULT_URL)
        self.refresh_token()

    def __enter__(self):
        """
        Return the VaultConnection in a context manager
        :return: the vault connection
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
        logger.info("Retrieving new vault Approle token...")
        vault_response = self.client.auth_approle(role_id=VaultConnection.VAULT_APPROLE_ID,
                                                  secret_id=VaultConnection.VAULT_APPROLE_SECRET)

        if vault_response and vault_response['auth'] and vault_response['auth']['client_token']:
            self.client.token = vault_response['auth']['client_token']
        else:
            raise Exception("Unable to retrieve approle token from Vault")

    def read_secret(self, *, secret_path: str, attempts: int = 0):
        """
        Read a Secret from Vault KV
        :param attempts: the number of attempts we have been trying to retrieve the token
        :param secret_path: the vault path to the secret (excluding kv)
        :return: the secret from vault
        """
        if attempts >= VaultConnection.MAX_REFRESH_ATTEMPTS:
            raise Exception(f"Unable to retrieve secret after {attempts} attempts")
        if not self.client.is_authenticated():
            self.refresh_token()

        try:
            return self.client.secrets.kv.read_secret_version(path=secret_path)['data']['data']
        except InvalidRequest:
            logger.exception(f"Could not read the secret @ {secret_path} (on {VaultConnection.VAULT_URL})")
            self.read_secret(secret_path=secret_path, attempts=attempts + 1)

    def close(self):
        """
        Close the Vault Connection
        """
        self.client.close()
