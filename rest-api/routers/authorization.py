"""
Authorization Utilities
"""
from shared.models import User
from shared.service.jwt_auth_config import JWTAuthManager

manager = JWTAuthManager(oidc_vault_secret="oidc/rest",
                         object_creator=lambda claims, role: User(
                             first_name=claims["given_name"], last_name=claims["family_name"],
                             school=role, email=claims['email']
                         ))

AUTH_USER = manager.auth_header()
