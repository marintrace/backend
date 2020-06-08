"""
Neo4j Graph Models for Tracking interactions between members
"""

from py2neo.ogm import GraphObject, Property, Related  # Graph DB Equivalent of a ORM


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

    interacted_with = Related("Member")  # Edges where people have interacted with this member
