from shared.logger import logger
from shared.service.jwt_auth_config import JWTAuthManager
from shared.service.neo_config import acquire_db_graph, current_day_node
from shared.models import DashboardNumericalWidgetResponse, DashboardUserSummaryResponse, DashboardUserSummaryItem, \
    AdminDashboardUser, Paginated, TestType
from shared.utilities import get_pst_time
from fastapi import APIRouter

# Mounted on the main router
BACKEND_ROUTER = APIRouter()

# JWT Authentication Manager

AUTH_MANAGER = JWTAuthManager(oidc_vault_secret="oidc/dashboard",
                              object_creator=lambda claims, role:
                              AdminDashboardUser(last_name=claims['family_name'],
                                                 email=claims['email'], school=role.split('-')[0]))

OIDC_COOKIE = AUTH_MANAGER.auth_cookie('kc-access')


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


@BACKEND_ROUTER.get(path="/paginate-user-summary-items", response_model=DashboardUserSummaryResponse,
                    summary="Paginate through dashboard status records")
async def paginate_user_summary_items(pagination: Paginated, user: AdminDashboardUser = OIDC_COOKIE):
    """
    Paginate through the user summary items to render the home screen dashboard
    """
    logger.info(f"Paginating through user summary records")
    healthy_summaries, unhealthy_summaries = [], []

    with acquire_db_graph() as graph:
        query = f"""
        MATCH(m: Member {{school: "{user.school}"}})
        OPTIONAL MATCH(m) - [report:reported]-(d:DailyReport {{date:"{get_pst_time().strftime("%Y-%m-%d")}"}})
        RETURN m.first_name AS first_name, m.last_name as last_name, report ORDER BY report.timestamp 
        SKIP {pagination.pagination_token} LIMIT {pagination.limit}"""
        for record in list(graph.run(query)):
            edge_properties = dict(record['report'])
            edge_properties.pop('timestamp', None)
            summary_item_parameters = dict(first_name=record['first_name'], last_name=record['last_name'])
            if not record['report']:
                summary_item_parameters.update(*dict(color='danger', message='No report.', healthy=False))
            elif edge_properties.pop('test_type', default=None) == TestType.POSITIVE.value:
                summary_item_parameters.update(dict(color='danger', message='Positive Test.', healthy=False))
            elif any(edge_properties.values()):  # check for positive symptoms
                summary_item_parameters.update(dict(color='danger', message='Positive Symptom.', healthy=False))
            else:
                summary_item_parameters.update(dict(color='success', message='Healthy.', healthy=True))

            if summary_item_parameters['healthy']:
                healthy_summaries.append(DashboardUserSummaryItem(**summary_item_parameters))
            else:
                unhealthy_summaries.append(DashboardUserSummaryItem(**summary_item_parameters))
    return DashboardUserSummaryResponse(records=unhealthy_summaries + healthy_summaries,
                                        pagination_token=pagination.pagination_token + pagination.limit)

