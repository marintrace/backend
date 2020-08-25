from shared.logger import logger
from shared.service.jwt_auth_config import JWTAuthManager
from shared.service.neo_config import acquire_db_graph, current_day_node
from shared.models import DashboardNumericalWidgetResponse, DashboardUserSummaryResponse, DashboardUserInfoDetail, \
    DashboardUserSummaryItem, AdminDashboardUser, Paginated, TestType, UserEmailIdentifier, \
    PaginatedUserEmailIdentifer, DashboardUserInteractions, DashboardUserInteraction
from shared.utilities import get_pst_time
from fastapi import APIRouter
from datetime import datetime, timedelta

# Mounted on the main router
BACKEND_ROUTER = APIRouter()

# JWT Authentication Manager

AUTH_MANAGER = JWTAuthManager(oidc_vault_secret="oidc/dashboard",
                              object_creator=lambda claims, role:
                              AdminDashboardUser(last_name=claims['family_name'], first_name=claims['given_name'],
                                                 email=claims['email'], school=role.split('-')[0]))

OIDC_COOKIE = AUTH_MANAGER.auth_cookie('kc-access')  # KeyCloak Access Token set by OIDC Proxy (Auth0 Lock)


async def create_summary_item(record) -> DashboardUserSummaryItem:
    """
    Create a Summary item from a graph edge between a member and DailyReport
    """
    summary_item_parameters = dict(email=record['email']) if record.get('email') else {}

    if record.get('timestamp'):
        summary_item_parameters['timestamp'] = datetime.fromtimestamp(record['timestamp']).strftime("%Y-%m-%d")

    edge_properties = dict(record['report']) if record and record['report'] else None
    test_type = edge_properties.pop('test_type', default=None)

    if not (record and record['report']):
        summary_item_parameters.update(dict(color='danger', message='No report', code='INCOMPLETE'))
    elif test_type == TestType.POSITIVE.value:
        summary_item_parameters.update(dict(color='danger', message='Positive Test', code='POSITIVE'))
    elif any(edge_properties.values()):  # check for positive symptoms
        summary_item_parameters.update(dict(color='danger', message='Symptomatic', code='SYMPTOM'))
    elif test_type == TestType.NEGATIVE.value:
        summary_item_parameters.update(dict(color='success', message='Negative Test', code='NEGATIVE'))
    else:
        summary_item_parameters.update(dict(color='success', message='Healthy', code='HEALTHY'))

    return DashboardUserSummaryItem(**summary_item_parameters)


@BACKEND_ROUTER.post(path="/submitted-symptom-reports", response_model=DashboardNumericalWidgetResponse,
                     summary="Retrieve the number of submitted symptom reports")
async def get_submitted_symptom_reports(user: AdminDashboardUser = OIDC_COOKIE):
    """
    Get the number of submitted symptom reports for the school
    that the admin belongs to
    """
    logger.info(f"Retrieving number of submitted symptom reports for school '{user.school}'")
    with acquire_db_graph() as graph:
        current_day = current_day_node(school=user.school)
        submitted_reports = len(graph.match((current_day,), r_type="reported"))
        return DashboardNumericalWidgetResponse(value=submitted_reports)


@BACKEND_ROUTER.post(path="/paginate-user-reports", response_model=DashboardUserSummaryResponse,
                     summary="Paginate through user report history")
async def paginate_user_report_history(request: PaginatedUserEmailIdentifer, user: AdminDashboardUser = OIDC_COOKIE):
    """
    Paginate through a user's report history
    """
    logger.info("Paginating user report history")
    with acquire_db_graph() as graph:
        query = f"""
        MATCH (m: Member {{school: "{user.school}", email: "{request.email}"}})-[report:reported]-(d: DailyReport))
        RETURN report, d.date as timestamp ORDER BY d.date
        SKIP {request.pagination_token} LIMIT {request.limit}
        """

        return DashboardUserSummaryResponse(
            records=[await create_summary_item(record) for record in list(graph.run(query))],
            pagination_token=request.pagination_token + request.limit
        )


