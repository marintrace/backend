import os
from time import time as timestamp

import boto3
from celery import Celery

from shared.neo4j import Member, Neo4JConfig


def create_celery_worker():
    """
    Create a new Celery worker
    :returns: new celery object that can be used
    to handle tasks etc.
    """
    try:
        celery_broker_url = os.environ['CELERY_BROKER_URL', 'redis://localhost:6379']
        celery_result_backend = os.environ['CELERY_RESULT_BACKEND', 'redis://localhost:6379']
    except KeyError as e:
        raise Exception(f"Missing environment variable '{e}'")

    return Celery('tasks', broker=celery_broker_url, backend=celery_result_backend)


# create celery worker
CELERY: Celery = create_celery_worker()


@CELERY.task(name='report_interaction')
def report_interaction(*, memberA: str, memberB: str, school):
    """
    Asynchronously log an interaction between two members of the school
    :param memberA: memberA's email- to log interaction with
    :param memberB: memberB's email- who memberA interacted with
    :param school: school enum value
    """
    with Neo4JConfig.acquire_graph() as g:
        # Search for memberA and memberB in graph
        member_a_node: Member = g.nodes.match("Member", email=memberA, school=school).first()
        member_b_node: Member = g.nodes.match("Member", email=memberB, school=school).first()
        member_a_node.interacted_with.add(member_b_node, properties={'timestamp': round(timestamp())})
        # Commit Transaction (ACID)
        g.push(member_a_node)
        g.push(member_b_node)


@CELERY.task(name='report_risk')
def report_risk(*, member: str, school: str, criteria: list):
    """
    Asynchronously report member risk from app
    :param member: member email at risk
    :param school: school enum value
    :param criteria: list of symptoms/associated data that point to a member with risk
    """
    ses_client = boto3.client('ses', region_name='us-west-2')  # acquire IAM credentials from EC2 instance profile
    n_deg_cnxns = lambda n: 'MATCH (m:Member {email:"' + member + '", school:"' + school + "'})-[*" + str(
        n) + "]-(m:Member)"  # generate match up to x connections

    with Neo4JConfig.acquire_graph() as g:
        high_risk_individuals = g.cypher.execute(n_deg_cnxns(1))
        medium_risk_individuals = g.cypher.execute(n_deg_cnxns(2))
        low_risk_individuals = g.cypher.execute(n_deg_cnxns(3))
