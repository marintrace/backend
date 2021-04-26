"""
Utility functions for interacting with Flower Monitoring Service
"""
from os import environ as env_vars
from typing import Dict, Optional

from shared.logger import logger
from shared.service.vault_config import VaultConnection


class FlowerAPI:
    """
    Utility function for communicating with Flower API
    """
    FLOWER_URL = f'{env_vars["FLOWER_ADDRESS"]}:5000/'
    _CREDENTIALS: Optional[Dict] = None

    @staticmethod
    def retrieve_credentials() -> Dict[str, str]:
        """
        Retrieve the Flower Credentials from Vault if they are not already cached
        :return: the flower credentials from vault
        """
        if not FlowerAPI._CREDENTIALS:
            logger.info("Couldn't locate flower credentials... retrieving from vault.")
            with VaultConnection() as vault:
                FlowerAPI._CREDENTIALS = vault.read_secret(secret_path='flower')
        return FlowerAPI._CREDENTIALS

    @staticmethod
    def get_url(path: str):
        """
        Get the url for a specified path on the Flower API
        :param path: path on flower API
        :return: fully formatted URL for HTTP request
        """
        return FlowerAPI.FLOWER_URL + path.lstrip('/')
