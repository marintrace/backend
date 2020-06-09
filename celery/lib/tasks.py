from collections import namedtuple
from functools import partial
import json
import logging
import os
from time import time as timestamp

import boto3
from celery import Celery
from py2neo.data import Relationship

from shared.neo4j import Neo4JConfig
from shared.school import Administrators

logging.basicConfig()
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

ses_client = boto3.client('ses', region_name='us-west-2')  # acquire IAM credentials from EC2 instance profile


def create_celery_worker():
    """
    Create a new Celery worker
    :returns: new celery object that can be used
    to handle tasks etc.
    """
    try:
        celery_broker_url = os.environ.get('CELERY_BROKER_URL', 'redis://redis:6379')
        celery_result_backend = os.environ.get('CELERY_RESULT_BACKEND', 'redis://redis:6379')
    except KeyError as e:
        raise Exception(f"Missing environment variable '{e}'")

    return Celery('tasks', broker=celery_broker_url, backend=celery_result_backend)


# create celery worker
CELERY: Celery = create_celery_worker()


@CELERY.task(name='tasks.report_interaction')
def report_interaction(*, memberA: str, memberB: str, school):
    """
    Asynchronously log an interaction between two members of the school
    :param memberA: memberA's email- to log interaction with
    :param memberB: memberB's email- who memberA interacted with
    :param school: school enum value
    """
    with Neo4JConfig.acquire_graph() as g:
        # Search for memberA and memberB in graph
        member_a_node = g.nodes.match("Member", email=memberA, school=school).first()
        member_b_node = g.nodes.match("Member", email=memberB, school=school).first()
        interaction = Relationship(member_a_node, "interacted_with", member_b_node, timestamp=round(timestamp()))
        # Commit Transaction (ACID)
        g.create(interaction)


class NotifyRiskUtils:
    RiskTier = namedtuple('RiskTier', ['name', 'depth'])

    # Risk Tiers for Adjacent Node Interactions in Graph
    HighestRisk = RiskTier('highest_risk', depth=1)  # direct interaction with positive/symptomatic member
    HighRisk = RiskTier('high_risk', depth=2)  # 2nd degree interaction with positive/symptomatic member
    LowMediumRisk = RiskTier('medium_risk', depth=None)  # 3rd+ degree interaction with positive/symptomatic member

    TIERS = [HighestRisk, HighRisk, LowMediumRisk]

    @staticmethod
    def extract_n_degree_interactions(*, graph, email, school):
        """
        Extract N degree interactions from the graph. When execution
        is repeated, arguments to should be partial (fixed)

        :param graph: Neo4J graph object
        :param email: user email prefix to locate starting node
        :param school: user's school enum
        :param n: n degree connections to extract
        :return: list of email prefixes from n degree interactions
        """

        seen_individuals = {email.replace('_', ' ').title()} # add member to seen to prevent circular reference
        individual_risk_tiers = {}  # build output tiers

        for tier in NotifyRiskUtils.TIERS:
            individual_risk_tiers[tier] = []
            record_set = list(graph.run(f'''
            MATCH(m: Member {{email: "{email}", school: "{school}"}})-[*{tier.depth if tier.depth else ''}]-(m1:Member)
            RETURN m1'''))  # Database Cursor is lazy, so need to run list operation to serialize

            for record in record_set:
                node_email = record.data()['m1']['email'].replace('_', ' ').title()  # node name from above cypher query
                if node_email in seen_individuals:
                    continue
                seen_individuals.add(node_email)
                individual_risk_tiers[tier].append(node_email)

        del seen_individuals  # free up memory

        return individual_risk_tiers


@CELERY.task(name='tasks.notify_risk')
def report_risk(*, member: str, school: str, criteria: list):
    """
    Asynchronously report member risk from app
    :param member: member email at risk
    :param school: school enum value
    :param criteria: list of symptoms/associated data that point to a member with risk
    """

    with Neo4JConfig.acquire_graph() as g:
        individuals_at_risk = NotifyRiskUtils.extract_n_degree_interactions(graph=g, email=member, school=school)
        print(individuals_at_risk)
    try:
        ses_client.send_templated_email(
            Template='trace',
            Source=f"Amrit Baveja <{os.environ['FROM_EMAIL']}>",
            Destination={'ToAddresses': Administrators.get(school)},
            ReplyToAddresses=os.environ['REPLY_TO_EMAILS'].split(','),
            TemplateData=json.dumps({  # Boto3 Requires a Serialized JSON String
                'member': member.replace('_', ' ').title(),
                'highest_risk_members': individuals_at_risk[NotifyRiskUtils.HighestRisk],
                'high_risk_members': individuals_at_risk[NotifyRiskUtils.HighRisk],
                'medium_risk_members': individuals_at_risk[NotifyRiskUtils.LowMediumRisk],
                'symptoms': ','.join(criteria), 'request_id': timestamp(),
            })
        )
    except KeyError as e:
        logger.exception("Missing Environment Variable:")
        raise Exception(f"Missing Environment Variable: '{e}'")
