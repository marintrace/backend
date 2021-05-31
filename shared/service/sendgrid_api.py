"""
Email Service for sending emails via SendGrid
"""
from os import environ as env_vars
from typing import Dict, List, Optional

import requests

from shared.logger import logger
from shared.service.vault_api import VaultConnection


class SendgridAPI:
    """
    Email Client for sending emails
    """
    _TEMPLATES = {}  # cache across invocations so we don't need to keep going to vault
    _SENDGRID_ENDPOINT = env_vars.get('SENDGRID_ADDRESS', 'https://api.sendgrid.com/v3/mail/send')
    _SENDGRID_CONFIG: Dict[str, str] = None

    @staticmethod
    def retrieve_template_id(template_name: str):
        """
        Retrieve template mapping
        :param template_name: the name of the template to retrieve from
        :return: the template id
        """
        if not SendgridAPI._TEMPLATES:
            logger.info("Templates have not been cached... retrieving from vault.")
            with VaultConnection() as vault:
                SendgridAPI._TEMPLATES = vault.read_secret(secret_path='email/templates')

        if template_name not in SendgridAPI._TEMPLATES:  # check if template has been registered in vault
            raise Exception(f"Unknown template name {template_name}")

        return SendgridAPI._TEMPLATES[template_name]

    @staticmethod
    def retrieve_sendgrid_config(field: Optional[str] = None):
        """
        Retrieve sendgrid config from Vault
        :param field: a single property to retrieve rather than a dictionary
        :return: the sendgrid configuration
        """
        if not SendgridAPI._SENDGRID_CONFIG:
            logger.info("Sendgrid configuration has not yet been cached... retrieving from vault")
            with VaultConnection() as vault:
                SendgridAPI._SENDGRID_CONFIG = vault.read_secret(secret_path='email/sendgrid')
        if field:
            return SendgridAPI._SENDGRID_CONFIG[field]
        return SendgridAPI._SENDGRID_CONFIG

    @staticmethod
    def _format_target(email: str, name: str = None):
        """
        Format an email into the appropriate email/display name combination
        :param email: email to format
        :return: formatted email
        """
        return dict(email=email, **({"name": name} if name else {}))

    @staticmethod
    def send_email(*, template_name: str, recipients: List[str], template_data, bcc: bool = True):
        """
        Send an Email from the email in vault to the recipients specified
        :param template_name: Vault-stored template name to send
        :param recipients: list of recipients to send the email to
        :param template_data: dictionary of handlebars template data
        :param bcc: whether or not to bcc the monitoring users in vault
        """
        sendgrid_config = SendgridAPI.retrieve_sendgrid_config()

        api_payload = {
            "from": SendgridAPI._format_target(email=sendgrid_config['from_email'], name="MarinTrace"),
            "personalizations": [
                {"to": [SendgridAPI._format_target(email=recipient) for recipient in recipients],
                 "dynamic_template_data": template_data}
            ],
            "template_id": SendgridAPI.retrieve_template_id(template_name=template_name)
        }

        if bcc:
            api_payload['personalizations'][0]['bcc'] = [SendgridAPI._format_target(email=bcc_email) for
                                                         bcc_email in sendgrid_config['bcc_emails']]

        logger.info("Sending API Request to SendGrid")
        response = requests.post(url=SendgridAPI._SENDGRID_ENDPOINT,
                                 headers={'Authorization': f'Bearer {sendgrid_config["api_key"]}'},
                                 json=api_payload)

        if not response.status_code == 202:
            logger.error(f"Unable to send Email... Server responded with JSON "
                         f"{response.json()}; Code: {response.status_code}")
            raise Exception(f"Unable to send email - Server responded with {response.status_code}")
