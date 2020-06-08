from os import environ as env_vars
from contextlib import contextmanager

from py2neo.ogm import GraphObject, Property, Related  # Graph DB Equivalent of a ORM
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
        graph = Graph(host=Neo4JConfig._host, user=Neo4JConfig._username, password=Neo4JConfig._password)
        try:
            yield graph
        finally:
            del graph


class Member(GraphObject):
    """
    Neo4j Graph node representing a school member. This could either be a teacher, student
    or an administrator. Essentially, it is anyone who could contract COVID-19.

    Properties:
        email: member email without domain attached
        cohort: school cohort id
    """
    __primarykey__ = "email"

    email = Property()
    cohort = Property()
    school = Property()

    interacted_with = Related("Member")  # Edges where people have interacted with this member
