"""
Neo4J Query with full parameter support
"""
from typing import Callable

from py2neo import Graph


class NeoStatementBuilder:
    def __init__(self, *, statement: str):
        """
        :param statement: parametrized query statements
        """
        self.statement = ""

    def add(self, entry=None, query=None, bind_parameters=None):
        """
        Add a match to the statement
        :param entry: pull the statement from the registry
        :param query: override statement from registry with a string
        :param bind_parameters: re map bind parameters from the query
        :return: NeoStatementBuilder
        """

    def execute(self, *, graph: Graph, callback: Callable = list, **parameters):
        """
        Execute the query and call a callback on its results
        :param graph: Py2Neo Graph
        :param callback: Callback function to serialize results
        :param parameters: list of bind parameters to improve query execution
        :return: result set
        """
        return callback(graph.run(self.statement, **parameters))
