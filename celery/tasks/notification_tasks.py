from collections import namedtuple
from datetime import datetime, timedelta
from typing import Optional
from uuid import uuid4

from boto3 import client as AWSClient

from shared.logger import logger
from shared.models import RiskNotification, User
from shared.service.celery_config import CELERY_RETRY_OPTIONS, celery
from shared.service.neo_config import acquire_db_graph
from shared.service.vault_config import VaultConnection
from shared.service.email_config import EmailClient

SES_CLIENT = AWSClient('ses', region_name='us-west-2')  # acquire IAM credentials from EC2 instance profile
EMAIL_CLIENT = EmailClient()

RiskTier = namedtuple('RiskTier', ['name', 'depth'])
HighestRisk = RiskTier('highest_risk', depth=1)  # direct interaction with positive/symptomatic member
HighRisk = RiskTier('high_risk', depth=2)  # 2nd degree interaction with positive/symptomatic member
LowMediumRisk = RiskTier('medium_risk', depth=None)  # 3rd+ degree interaction with positive/symptomatic member


def calculate_interaction_risks(*, email: str, school: str, lookback_days: int, cohort: Optional[int] = None):
    """
    Extract N degree interactions from the graph.

    :param email: user email prefix to locate starting node
    :param school: user's school enum
    :param cohort: user's cohort
    :param lookback_days: the number of days to look back for interactions when calculating risk
    :return: list of email prefixes from n degree interactions
    """
    timestamp_limit = round((datetime.now() - timedelta(days=lookback_days)).timestamp())
    seen_individuals = {email}  # email prevents circular reference in the graph
    individual_risk_tiers = dict()

    with acquire_db_graph() as g:
        for tier in [HighestRisk, HighRisk, LowMediumRisk]:
            individual_risk_tiers[tier] = []
            tier_depth = tier.depth if tier.depth else ''
            cohort_filter = f'WHERE m1.cohort <> {cohort}' if cohort else ''  # see whether or not school uses cohorts
            record_set = list(g.run(f'''
                MATCH p=(m {{email:"{email}", school:"{school}"}})-[:interacted_with *{tier_depth}]-(m1:Member) 
                {cohort_filter} WITH *, relationships(p) as rel WHERE all(r in rel WHERE r.timestamp >= 
                {timestamp_limit}) return m1'''))

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
    EMAIL_CLIENT.setup()
    with acquire_db_graph() as g:
        member_node = g.nodes.match("Member", email=user.email, school=user.school).first()

    with VaultConnection() as vault:
        risk_notification_secrets = vault.read_secret(secret_path=f'schools/{user.school}/risk_notification')
    individuals_at_risk = calculate_interaction_risks(email=user.email, school=user.school,
                                                      lookback_days=int(risk_notification_secrets['lookback_days']),
                                                      **({'cohort': member_node['cohort']} or {}))

    logger.info(f"Calculated Adjacent Neighbors at Risk: {individuals_at_risk}")
    EMAIL_CLIENT.send_email(template_name='risk_notification',
                            recipients=risk_notification_secrets['recipients'].split(','),
                            template_data={
                                'member': f'{user.email} (Cohort: {member_node["cohort"]})',
                                'highest_risk_members': ', '.join(individuals_at_risk[HighestRisk]),
                                'high_risk_members': ', '.join(individuals_at_risk[HighRisk]),
                                'medium_risk_members': ', '.join(individuals_at_risk[LowMediumRisk]),
                                'symptoms': ', '.join(task_data.criteria), 'request_id': str(uuid4()),
                            })
    logger.info("Sent email to relevant administrators")
