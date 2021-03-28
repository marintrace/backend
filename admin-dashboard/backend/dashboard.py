from fastapi import APIRouter
from py2neo import RelationshipMatcher

from shared.logger import logger
from shared.models.admin_entities import (AdminDashboardUser,
                                          IdSingleUserDualStatus,
                                          IdUserPaginationRequest,
                                          MultipleUserDualStatuses,
                                          NumericalWidgetResponse,
                                          OptIdPaginationRequest,
                                          SingleUserDualStatus,
                                          SingleUserHealthHistory,
                                          UserIdentifier,
                                          UserInfoDetail,
                                          UserInteraction,
                                          UserInteractionHistory)
from shared.models.enums import UserLocationStatus, VaccinationStatus
from shared.models.risk_entities import UserHealthItem, UserLocationItem, DatedUserHealthHolder
from shared.models.user_entities import HealthReport
from shared.service.neo_config import Neo4JGraph, current_day_node
from shared.utilities import (DATE_FORMAT, get_pst_time, parse_timestamp,
                              pst_date)
from .authorization import OIDC_COOKIE

# Mounted on the main router
BACKEND_ROUTER = APIRouter()


async def create_health_status(user: dict, report: dict) -> UserHealthItem:
    """
    Create a Summary item from a graph edge between a member and DailyReport
    :param user: JSON describing the user
    :param report: JSON record of the response from Neo4J
    """
    risk_item = UserHealthItem(school=school)

    if not report:
        return risk_item.set_incomplete()
    elif user['vaccinated'] == VaccinationStatus.VACCINATED:
        return risk_item.add_vaccination(vaccine)
    return risk_item.from_health_report(health_report=HealthReport(**dict(record)))


async def create_location_status(location: UserLocationStatus) -> UserLocationItem:
    """
    Create a Summary item from the user's set location
    :param location: user location status
    :return: UserLocationItem for rendering
    """
    location_item = UserLocationItem()
    return location_item.set_location(location)


@BACKEND_ROUTER.post(path="/submitted-symptom-reports", response_model=NumericalWidgetResponse,
                     summary="Retrieve the number of submitted symptom reports")
async def get_submitted_symptom_reports(user: AdminDashboardUser = OIDC_COOKIE):
    """
    Get the number of submitted symptom reports for the school
    that the admin belongs to
    """
    logger.info(f"Retrieving number of submitted symptom reports for school '{user.school}'")
    with Neo4JGraph() as graph:
        current_day = current_day_node(school=user.school)
        matcher = RelationshipMatcher(graph=graph)
        submitted_reports = len(matcher.match(nodes=(None, current_day), r_type='reported'))
        return NumericalWidgetResponse(value=submitted_reports)


@BACKEND_ROUTER.post(path="/paginate-user-reports", response_model=SingleUserHealthHistory,
                     summary="Paginate through user report history")
async def paginate_user_report_history(request: IdUserPaginationRequest,
                                       user: AdminDashboardUser = OIDC_COOKIE):
    """
    Paginate through a user's report history
    """
    logger.info("Paginating user report history")
    with Neo4JGraph() as graph:
        records = list(graph.run(
            """MATCH (m: Member {school: $school, email: $email})-[report:reported]-(d: DailyReport)
            RETURN m.vaccination_status as vaccinated, report, report.timestamp as timestamp
            ORDER BY report.timestamp DESC
            SKIP $pag_token LIMIT $limit""",
            school=user.school, email=request.email, pag_token=request.pagination_token,
            limit=request.limit
        ))
        health_reports = [DatedUserHealthHolder(timestamp=parse_timestamp(record['timestamp']).strftime("%Y-%m-%d"),
                                                dated_report=await create_health_status(record['user'], record['report']))
                          for record in records]
        return SingleUserHealthHistory(
            health_reports=health_reports,
            pagination_token=request.pagination_token + request.limit
        )


@BACKEND_ROUTER.post(path="/paginate-user-summary-items", response_model=MultipleUserDualStatuses,
                     summary="Paginate through admin dashboard status records")
