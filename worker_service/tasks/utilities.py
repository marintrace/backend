from pydantic import BaseModel
from py2neo import Node, Relationship, RelationshipMatcher

from shared.logger import logger
from shared.models import User
from shared.service.neo_config import acquire_db_graph
from shared.utilities import get_pst_time


def current_day_node(*, school: str) -> Node:
    """
    Get the Graph Node for the school day if it exists.
    If it doesn't, create it.
    :param school: user's school
    """
    current_date = get_pst_time().strftime("%Y-%m-%d")
    day_properties = dict(date=current_date, school=school)
    with acquire_db_graph() as g:
        day_node = g.nodes.match("SchoolDay", **day_properties).first()
        if day_node:
            return day_node
        logger.warning(f"**UNABLE TO FIND SCHOOL DAY {current_date} FOR {school}... Creating**")
        new_node = Node('SchoolDay', **day_properties)
        g.create(new_node)
        return new_node


def update_active_user_report(user: User, report: BaseModel):
    """
    Add a Report Relationship between the specified user and the school's
    day tracking node
    :param user: authorized user
    :param report: the report model
    """
    with acquire_db_graph() as g:
        authorized_user_node = g.nodes.match("Member", email=user.email, school=user.school).first()
        day_node = current_day_node(school=user.school)
        graph_edge = RelationshipMatcher(graph=g).match(nodes={authorized_user_node, day_node}).first()
        if graph_edge:
            logger.info("Found existing graph edge between user and school day node. Updating with new properties...")
            for prop, value in report:
                graph_edge[prop] = value
            g.push(graph_edge)
        else:
            g.create(Relationship(authorized_user_node, "reported", day_node, **report.dict()))
