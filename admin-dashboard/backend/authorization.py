"""
Authorization for Admin API
"""
from shared.models.admin_entities import AdminDashboardUser
from shared.service.jwt_auth_config import JWTAuthManager

# JWT Authentication Manager
AUTH_MANAGER = JWTAuthManager(oidc_vault_secret="oidc/admin-jwt",
                              object_creator=lambda claims, role: AdminDashboardUser(
                                  last_name=claims['family_name'],
                                  first_name=claims['given_name'],
                                  email=claims['email'],
                                  school=role.split('-')[0]
                              ))

OIDC_COOKIE = AUTH_MANAGER.auth_cookie('kc-access')  # KeyCloak Access Token set by OIDC Proxy (Auth0 Lock)
