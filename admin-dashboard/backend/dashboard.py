from fastapi import APIRouter
from py2neo import RelationshipMatcher

from shared.logger import logger
from shared.models import (AdminDashboardUser,
                           DashboardNumericalWidgetResponse,
                           DashboardUserInfoDetail, DashboardUserInteraction,
                           DashboardUserInteractions,
                           DashboardUserSummaryResponse, HealthReport,
                           OptionalPaginatedUserEmailIdentifier,
                           PaginatedUserEmailIdentifier, UserEmailIdentifier,
                           UserLocationStatus, UserRiskItem)
from shared.service.neo_config import Neo4JGraph, current_day_node
from shared.utilities import (DATE_FORMAT, get_pst_time, parse_timestamp,
                              pst_date)

from .authorization import OIDC_COOKIE

# Mounted on the main router
BACKEND_ROUTER = APIRouter()


async def create_summary_item(record, with_email=None, with_timestamp=None) -> UserRiskItem:
    """
    Create a Summary item from a graph edge between a member and DailyReport
    """
    risk_item = UserRiskItem(
        email=with_email,
        timestamp=parse_timestamp(with_timestamp).strftime(DATE_FORMAT) if with_timestamp else None
    )

    if not (record and record.get('report')):
        return risk_item.add_incomplete()

    if UserLocationStatus.blocked(record['location']):
        logger.info("Location is blocked.")
        return risk_item.add_blocked(location=record['location'])
    return risk_item.from_health_report(health_report=HealthReport(**dict(record['report'])))


@BACKEND_ROUTER.post(path="/submitted-symptom-reports", response_model=DashboardNumericalWidgetResponse,
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
        return DashboardNumericalWidgetResponse(value=submitted_reports)


@BACKEND_ROUTER.post(path="/paginate-user-reports", response_model=DashboardUserSummaryResponse,
                     summary="Paginate through user report history")
async def paginate_user_report_history(request: PaginatedUserEmailIdentifier, user: AdminDashboardUser = OIDC_COOKIE):
    """
    Paginate through a user's report history
    """
    logger.info("Paginating user report history")
    with Neo4JGraph() as graph:
        records = list(graph.run(
            """MATCH (m: Member {school: $school, email: $email})-[report:reported]-(d: DailyReport)
            RETURN report, m.location as location, report.timestamp as timestamp ORDER BY report.timestamp DESC
            SKIP $pag_token LIMIT $limit""",
            school=user.school, email=request.email, pag_token=request.pagination_token,
            limit=request.limit
        ))

        return DashboardUserSummaryResponse(
            records=[await create_summary_item(record, with_timestamp=record['timestamp'])
                     for record in records],
            pagination_token=request.pagination_token + request.limit
        )


@BACKEND_ROUTER.post(path="/paginate-user-summary-items", response_model=DashboardUserSummaryResponse,
                     summary="Paginate through admin-dashboard status records")
async def paginate_user_summary_items(request: OptionalPaginatedUserEmailIdentifier,
                                      user: AdminDashboardUser = OIDC_COOKIE):
    """
    Paginate through the user summary items to render the home screen admin-dashboard
    """
    with Neo4JGraph() as graph:
        records = list(graph.run(
            f"""MATCH (m: Member {{school: $school}})
            {"WHERE m.email STARTS WITH '" + request.email + "'" if request.email else ''}  
            OPTIONAL MATCH(m)-[report:reported]-(d:DailyReport {{date: $date}})
            RETURN m.email as email, m.location as location, report, report.timestamp as timestamp 
            ORDER BY COALESCE(report.risk_score, 0) DESC
            SKIP $pag_token LIMIT $limit""",
            school=user.school, date=get_pst_time().strftime(DATE_FORMAT), pag_token=request.pagination_token,
            limit=request.limit
        ))

    return DashboardUserSummaryResponse(
        records=[await create_summary_item(record, with_email=record['email'], with_timestamp=record['timestamp'])
                 for record in records],
        pagination_token=request.pagination_token + request.limit
    )


@BACKEND_ROUTER.post(path="/get-user-info", response_model=DashboardUserInfoDetail,
                     summary="Get a user's detail from the database")
async def get_user_info(identifier: UserEmailIdentifier, user: AdminDashboardUser = OIDC_COOKIE):
    """
    Get the user info from the database for the specified user
    """
    logger.info("Retrieving user info")
    with Neo4JGraph() as graph:
        # Scope User Retrieval to the Admin Dashboard's Logged In School
        member_node = graph.nodes.match("Member", email=identifier.email, school=user.school).first()
        return DashboardUserInfoDetail(
            first_name=member_node['first_name'],
            last_name=member_node['last_name'],
            cohort=member_node['cohort'],
            email=member_node['email'],
            school=member_node['school'],
            active=member_node.get('status') == 'active',
            location=member_node['location']
        )


@BACKEND_ROUTER.post(path="/paginate-user-interactions", response_model=DashboardUserInteractions,
                     summary="Retrieve a user's interactions")
async def paginate_user_interactions(request: PaginatedUserEmailIdentifier, user: AdminDashboardUser = OIDC_COOKIE):
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

        return DashboardUserInteractions(
            users=[
                DashboardUserInteraction(
                    email=record['email'],
                    timestamp=parse_timestamp(record['timestamp']).strftime("%Y-%m-%d")  # UNIX ts -> YYYY-MM-DD
                ) for record in records],
            pagination_token=request.pagination_token + request.limit
        )


@BACKEND_ROUTER.post(path="/get-user-summary-status", response_model=UserRiskItem,
                     summary="Retrieve a user's summary status and color")
async def get_user_summary_status(identifier: UserEmailIdentifier, user: AdminDashboardUser = OIDC_COOKIE):
    """
    Get the user's summary status
    """
    logger.info("Acquiring User Summary Status")

    with Neo4JGraph() as graph:
        records = list(graph.run(
            """MATCH (m: Member {email: $email, school: $school})-[r:reported]-(d: DailyReport {date: $date})
            RETURN r as report, m.location as location""",
            email=identifier.email, school=user.school, date=pst_date()
        ))
        return await create_summary_item(record=records[0] if len(records) > 0 else None)
