# -*- coding: utf-8 -*-
"""
FastAPI REST API for processing both synchronous and
asynchronous information from clients
"""
from contextlib import contextmanager
from typing import Dict, Optional

from py2neo import Graph

from shared.logger import logger
from shared.service.vault_config import VaultConnection


class Neo4JCredentials:
    """
    Namespace for neo4j credentials
    """

    def __init__(self):
        self.credentials: Optional[Dict] = None
        self.has_credentials = False

    def retrieve_credentials(self):
        """
        Retrieve the Neo4j Credentials from the Vault
        :return: dictionary containing credentials
        """
        if not self.has_credentials:
            with VaultConnection() as vault:
                self.credentials = vault.read_secret(secret_path="database")
        return self.credentials


_CREDENTIALS = Neo4JCredentials()


@contextmanager
def acquire_db_graph():
    """
    Acquire the Neo4J Graph Object
    """
    logger.debug("Acquiring Database Credentials if not present...")
    credentials: Optional[Dict] = _CREDENTIALS.retrieve_credentials()
    logger.info("Establishing new graph connection to Neo4J")
    graph = Graph(
        bolt=True, host='neo4j', secure=True,
        user=credentials['username'], password=credentials['password']
    )
    try:
        yield graph
    finally:
        logger.debug("Cleaning up and closing graph connection...")
        del graph


__all__ = ['acquire_db_graph']
