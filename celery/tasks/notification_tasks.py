from collections import namedtuple
from datetime import datetime, timedelta
from typing import Optional

from shared.logger import logger
from shared.models.risk_entities import UserHealthItem
from shared.models.user_entities import User
from shared.service.celery_config import GLOBAL_CELERY_OPTIONS, get_celery
from shared.service.email_config import SendgridAPI
from shared.service.neo_config import Neo4JGraph
from shared.service.vault_config import VaultConnection

RiskTier = namedtuple('RiskTier', ['depth'])

HighRisk = RiskTier(depth=1)  # direct interaction with positive/symptomatic member
LowMediumRisk = RiskTier(depth=2)  # 2nd degree interaction with positive/symptomatic member

celery = get_celery()


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
    seen_individuals = {email}  # prevent infinite circular traversal if user links back to itself.
    individual_risk_tiers = dict()
    with Neo4JGraph() as g:
        for tier in [HighRisk, LowMediumRisk]:
            logger.info(f"Computing Risk for Tier {tier}")
            individual_risk_tiers[tier] = []
            cohort_filter = f'WHERE m1.cohort <> {cohort}' if cohort else ''  # see whether or not school uses cohorts
            record_set = list(g.run(f'''
                                MATCH p=(m {{email:"{email}", school:"{school}"}})-[:interacted_with *{tier.depth}]-(member:Member) 
                                {cohort_filter} WITH *, relationships(p) as rel WHERE all(r in rel WHERE r.timestamp >= 
                                {timestamp_limit}) return member'''))
            logger.info(f"Retrieved user risk list (n={len(record_set)}) for tier...")

            for record in record_set:
                node = record.data()['member']
                if node['email'] in seen_individuals:
                    continue

                seen_individuals.add(node['email'])
                individual_risk_tiers[tier].append(f'{node["first_name"]} {node["last_name"]}')
    return individual_risk_tiers


@celery.task(name='tasks.notify_risk', **GLOBAL_CELERY_OPTIONS)
def notify_risk(self, *, sender: User, task_data: UserHealthItem):
    """
    Asynchronously report member risk from app
    :param sender: authorized user model
    :param task_data: risk notification model
    """
    with VaultConnection() as vault:
        risk_notification_secrets = vault.read_secret(secret_path=f'schools/{sender.school}/risk_notification')

    with Neo4JGraph() as g:
        member_node = g.nodes.match("Member", email=sender.email, school=sender.school).first()
        logger.info("Located Start Member Node...")
        individuals_at_risk = calculate_interaction_risks(
            email=sender.email, school=sender.school, lookback_days=int(risk_notification_secrets['lookback_days']),
            **({'cohort': member_node['cohort']} or {})
        )

    logger.info(f"Calculated Adjacent Neighbors at Risk: {individuals_at_risk}")
    SendgridAPI.send_email(template_name='risk_notification',
                           recipients=risk_notification_secrets['recipients'].split(','),
                           template_data={
                               'name': f"{member_node['first_name']} {member_node['last_name']}",
                               'email': sender.email,
                               'cohort': member_node['cohort'] or 'N/A',
                               'high_risk': individuals_at_risk[HighRisk],
                               'medium_risk': individuals_at_risk[LowMediumRisk],
                               'criteria': task_data.format_criteria(),
                           })
    logger.info("Sent email to relevant administrators")
