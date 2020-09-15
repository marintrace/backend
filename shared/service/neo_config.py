# -*- coding: utf-8 -*-
"""
FastAPI REST API for processing both synchronous and
asynchronous information from clients
"""
from os import environ as env_vars

from py2neo import Graph, Node

from shared.logger import logger
from shared.service.vault_config import VaultConnection
from shared.utilities import get_pst_time


class Neo4JGraph:
    """
    Cache for Storing Neo4J Connection
    """

    def __init__(self):
        self.credentials = None
        self.graph = None

    def retrieve_credentials(self):
        """
        Retrieve the Neo4j Credentials from the Vault
        :return: dictionary containing credentials
        """
        if not self.credentials:
            logger.info("Acquiring new database credentials from Vault")
            with VaultConnection() as vault:
                self.credentials = vault.read_secret(secret_path="database")
            logger.info("Cached new credentials.")
        return self.credentials

    def __enter__(self):
        """
        Enter a context manager, establish a connection
        if it doesn't exist, otherwise, retrieve it
        :return: Neo4J Graph connection
        """
        if self.graph:
            logger.info("Using existing graph connection")
            return self.graph

        credentials = self.credentials or self.retrieve_credentials()

        logger.info("Acquiring new Neo4J Encrypted Connection")
        self.graph = Graph(
            f"bolt+ssc://{env_vars.get('NEO4J_HOST', 'tracing-neo4j')}:7687",
            auth=(credentials['username'], credentials['password'])
        )

        return self.graph

    def __exit__(self, exc_type, exc_val, exc_tb):
        """
        Re-establish the connection on error
        """
        if exc_type is not None:
            self.__enter__()


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
