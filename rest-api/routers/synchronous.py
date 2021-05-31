# -*- coding: utf-8 -*-
"""
Synchronous API for client-side display in both iOS and Web Apps
"""
from fastapi import APIRouter, status
from py2neo.matching import NodeMatcher

from shared.date_utils import pst_date
from shared.logger import logger
from shared.models.enums import EntryReason, VaccinationStatus
from shared.models.risk_entities import (IdentifiedUserEntryItem,
                                         SymptomConfigRetriever,
                                         UserHealthItem, UserLocationItem)
from shared.models.user_entities import HealthReport, ListUsersResponse, User
from shared.service.neo4j_api import Neo4JGraph

from .authorization import AUTH_USER

# Synchronous API Router-- we can mount it to the main API
SYNC_ROUTER = APIRouter()


@SYNC_ROUTER.get('/list/users', response_model=ListUsersResponse, status_code=status.HTTP_200_OK,
                 description="List the users from a specified school (no PII)", operation_id='list_users')
async def list_users(user: User = AUTH_USER):
    """
    List the users who belong to a specified school
    """
    logger.info(f"Listing Users for school: {user.school}")
    with Neo4JGraph() as g:
        logger.info("Acquired Neo4J Graph... Running Selection query")
        result_set = list(NodeMatcher(graph=g).match("Member").where(f"_.school = '{user.school}'"))
    return ListUsersResponse(users=[User(**member) for member in result_set])


@SYNC_ROUTER.get('/get-user-entry', response_model=IdentifiedUserEntryItem, status_code=status.HTTP_200_OK,
                 description="Get a user's current health status", operation_id='user_status')
async def entry_card(user: User = AUTH_USER):
    """
    Retrieve the current user status from the backend
    """
    logger.info(f"Retrieving user entry status for school: {user.school}")
    with Neo4JGraph() as graph:
        record = dict(list(graph.run(
            """MATCH (m:Member {email: $email,school: $school})
              OPTIONAL MATCH (m)-[r:reported]-(d:DailyReport {date: $date}) RETURN r as report, m as member""",
            email=user.email, school=user.school, date=pst_date()))[0])

        location_risk = UserLocationItem().set_location(record['member']['location'])
        health_risk = UserHealthItem(school=user.school)

        if not record.get('report'):
            health_risk.set_incomplete()
        else:
            health_risk.from_health_report(HealthReport(**record['report']))

        if record['member']['vaccinated'] == VaccinationStatus.VACCINATED:
            health_risk.add_vaccination(VaccinationStatus.VACCINATED,
                                        update_color=not SymptomConfigRetriever.get(user.school)['ignore_vaccine'])

        identified_item_params = dict(name=f"{record['member']['first_name']} {record['member']['last_name']}")

        if location_risk.entry_blocked():
            identified_item_params.update(dict(entry=False, reason=EntryReason.LOCATION))
        elif health_risk.is_incomplete() or health_risk.at_risk(include_warning=True):
            identified_item_params.update(dict(entry=False, reason=EntryReason.HEALTH))
        else:
            identified_item_params.update(dict(entry=True, reason=EntryReason.HEALTH))

        return IdentifiedUserEntryItem(**identified_item_params).set_reports(health=health_risk, location=location_risk)
