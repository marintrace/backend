import uuid
from typing import Dict, List, Optional

import requests

from shared.logger import logger
from shared.service.auth0_config import Auth0ManagementClient
from shared.service.email_config import SendgridAPI


def create_user(email: str, first_name: str, last_name: str):
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
            'password': uuid.uuid4().hex + uuid.uuid4().hex.upper(),  # generate a random PW so they have to reset it
            'email_verified': True
        }, headers=Auth0ManagementClient.get_jwt_header()
    )
    response = request.json()
    logger.info(f"Received Response from Auth0: {response}")

    if request.status_code == 409:
        return None

    request.raise_for_status()  # raise if there is an exception creating the user
    return response['user_id']


def get_user(email: str, fields: Optional[List] = None):
    """
    Get the given user's ID from Auth0
    :param email: the user ID to retrieve
    :param fields: the fields to retrieve from the user (see
    https://auth0.com/docs/users/user-search/retrieve-users-with-get-users-by-email-endpoint for a full list of fields)
    """
    logger.info(f"Requesting {fields} for user {email}")
    request = requests.get(
        url=Auth0ManagementClient.get_url('/users-by-email'),
        params={'email': email},
        headers=Auth0ManagementClient.get_jwt_header()
    )
    request.raise_for_status()
    response = request.json()

    if len(response) == 0:
        logger.warning(f"No user found for email {email}")
        return
    if len(response) > 1:
        raise Exception(f"More than one user was found for the email {email}")

    user_data = response[0]
    return {field: user_data[field] for field in fields}


def delete_user(user_id: str):
    """
    Delete the user from Auth0 with the given user id
    :param user_id: the user id to delete
    """
    logger.info(f"Deleting the user {user_id} from Auth0")
    request = requests.delete(
        url=Auth0ManagementClient.get_url('/users/' + user_id),
        headers=Auth0ManagementClient.get_jwt_header()
    )
    request.raise_for_status()


def update_user(user_id: str, content: Optional[Dict] = None):
    """
    Update a user with new fields in Auth0 with a given user id
    :param user_id: the user id to update new information with
    :param content: a dictionary of Auth0 matching fields to update content
    See: https://auth0.com/docs/api/management/v2/#!/Users/patch_users_by_id for full options
    """
    logger.info(f"Updating the user {user_id} in Auth0 with {content}")
    request = requests.patch(
        url=Auth0ManagementClient.get_url('/users/' + user_id),
        json=content,
        headers=Auth0ManagementClient.get_jwt_header()
    )
    request.raise_for_status()


def add_user_to_role(user_id: str, school: str):
    """
    Add the role to the created user  in Auth0
    :param user_id: the user's assigned ID in Auth0
    :param school: the school to add to the user
    """
    request = requests.post(
        url=Auth0ManagementClient.get_url('/roles/' + Auth0ManagementClient.get_role_id(school) + '/users'), json={
            "users": [user_id]
        }, headers=Auth0ManagementClient.get_jwt_header()
    )
    request.raise_for_status()
    logger.info(f"Received Response from Auth0: {request.json()})")


def remove_community_roles(user_id: str):
    """
    Remove all mapped community roles in vault from the specified user id
    :param user_id: the user's assigned ID in Auth0
    """
    logger.info(f"Deleting all community roles from Auth0 user {user_id}")
    request = requests.delete(Auth0ManagementClient.get_url(f'/users/{user_id}/roles'), json={
        "roles": Auth0ManagementClient.get_all_role_ids()
    }, headers=Auth0ManagementClient.get_jwt_header())
    request.raise_for_status()


def send_password_reset(email: str, first_name: Optional[str] = 'MarinTrace User'):
    """
    Send a password reset email to the user in Auth0, so that they can
    set their password
    :param email: the email to send the invite to
    :param first_name: the first name of user to invite
    """
    request = requests.post(
        url=Auth0ManagementClient.get_url('/tickets/password-change'), json={
            'result_url': 'https://marintracingapp.org',
            'email': email,
            'connection_id': Auth0ManagementClient.get_email_pass_connection_id(),
            'ttl_sec': 172800,
            'mark_email_as_verified': True
        },
        headers=Auth0ManagementClient.get_jwt_header()
    )
    request.raise_for_status()
    SendgridAPI.send_email(
        template_name='user_invite',
        template_data={'ticket_url': request.json()['ticket'], 'name': first_name},
        recipients=[email],
        bcc=False
    )


def send_campus_switch_email(email: str, school: str):
    """
    Send a notification to the affected user that their campus has been switched
    :param email: the email to notify
    :param school: the school (campus) they have been switched to
    """
    SendgridAPI.send_email(
        template_name='user_migrate',
        template_data={'campus': school},
        recipients=[email],
        bcc=False
    )
