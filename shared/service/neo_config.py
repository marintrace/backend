# -*- coding: utf-8 -*-
"""
FastAPI REST API for processing both synchronous and
asynchronous information from clients
"""
from os import environ as env_vars

from py2neo import Graph, Node
from py2neo.internal.caching import ThreadLocalEntityCache
from shared.logger import logger
from shared.service.vault_config import VaultConnection
from shared.utilities import get_pst_time


class Neo4JGraph:
    """
    Cache for Storing Neo4J Connection
    """
    _GRAPH_CACHE = None  # Maintain Websocket Connection open so that connection doesn't need to be reestablished
    _CREDENTIAL_CACHE = None

    def __init__(self):
        logger.debug("Creating new Neo4J Context Manager")

    def retrieve_credentials(self):
        """
        Retrieve the Neo4j Credentials from the Vault
        :return: dictionary containing credentials
        """
        if not Neo4JGraph._CREDENTIAL_CACHE:
            logger.info("Acquiring new database credentials from Vault")
            with VaultConnection() as vault:
                Neo4JGraph._CREDENTIAL_CACHE = vault.read_secret(secret_path="database")
            logger.info("Cached new credentials.")
        return Neo4JGraph._CREDENTIAL_CACHE

    def __enter__(self):
        """
        Enter a context manager, establish a connection
        if it doesn't exist, otherwise, retrieve it
        :return: Neo4J Graph connection
        """
        if Neo4JGraph._GRAPH_CACHE:
            logger.info("Using existing graph connection")
            return Neo4JGraph._GRAPH_CACHE

        credentials = self.retrieve_credentials()

        logger.info("Acquiring new Neo4J Encrypted Connection")
        Neo4JGraph._GRAPH_CACHE = Graph(  # Connect to Neo4J over encrypted BOLT (websocket) connection with TLS 1.3
            f"bolt+s://{env_vars.get('NEO4J_HOST', 'tracing-neo4j')}:7687",
            secure=True, auth=(credentials['username'], credentials['password'])
        )
        logger.info("Established Connection...")
        return Neo4JGraph._GRAPH_CACHE

    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Re-establish the connection on error
        """
        # in order to get the most up to date responses from the database
        # we should reset the cache after each Neo4J context manager
        Neo4JGraph._GRAPH_CACHE.relationship_cache = ThreadLocalEntityCache()
        # Neo4JGraph._GRAPH_CACHE.node_cache = ThreadLocalEntityCache()
        if exc_type is not None:
            logger.error("Exception Encountered inside Context Manager... Resetting Cache")
            Neo4JGraph._GRAPH_CACHE = None
            Neo4JGraph._CREDENTIAL_CACHE = None


def current_day_node(*, school: str) -> Node:
    """
    Get the Graph Node for the school day if it exists.
    If it doesn't, create it.
    :param school: user's school
    """
    current_date = get_pst_time().strftime("%Y-%m-%d")
    day_properties = dict(date=current_date, school=school)
    with Neo4JGraph() as g:
        day_node = g.nodes.match("DailyReport", **day_properties).first()
        if day_node:
            return day_node
        logger.warning(f"**UNABLE TO FIND SCHOOL DAY {current_date} FOR {school}... Creating**")
        new_node = Node('DailyReport', **day_properties)
        g.create(new_node)
        return new_node


__all__ = ['Neo4JGraph', 'current_day_node']