async def paginate_user_summary_items(request: OptIdPaginationRequest,
                                      user: AdminDashboardUser = OIDC_COOKIE):
    """
    Paginate through the user summary items to render the home screen admin-dashboard
    """
    with Neo4JGraph() as graph:
        records = list(graph.run(
            f"""MATCH (m: Member {{school: $school}})
            {"WHERE m.email STARTS WITH '" + request.email + "'" if request.email else ''}  
            OPTIONAL MATCH(m)-[report:reported]-(d:DailyReport {{date: $date}})
            RETURN m as member, report 
            ORDER BY COALESCE(report.risk_score, 0) DESC
            SKIP $pag_token LIMIT $limit""",
            school=user.school, date=get_pst_time().strftime(DATE_FORMAT), pag_token=request.pagination_token,
            limit=request.limit
        ))

    statuses = [
        IdSingleUserDualStatus(health=await create_health_status(record['user'], record['report']),
                               email=record['user']['email'],
                               location=await create_location_status(record['member'].get('location'))) for record in
        records
    ]

    return MultipleUserDualStatuses(statuses=statuses, pagination_token=request.pagination_token + request.limit)


@BACKEND_ROUTER.post(path="/get-user-info", response_model=UserInfoDetail,
                     summary="Get a user's detail from the database")
async def get_user_info(identifier: UserIdentifier, user: AdminDashboardUser = OIDC_COOKIE):
    """
    Get the user info from the database for the specified user
    """
    logger.info("Retrieving user info")
    with Neo4JGraph() as graph:
        # Scope User Retrieval to the Admin Dashboard's Logged In School
        member_node = graph.nodes.match("Member", email=identifier.email, school=user.school).first()
        return UserInfoDetail(
            first_name=member_node['first_name'],
            last_name=member_node['last_name'],
            cohort=member_node['cohort'],
            email=member_node['email'],
            school=member_node['school'],
            active=member_node.get('status') == 'active',
        )


@BACKEND_ROUTER.post(path="/paginate-user-interactions", response_model=UserInteractionHistory,
                     summary="Retrieve a user's interactions")
async def paginate_user_interactions(request: IdUserPaginationRequest, user: AdminDashboardUser = OIDC_COOKIE):
    """
    Paginate through a user's interactions
    """
    with Neo4JGraph() as graph:
        records = list(graph.run(
            """MATCH (m:Member {email: $email, school: $school})-[i:interacted_with]-(target:Member)
            RETURN target.email as email, i.timestamp as timestamp 
            ORDER BY i.timestamp DESC
            SKIP $pag_token LIMIT $limit""",
            school=user.school, email=request.email, pag_token=request.pagination_token, limit=request.limit
        ))

        users = [
            UserInteraction(email=record['email'], timestamp=parse_timestamp(record['timestamp']).strftime("%Y-%m-%d"))
            for record in records
        ]
        return UserInteractionHistory(users=users, pagination_token=request.pagination_token + request.limit)


@BACKEND_ROUTER.post(path="/user-summary-status", response_model=SingleUserDualStatus,
                     summary="Retrieve a user's summary status and color")
async def get_user_summary_status(identifier: UserIdentifier, user: AdminDashboardUser = OIDC_COOKIE):
    """
    Get the user's summary status
    """
    logger.info("Acquiring User Summary Status")

    with Neo4JGraph() as graph:
        records = list(graph.run(
            """MATCH (m: Member {email: $email, school: $school})
            OPTIONAL MATCH(m)-[report:reported]-(d:DailyReport {date: $date})
            RETURN report, m as member""",
            email=identifier.email, school=user.school, date=pst_date()
        ))
        logger.info(f"Retrieved {records}")
        record = records[0] if len(records) > 0 else None
        location_item = await create_location_status(record['location'])
        health_item = await create_health_status(record['member'], record['report'])
        return SingleUserDualStatus(location=location_item, health=health_item)
