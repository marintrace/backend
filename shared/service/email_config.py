"""
Email Service for sending emails via SendGrid
"""
import requests

from shared.logger import logger
from shared.service.vault_config import VaultConnection


class EmailClient:
    """
    Email Client for sending emails
    """

    def __init__(self):
        """
        Initialize Member Variables
        """
        self.templates = {}
        self.sendgrid_endpoint = 'https://api.sendgrid.com/v3/mail/send'
        self.api_key = None
        self.from_email = None
        self.bcc_emails = None
        self.auth_header = None
        self.has_setup = False

    def setup(self):
        """
        Set up the email client with templates and
        authorization information from vault
        """
        if not self.has_setup:
            logger.info("Receiving Email Client Info from Vault...")
            with VaultConnection() as vault:
                email_auth = vault.read_secret(secret_path='email/sendgrid')
                email_templates = vault.read_secret(secret_path='email/templates')

            for template_name in email_templates:
                self.templates[template_name] = email_templates[template_name]

            self.api_key = email_auth['api_key']
            self.from_email = email_auth['from_email']
            self.bcc_emails = email_auth['bcc_emails'].split(',')
            self.has_setup = True

    @staticmethod
    def _format_target(email, name=None):
        """
        Format an email into the appropriate sendgrid target
        :param email: email to format
        :return: formatted email
        """
        return dict(email=email, **({"name": name} if name else {}))

    def send_email(self, *, template_name, recipients, template_data):
        """
        Send an Email from the email in vault to the recipients specified
        :param template_name: Vault-stored template name to send
        :param recipients: list of recipients to send the email to
        :param template_data: dictionary of handlebars template data
        """
        if not self.has_setup:
            logger.error("Email Client was not setup via .setup()")
            raise Exception("Email Client has not been set up")

        if template_name not in self.templates:
            logger.error(f"Unknown Template specified {template_name}")
            raise ValueError(f"Email template {template_name} is not known")

        api_payload = {
            "from": EmailClient._format_target(email=self.from_email, name="Marin Tracing App"),
            "personalizations": [
                {"to": [EmailClient._format_target(email=recipient) for recipient in recipients],
                 "bcc": [EmailClient._format_target(email=bcc_email) for bcc_email in self.bcc_emails],
                 "dynamic_template_data": template_data}
            ],
            "template_id": self.templates[template_name]
        }

        logger.info("Sending API Request to SendGrid")
        response = requests.post(url=self.sendgrid_endpoint,
                                 headers={'Authorization': f'Bearer {self.api_key}'},
                                 json=api_payload)

        if not response.status_code == 202:
            logger.error(f"Unable to send Email... Server responded with JSON "
                         f"{response.json()}; Code: {response.status_code}")
            raise Exception(f"Unable to send email - Server responded with {response.status_code}")
