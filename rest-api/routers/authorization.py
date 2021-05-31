"""
Authorization Utilities
"""
from shared.models.user_entities import User
from shared.service.jwt_auth_wrapper import JWTAuthManager

manager = JWTAuthManager(oidc_vault_secret="oidc/rest",
                         object_creator=lambda claims, assumed_role, user_roles: User(
                             first_name=claims["given_name"],
                             last_name=claims["family_name"],
                             school=assumed_role,
                             email=claims['email']
                         ))

AUTH_USER = manager.auth_header()
