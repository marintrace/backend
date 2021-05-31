"""
Wrapper for the Wave API for invoicing schools via GraphQL
"""
from typing import Dict

from gql import Client
from graphql.language.ast import Document
from gql.transport.requests import RequestsHTTPTransport

from shared.service.vault_api import VaultConnection


class WaveAPI:
    """
    A wrapper to invoice schools via the Wave api
    """
    INVOICE_CONFIG = None
    _WAVE_TOKEN = None

    @staticmethod
    def retrieve_invoice_config() -> dict:
        """
        Retrieve the invoice config if it hasn't already been cached
        :return: the invoice configuration
        """
        if not WaveAPI.INVOICE_CONFIG:
            with VaultConnection() as vault:
                WaveAPI.INVOICE_CONFIG = vault.read_secret(secret_path='invoicing/invoice_config')
        return WaveAPI.INVOICE_CONFIG

    @staticmethod
    def __retrieve_api_token() -> str:
        """
        Retrieve the API token for Wave from vault if it hasn't already been cached
        :return: the api token
        """
        if not WaveAPI._WAVE_TOKEN:
            with VaultConnection() as vault:
                WaveAPI._WAVE_TOKEN = vault.read_secret(secret_path='invoicing/wave_auth')
        return WaveAPI._WAVE_TOKEN

    @staticmethod
    def send_request(gql: Document, variable_values: Dict = None):
        """
        Send a GraphQL Request using the Requests Synchronous transport
        to the Wave API and return the response
        :param gql: the graphql to execute
        :param variable_values: variable values inside the graphql statement
        :return: the json response from the wave api
        """
        transport = RequestsHTTPTransport(url='https://gql.waveapps.com/graphql/public',
                                          headers={'Authorization': f"Basic {WaveAPI.__retrieve_api_token()}",
                                                   'Content-Type': "application/json"})

        client: Client = Client(transport=transport, fetch_schema_from_transport=False)

        return client.execute(gql, variable_values=variable_values)