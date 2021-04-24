import uuid

import requests

from shared.logger import logger
from shared.service.auth0_config import Auth0ManagementClient
from shared.service.email_config import EmailClient

EMAIL_CLIENT = EmailClient()


def create_user_in_auth0(email: str, first_name: str, last_name: str):
    """
    Create the user in Auth0
    :param email: the email to add to Auth0
    :param first_name: the first name to add to Auth0
    :param last_name: the last name to add to auth0
    """
    logger.info("Sending User Creation Request to Auth0")
    request = requests.post(
        url=Auth0ManagementClient.get_url('/users'), json={
            'given_name': first_name,
            'family_name': last_name,
            'email': email,
            'name': f'{first_name} {last_name}',
            'connection': 'MT-Email-Pass',
            'password': uuid.uuid4().hex + uuid.uuid4().hex.upper(),
            'email_verified': False
        }, headers=Auth0ManagementClient.get_jwt_header()
    )
    response = request.json()
    logger.info(f"Received Response from Auth0: {response}")
    request.raise_for_status()  # raise if there is an exception creating the user
    return response['user_id']


def add_role_in_auth0(user_id: str, school: str):
    """
    Add the role to the created user  in Auth0
    :param user_id: the user's assigned ID in Auth0
    :param school: the school to add to the user
    """
    request = requests.post(
        url=Auth0ManagementClient.get_url('/roles/' + user_id + '/users'), json={
            "roles": [Auth0ManagementClient.get_role_id(school)]
        }, headers=Auth0ManagementClient.get_jwt_header()
    )
    request.raise_for_status()
    logger.info(f"Received Response from Auth0: {request.json()})")


def send_user_password_invite(user_id: str, email: str, first_name: str):
    """
    Send a password reset email to the user in Auth0, so that they can
    set their password
    :param user_id: the user's id that was created
    :param email: the email to send the invite to
    :param first_name: the first name of user to invite
    """
    request = requests.post(
        url=Auth0ManagementClient.get_url('/tickets/password-change'), json={
            'result_url': 'https://marintracingapp.org',
            'user_id': user_id,
            'connection_id': 'MT-Email-Pass',
            'ttl_sec': 3600,
            'mark_email_as_verified': True
        }
    )
    request.raise_for_status()
    EMAIL_CLIENT.send_email(
        template_name='user_invite',
        template_data={
            'ticket_url': request.json()['ticket'],
            'name': first_name
        },
        recipients=[email]
    )
