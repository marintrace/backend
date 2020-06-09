from os import environ as env_vars
from contextlib import contextmanager

from py2neo import Graph


class Neo4JConfig:
    """
    Credentials for Neo4j Database
    """
    try:
        _username = env_vars['NEO4J_USER']
        _host = env_vars['NEO4J_HOST']
        _password = env_vars['NEO4J_PASSWORD']
    except KeyError as e:
        raise Exception(f"Environment variable {e} is not defined")

    @staticmethod
    @contextmanager
    def acquire_graph():
        """
        Acquire the Neo4J Graph Object
        """
        graph = Graph(bolt=True, host=Neo4JConfig._host, secure=True,  # All data is encrypted in transit over HTTPS
                      user=Neo4JConfig._username, password=Neo4JConfig._password)
        try:
            yield graph
        finally:
            del graph