@BACKEND_ROUTER.post(path="/paginate-user-summary-items", response_model=DashboardUserSummaryResponse,
                     summary="Paginate through dashboard status records")
async def paginate_user_summary_items(pagination: Paginated, user: AdminDashboardUser = OIDC_COOKIE):
    """
    Paginate through the user summary items to render the home screen dashboard
    """
    logger.info(f"Paginating through user summary records")

    with acquire_db_graph() as graph:
        query = f"""
        MATCH (m: Member {{school: "{user.school}"}})
        OPTIONAL MATCH(m) - [report:reported]-(d:DailyReport {{date:"{get_pst_time().strftime("%Y-%m-%d")}"}})
        RETURN m.email, report ORDER BY report.timestamp 
        SKIP {pagination.pagination_token} LIMIT {pagination.limit}"""

    return DashboardUserSummaryResponse(
        records=[await create_summary_item(record) for record in list(graph.run(query))],
        pagination_token=pagination.pagination_token + pagination.limit
    )


@BACKEND_ROUTER.post(path="/get-user-info", response_model=DashboardUserInfoDetail,
                     summary="Get a user's detail from the database")
async def get_user_info(identifier: UserEmailIdentifier, user: AdminDashboardUser = OIDC_COOKIE):
    """
    Get the user info from the database for the specified user
    """
    logger.info("Retrieving user info")
    with acquire_db_graph() as graph:
        # Scope User Retrieval to the Admin Dashboard's Logged In School
        member_node = graph.nodes.match("Member", email=identifier.email, school=user.school)
        return DashboardUserInfoDetail(
            first_name=member_node.first_name,
            last_name=member_node.last_name,
            cohort=member_node.cohort,
            email=member_node.email,
            school=member_node.school
        )


@BACKEND_ROUTER.post(path="/paginate-user-interactions", response_model=DashboardUserInteractions,
                     summary="Retrieve a user's interactions")
async def paginate_user_interactions(request: PaginatedUserEmailIdentifer, user: AdminDashboardUser = OIDC_COOKIE):
    """
    Paginate through a user's interactions
    """
    timestamp_limit = round((datetime.now() - timedelta(days=14)).timestamp())

    with acquire_db_graph() as graph:
        query = f"""
        MATCH (m:Member {{email: "{request.email}", school: "{user.school}"}})
        OPTIONAL MATCH (m)-[r: interacted_with]-(m1:Member) WHERE r.timestamp>={timestamp_limit}
        return m1.email as email, m1.timestamp as timestamp
        SKIP {request.pagination_token} LIMIT {request.limit}"""

        return DashboardUserInteractions(
            users=[
                DashboardUserInteraction(
                    email=record['email'],
                    timestamp=datetime.fromtimestamp(record['timestamp']).strftime("%Y-%m-%d")  # UNIX timestamp -> str
                ) for record in list(graph.run(query))],
            pagination_token=request.pagination_token + request.limit
        )


@BACKEND_ROUTER.post(path="/get-user-summary-status", response_model=DashboardUserSummaryItem,
                     summary="Retrieve a user's summary status and color")
async def get_user_summary_status(identifier: UserEmailIdentifier, user: AdminDashboardUser = OIDC_COOKIE):
    """
    Get the user's summary status
    """
    logger.info("Acquiring User Summary Status")

    with acquire_db_graph() as graph:
        query = f"""
        MATCH (m:Member {{email:"{identifier.email}",school:"{user.school}}}-
                [report:REPORTED]-(d:SchoolDay {{date:"{get_pst_time().strftime("%Y-%m-%d")}"}})
        RETURN report
        """
        query_result = list(graph.run(query))
        return await create_summary_item(record=query_result[0] if query_result else None)
