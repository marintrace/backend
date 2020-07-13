from collections import namedtuple
from datetime import datetime, timedelta
from json import dumps as serialize_json
from os import environ as env_vars
from typing import Optional
from uuid import uuid4

from boto3 import client as AWSClient

from shared.logger import logger
from shared.constants import Administrators
from shared.models import User, RiskNotification
from shared.service.celery_config import celery, CELERY_RETRY_OPTIONS
from shared.service.neo_config import acquire_db_graph

SES_CLIENT = AWSClient('ses', region_name='us-west-2')  # acquire IAM credentials from EC2 instance profile

RiskTier = namedtuple('RiskTier', ['name', 'depth'])

# Risk Tiers for Adjacent Node Interactions in Graph
HighestRisk = RiskTier('highest_risk', depth=1)  # direct interaction with positive/symptomatic member
HighRisk = RiskTier('high_risk', depth=2)  # 2nd degree interaction with positive/symptomatic member
LowMediumRisk = RiskTier('medium_risk', depth=None)  # 3rd+ degree interaction with positive/symptomatic member


def calculate_interaction_risks(*, email: str, school: str, cohort: Optional[int] = None):
    """
    Extract N degree interactions from the graph.

    :param email: user email prefix to locate starting node
    :param school: user's school enum
    :param cohort: user's cohort
    :return: list of email prefixes from n degree interactions
    """
    timestamp_limit = round((datetime.now() - timedelta(days=int(env_vars['LOOKBACK_DAYS']))).timestamp())
    seen_individuals = {email}  # email prevents circular reference in the graph
    individual_risk_tiers = {}

    with acquire_db_graph() as g:
        for tier in [HighestRisk, HighRisk, LowMediumRisk]:
            individual_risk_tiers[tier] = []
            tier_depth = tier.depth if tier.depth else ''
            cohort_filter = f'WHERE m1.cohort <> {cohort}' if cohort else ''  # see whether or not school uses cohorts
            record_set = list(g.run(f'''
                MATCH p=(m {{email:"{email}", school:"{school}"}})-[:interacted_with *{tier_depth}]-
                (m1:Member) {cohort_filter} WITH *, relationships(p) as rel
                WHERE all(r in rel WHERE r.timestamp >= {timestamp_limit})
                return m1'''))

            for record in record_set:
                node = record.data()['m1']
                if node['email'] in seen_individuals:
                    continue
                seen_individuals.add(node['email'])
                individual_risk_tiers[tier].append(node['name'])

    del seen_individuals
    return individual_risk_tiers


@celery.task(name='tasks.notify_risk', **CELERY_RETRY_OPTIONS)
def notify_risk(self, *, user: User, task_data: RiskNotification):
    """
    Asynchronously report member risk from app
    :param user: authorized user model
    :param task_data: risk notification model
    """
    with acquire_db_graph() as g:
        member_node = g.nodes.match("Member", email=user.email, school=user.school).first()
    individuals_at_risk = calculate_interaction_risks(email=user.email, school=user.school,
                                                      **({'cohort': member_node['cohort']} or {}))
    logger.info(f"Calculated Adjacent Neighbors at Risk: {individuals_at_risk}")
    SES_CLIENT.send_templated_email(  # should be allowed from EC2 Instance Profile on Amazon
        Template='trace',
        Source=f"Tracing App <{env_vars['FROM_EMAIL']}>",
        Destination={'ToAddresses': Administrators.get(user.school)},
        ReplyToAddresses=env_vars['REPLY_TO_EMAILS'].split(','),
        TemplateData=serialize_json({  # Boto3 Requires a Serialized JSON String
            'member': f'{user.email} (Cohort: {member_node["cohort"]})',
            'highest_risk_members': ', '.join(individuals_at_risk[HighestRisk]),
            'high_risk_members': ', '.join(individuals_at_risk[HighRisk]),
            'medium_risk_members': ', '.join(individuals_at_risk[LowMediumRisk]),
            'symptoms': ', '.join(task_data.criteria), 'request_id': str(uuid4()),
        })
    )
    logger.info("Sent email to relevant administrators")
