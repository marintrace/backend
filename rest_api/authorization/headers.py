#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
FastAPI Common Header Dependencies
"""
import re
import traceback

from fastapi import Depends, Header, HTTPException, status
from firebase_admin import _auth_utils as auth_utils
from firebase_admin import auth, credentials, initialize_app

from shared.logger import logger
from shared.models import User
from shared.service.vault_config import VaultConnection

# Portion Extraction
TOKEN_EXTRACTOR: re.Pattern = re.compile('^Bearer\s(?P<token>[A-Za-z0-9.\-_]+)$')
EMAIL_EXTRACTOR: re.Pattern = re.compile('^(?P<mailbox>[A-Za-z0-9._].+)@(?P<domain>[A-Za-z_.*?].+)\.')
NAME_EXTRACTOR: re.Pattern = re.compile('^(?P<first_name>[A-Za-z].+)\s(?P<last_name>[A-Za-z ].+)')

with VaultConnection() as vault:
    # Valid School Domains
    SCHOOL_DOMAINS = vault.read_secret(secret_path='kv/schools/domains')['valid'].split(',')

    # Authentication Secrets
    auth_secrets = vault.read_secret(secret_path='kv/bearer_auth')
    JWT_ISS = auth_secrets['issuer']

    certificate_file = 'authorization/token_certificate.json'
    with open(certificate_file, 'w') as cert_file:
        cert_file.write(auth_secrets['service_account'])

    JWT_CERTIFICATE = credentials.Certificate(certificate_file)


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
    return extracted_token


async def _validate_token_issuer(iss: str):
    """
    Validate the token issuer for the JWT
    :param iss: the issuer specified
    """
    if not iss == JWT_ISS:  # Verify JWT token issuer and make sure that it is authorized
        logger.error(f"***SECURITY RISK: Invalid Token Issuer '{iss}'***")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid Token Issuer')


async def _parse_email_claim_domain(email):
    """
    Validate that the token was issued for a user
    from an authorized domain
    :param email: the email claimed by the token
    :return: the parsed email claim domain
    """
    email_domain = EMAIL_EXTRACTOR.match(email).group('domain')

    if email_domain not in SCHOOL_DOMAINS:  # Validate the email claim domain is from an authorized domain
        logger.error(f"***SECURITY RISK: Email from unauthorized domain '{email_domain}'***")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User is not from authorized domain')
    return email_domain


async def authorized_user(authorization: str = Header(..., alias='Authorization')):
    """
    Validate Firebase issued BearerJWT Tokens
    :param authorization: Bearer token accompanying request
    """
    extracted_token = await _extract_token(authorization)

    try:
        claims = auth.verify_id_token(extracted_token.group('token'))
        await _validate_token_issuer(claims['iss'])
        user_domain = await _parse_email_claim_domain(claims['email'])
        extracted_name = NAME_EXTRACTOR.match(claims['name'])
        user_model = User(first_name=extracted_name.group('first_name'), last_name=extracted_name.group('last_name'),
                          school=user_domain, email=claims['email'])
        logger.info(f"Authenticated user {claims['uid']}")
        return user_model
    except auth_utils.InvalidIdTokenError:
        logger.warning("***SECURITY RISK: Token verification failed***")  # Validate JWT Signing, Expiration etc.
        logger.warning(traceback.format_exc(limit=100))
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bearer token verification failed")


AUTH_USER = Depends(authorized_user)
initialize_app(credential=JWT_CERTIFICATE)
