"""
Authorization for Admin API
"""
from shared.models.dashboard_entities import AdminDashboardUser
from shared.service.jwt_auth_config import JWTAuthManager

# JWT Authentication Manager
AUTH_MANAGER = JWTAuthManager(oidc_vault_secret="oidc/admin-jwt",
                              object_creator=lambda claims, assumed_role, user_roles: AdminDashboardUser(
                                  last_name=claims['family_name'],
                                  first_name=claims['given_name'],
                                  email=claims['email'],
                                  roles=user_roles,
                                  school=assumed_role.split('-')[0]
                              ))

OIDC_COOKIE = AUTH_MANAGER.auth_cookie('kc-access', allow_role_switching=True)
# KeyCloak Access Token set by OIDC Proxy (Auth0 Lock)
