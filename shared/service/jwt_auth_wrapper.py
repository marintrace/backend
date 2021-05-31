"""
Service to validate and verify JSON web tokens for FastAPI
"""
import re
from typing import Any, Callable, Dict, List, Optional

from fastapi import Cookie, Depends, Header, HTTPException, status
from jose import jwt
from pydantic import BaseModel
from requests import get as get_request

from shared.logger import logger
from shared.service.vault_api import VaultConnection


class JWTAuthManager:
    """
    Generates FastAPI Depends objects for verifying JWTs
    """
    TOKEN_EXTRACTOR: re.Pattern = re.compile('^Bearer\s(?P<token>[A-Za-z0-9.\-_]+)$')

    def __init__(self, *, oidc_vault_secret,
                 object_creator: Callable[[Dict[str, str], str, List[str]], BaseModel],
                 ):
        """
        :param: oidc_vault_secret: path to OIDC Secret in Vault
        :param object_creator: a callable function to construct a PyDantic model from the JWT's
            claims and authorized   role (respectively)
        """
        with VaultConnection() as vault:
            oidc_secrets = vault.read_secret(secret_path=oidc_vault_secret)

            self.domain = oidc_secrets["auth0_domain"]
            self.issuer = oidc_secrets['issuer']
            self.authorized_roles = oidc_secrets['authorized_roles']
            self.role_claim_name = oidc_secrets["role_claim_name"]
            self.jwks = get_request(f"https://{self.domain}/.well-known/jwks.json").json()

        self.object_creator = object_creator

    @staticmethod
    def jwt_expired(token: str):
        """
        Check whether or not a given JWT is expired
        :param token: the specified token
        :return: whether it is expired or not.
        """

    def _extract_token_from_header(self, header: str):
        """
        Extract the token from the authorization header
        :param header: authorization header specified
        :return: the parsed token
        """
        extracted_token = JWTAuthManager.TOKEN_EXTRACTOR.match(header)

        if not extracted_token:  # Verify token format
            logger.info("Invalid Token Header Specified. Make sure it is prefixed with 'Bearer'")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid Authorization Header format")

        return extracted_token.group("token")

    def _get_authorized_role(self, roles: List[str], assume_role: Optional[str]):
        """
        Get the user's authorized role for this service
        """
        if assume_role and assume_role in roles:
            return assume_role

        for role in roles:
            if role in self.authorized_roles:
                return role

        logger.error("***SECURITY RISK: Unable to find authorized role***")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail='User does not have an authorized role')

    def _get_signing_header(self, token):
        """
        Validate RSA Signing Header
        :param token: the bearer token to verify
        :return: Decoded signing header
        """
        raw_jwt_header = jwt.get_unverified_header(token=token)
        try:
            for key in self.jwks["keys"]:
                if key["kid"] == raw_jwt_header["kid"]:
                    return dict(kty=key['kty'], kid=key['kid'], use=key['use'], n=key['n'], e=key['e'])
            logger.error("***SECURITY RISK: Unknown signing header***")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail='User does not have a verified signing header')
        except KeyError:
            logger.error("***SECURITY RISK: Missing Token Header Parameter***")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Token is missing a necessary header")

    def verify_jwt(self, token: str, assume_role: str = None):
        """
        Verify Authorization JWT issued by OIDC
        :param token: Bearer token accompanying request (from cookie, or from header)
        :param assume_role: a role to assume, if the user has it.
        """
        # noinspection PyBroadException
        try:
            signed_header: dict = self._get_signing_header(token=token)
            claims: Dict[str, Any] = jwt.decode(
                token=token, key=signed_header, algorithms=['RS256'],
                issuer=self.issuer, options=dict(verify_aud=False)
            )  # auth0 id token does not provide an audience
            logger.info(f"Authorizing JWT with claims: {claims}")

            if assume_role and assume_role not in self.authorized_roles:  # if the user wants to assume a role they have
                logger.error("***SECURITY RISK: User attempted to assume an unauthorized role***")
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                    detail="Cannot assume unauthorized role.")

            assumed_role = self._get_authorized_role(claims[self.role_claim_name], assume_role=assume_role)
            return self.object_creator(claims, assumed_role, claims[self.role_claim_name])

        except HTTPException as caught_exc: # has already been raised and handled
            raise caught_exc
        except jwt.ExpiredSignatureError:
            logger.exception("***SECURITY RISK: Expired JWT***")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Expired JWT")
        except jwt.JWTClaimsError:
            logger.exception("***SECURITY RISK: Unable to verify claims***")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Unable to verify token claims. Check issuer and audience.")
        except Exception:
            logger.exception("***SECURITY RISK: Unexpected Error***")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                                detail="Error verifying JWT")

    def auth_header(self, allow_role_switching: bool = False):
        """
        FastAPI Depends to verify OIDC issued Bearer Tokens specified as HTTP Header
        :param allow_role_switching: whether or not to allow an authorized user with multiple
            roles to assume one of them
        """

        if allow_role_switching:
            def header_verification(authorization: str = Header(..., alias='Authorization'),
                                    assume_role: Optional[str] = Header(None)):
                extracted_token = self._extract_token_from_header(authorization)
                return self.verify_jwt(extracted_token, assume_role=assume_role)
        else:
            def header_verification(authorization: str = Header(..., alias='Authorization'), ):
                extracted_token = self._extract_token_from_header(authorization)
                return self.verify_jwt(extracted_token)

        return Depends(header_verification)

    def auth_cookie(self, cookie_name: str, allow_role_switching: bool = False):
        """
        FastAPI Depends to verify Bearer Tokens specified as Cookies
        :param cookie_name: the cookie name to read for the JWT
        :param allow_role_switching: whether or not to allow an authorized user with multiple
            roles to assume one of them
        """

        if allow_role_switching:
            def cookie_verification(token: str = Cookie(..., alias=cookie_name),
                                    assume_role: Optional[str] = Cookie(None)):
                return self.verify_jwt(token, assume_role=assume_role)
        else:
            def cookie_verification(token: str = Cookie(..., alias=cookie_name)):
                return self.verify_jwt(token)

        return Depends(cookie_verification)
