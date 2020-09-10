from py2neo import Relationship, RelationshipMatcher
from pydantic import BaseModel

from shared.logger import logger
from shared.models import User
from shared.service.neo_config import acquire_db_graph, current_day_node


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
