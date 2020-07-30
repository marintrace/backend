#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
FastAPI Common Header Dependencies
"""
import re
import traceback

from fastapi import Depends, Header, HTTPException, status
from jose import jwt
from requests import post as post_request

from shared.logger import logger
from shared.models import User
from shared.service.vault_config import VaultConnection

# Portion Extraction
TOKEN_EXTRACTOR: re.Pattern = re.compile('^Bearer\s(?P<token>[A-Za-z0-9.\-_]+)$')

with VaultConnection() as vault:
    oidc_secrets = vault.read_secret(secret_path="oidc/rest")

    AUTHORIZED_OIDC_ROLES = set(oidc_secrets["authorized_roles"].split(","))
    OIDC_DOMAIN = oidc_secrets["auth0_domain"]
    AUDIENCE = oidc_secrets["audience"]
    ROLE_CLAIM_NAME = oidc_secrets["role_claim_name"]

    JWKS = post_request(f"https://{OIDC_DOMAIN}/.well-known/jwks.json").json()


async def _extract_token(authorization: str):
    """
    Extract the token from the authorization header
    :param authorization: authorization header specified
    :return: the parsed token
    """
    extracted_token = TOKEN_EXTRACTOR.match(authorization)  # TODO: Add user scopes to the token

    if not extracted_token:  # Verify token format
        logger.info("Invalid Token Header format specified")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Authorization format")
    return extracted_token.group("token")


async def _validate_oidc_role(roles):
    """
    Validate that the token was issued for a user
    with an authorized role
    :param roles: the roles claimed by the token
    :returns authorized role which matches the school name
    """
    for role in roles:
        if role in AUTHORIZED_OIDC_ROLES:  # Validate the user's roles
            return role

    logger.error("***SECURITY RISK: Unable to find authorized role***")
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                        detail='User does not have an authorized role')


async def _get_signing_header(token):
    """
    Validate RSA signing header
    :param token: The bearer token
    :return: Decoded signing header
    """
    jwt_raw_header = jwt.get_unverified_header(token)
    for key in JWKS["keys"]:
        if key["kid"] == jwt_raw_header["kid"]:
            return dict(kty=key["kty"], kid=key["kid"],
                        use=key["use"], n=key["n"],
                        e=key["e"])
    logger.error("***SECURITY RISK: Unknown signing header***")
    raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User does not have a verified signing header')


async def authorized_user(authorization: str = Header(..., alias='Authorization')):
    """
    Validate OIDC issued BearerJWT Tokens
    :param authorization: Bearer token accompanying request
    """
    extracted_token = await _extract_token(authorization)
    signed_header = await _get_signing_header(extracted_token)

    # noinspection PyBroadException
    try:
        claims = jwt.decode(token=extracted_token, key=signed_header, algorithms=['RS256'], audience=AUDIENCE,
                            issuer=f"https://{OIDC_DOMAIN}/")
        school = await _validate_oidc_role(claims[ROLE_CLAIM_NAME])
        return User(first_name=claims["given_name"], last_name=claims["family_name"], email=claims["email"],
                    school=school)

    except jwt.ExpiredSignatureError:
        logger.exception("***SECURITY RISK: Expired JWT***")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User has an expired JWT")
    except jwt.JWTClaimsError:
        logger.exception("***SECURITY RISK: Invalid claims. Check issuer and audience.***")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Unable to verify user's claims. Check issuer and audience.")
    except Exception:
        logger.exception("***SECURITY RISK: Unable to parse token***")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unable to parse token")


AUTH_USER = Depends(authorized_user)

