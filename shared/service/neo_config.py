# -*- coding: utf-8 -*-
"""
FastAPI REST API for processing both synchronous and
asynchronous information from clients
"""
from contextlib import contextmanager
from os import environ as env_vars

from py2neo import Graph

_DB_USERNAME = env_vars["NEO4J_USER"]
_DB_PASSWORD = env_vars["NEO4J_PASSWORD"]


@contextmanager
def acquire_db_graph():
    """
    Acquire the Neo4J Graph Object
    """
    graph = Graph(
        bolt=True,
        host='neo4j',
        secure=True,  # All data is encrypted in transit over HTTPS
        user=_DB_USERNAME,
        password=_DB_PASSWORD,
    )
    try:
        yield graph
    finally:
        del graph
