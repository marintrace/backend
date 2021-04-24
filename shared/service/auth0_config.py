# -*- coding: utf-8 -*-
"""
Setup Auth0 Management API and pulling credentials
"""
import urllib.parse
from typing import Dict, Optional

import requests
from jose import ExpiredSignatureError, jwt
from retry import retry

from shared.logger import logger
from shared.service.vault_config import VaultConnection


def is_jwt_expired(token: str) -> bool:
    """
    Check whether or not a given JWT is expired without
    verifying the signature.
    :param token: the JWT token to check
    :return: whether or not it is expired
    """
    try:
        # Since this JWT is coming from a trusted source (Auth0), and is being
        # verified when we send requests, there is no need to validate the signature.
        jwt.decode(token=token, key='', options={'verify_signature': False})
        return True
    except ExpiredSignatureError:
        return False


class Auth0ManagementClient:
    """
    An API wrapper to interface with the Auth0 Management API Client
    """
    _AUTH0_CRED_CONFIG: Optional[Dict[str, str]] = None
    _ROLE_MAPPING: Optional[Dict[str, str]] = None
    _JWT: Optional[str] = None
    _AUDIENCE: Optional[str] = None

    @staticmethod
    def retrieve_auth0_config() -> Dict[str, str]:
        """
        Retrieve the credentials from vault if they are not already cached
        :return: the vault entry corresponding to Auth0 Management API credentials
        """
        if not Auth0ManagementClient._AUTH0_CRED_CONFIG:
            with VaultConnection() as vault:
                Auth0ManagementClient._AUTH0_CRED_CONFIG = vault.read_secret(secret_path='oidc/admin-mgmt')
                Auth0ManagementClient._AUDIENCE = Auth0ManagementClient._AUTH0_CRED_CONFIG['audience']
        logger.info(Auth0ManagementClient._AUTH0_CRED_CONFIG)
        return Auth0ManagementClient._AUTH0_CRED_CONFIG

    @staticmethod
    @retry((AssertionError,), tries=3, delay=1)
    def refresh_grant():
        """
        Return a refreshed JWT from Auth0
        :return: a new JWT
        """
        logger.info("Refreshing Auth0 JWT...")
        config = Auth0ManagementClient.retrieve_auth0_config()
        payload = {
            'grant_type': 'client_credentials', 'client_id': config['client_id'],
            'client_secret': config['client_secret'], 'audience': f"{config['audience']}"
        }
        request = requests.post(url=f"{config['tenant']}/oauth/token",
                                headers={'Content-Type': 'application/x-www-form-urlencoded'},
                                data=urllib.parse.urlencode(payload))
        if not request.ok:
            logger.error(f"Failed to refresh Auth0 JWT: {request.json()}")
            raise AssertionError("The request to get a token did not succeed")
        logger.info("Successfully refreshed Auth0 token")
        Auth0ManagementClient._JWT= request.json()['access_token']

    @staticmethod
    def get_url(path) -> str:
        """
        Get the API URL to interact with the Auth0 Client
        :return: API URL
        """
        if not Auth0ManagementClient._AUTH0_CRED_CONFIG:
            Auth0ManagementClient.retrieve_auth0_config()
        return Auth0ManagementClient._AUTH0_CRED_CONFIG['audience'] + path

    @staticmethod
    def get_role_id(role_name: str) -> str:
        """
        Get the role id associated with a specified role name
        :param role_name: the role name to get
        :return: the id of the role
        """
        if not Auth0ManagementClient._ROLE_MAPPING:
            with VaultConnection() as vault:
                Auth0ManagementClient._ROLE_MAPPING = vault.read_secret('oidc/roles')
        return Auth0ManagementClient._ROLE_MAPPING[role_name]

    @staticmethod
    def get_jwt() -> str:
        """
        Get a JWT to interact with the Auth0 Management Client API
        :return: a string JWT
        """
        if not Auth0ManagementClient._AUTH0_CRED_CONFIG:
            Auth0ManagementClient.retrieve_auth0_config()
        if not Auth0ManagementClient._JWT or is_jwt_expired(Auth0ManagementClient._JWT):
            Auth0ManagementClient.refresh_grant()
        return Auth0ManagementClient._JWT

    @staticmethod
    def get_jwt_header() -> dict:
        return {'Authorization': 'Bearer ' + Auth0ManagementClient.get_jwt()}
