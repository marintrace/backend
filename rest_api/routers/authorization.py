"""
Authorization Utilities
"""
from shared.service.jwt_auth_config import JWTAuthManager
from shared.models import User

manager = JWTAuthManager(oidc_vault_secret="oidc/rest",
                         object_creator=lambda claims, role: User(
                             first_name=claims["first_name"], last_name=claims["last_name"],
                             school=role, email=claims['email']
                         ))

AUTH_USER = await manager.auth_header()
