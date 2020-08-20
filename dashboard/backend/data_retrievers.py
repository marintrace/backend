from shared.logger import logger
from shared.service.jwt_auth_config import JWTAuthManager
from shared.service.neo_config import acquire_db_graph, current_day_node
from shared.models import DashboardNumericalWidgetResponse, DashboardUserSummaryResponse, DashboardUserInfoDetail, \
    DashboardUserSummaryItem, AdminDashboardUser, Paginated, TestType, UserEmailIdentifier, \
    PaginatedUserEmailIdentifer, DashboardUserInteractions
from shared.utilities import get_pst_time
from fastapi import APIRouter

# Mounted on the main router
BACKEND_ROUTER = APIRouter()

# JWT Authentication Manager

AUTH_MANAGER = JWTAuthManager(oidc_vault_secret="oidc/dashboard",
                              object_creator=lambda claims, role:
                              AdminDashboardUser(last_name=claims['family_name'], first_name=claims['given_name'],
                                                 email=claims['email'], school=role.split('-')[0]))

OIDC_COOKIE = AUTH_MANAGER.auth_cookie('kc-access')


async def create_summary_item(record) -> DashboardUserSummaryItem:
    """
    Create a Summary item from a graph edge between two interactions
    """
    summary_item_parameters = dict(email=record['email'])
    edge_properties = dict(record['report']) if record and record['report'] else None

    if not (record and record['report']):
        summary_item_parameters.update(dict(color='danger', message='No report', code='INCOMPLETE'))
    elif edge_properties.pop('test_type', default=None) == TestType.POSITIVE.value:
        summary_item_parameters.update(dict(color='danger', message='Positive Test', code='POSITIVE'))
    elif any(edge_properties.values()):  # check for positive symptoms
        summary_item_parameters.update(dict(color='danger', message='Symptomatic', code='SYMPTOM'))
    else:
        summary_item_parameters.update(dict(color='success', message='Healthy', code='HEALTHY'))

    return DashboardUserSummaryItem(**summary_item_parameters)


@BACKEND_ROUTER.get(path="/submitted-symptom-reports", response_model=DashboardNumericalWidgetResponse,
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
    with acquire_db_graph() as graph:
        query = f"""
        MATCH (m:Member {{email: "{request.email}", school: "{user.school}"}})
        OPTIONAL MATCH (m)-[r: interacted_with]-(m1:Member)
        return m1.email as email
        SKIP {request.pagination_token} LIMIT {request.limit}"""

        return DashboardUserInteractions(
            users=[record['email'] for record in list(graph.run(query))],
            pagination_token=request.pagination_token + request.limit)


@BACKEND_ROUTER.post(path="/get-user-summary-status", response_model=DashboardUserSummaryItem,
                     summary="Retrieve a user's summary status and color")
async def get_user_summary_status(identifier: UserEmailIdentifier, user: AdminDashboardUser = OIDC_COOKIE):
    """
    Get the user's summary status
    """
    with acquire_db_graph():
        query = f"""
        MATCH (m:Member {{email:"{identifier.email}",school:"{user.school}}}-
                [report:REPORTED]-(d:SchoolDay {{date:"{get_pst_time().strftime("%Y-%m-%d")}"}})
        RETURN report
        """
        return await create_summary_item(record=list(query) or None)
