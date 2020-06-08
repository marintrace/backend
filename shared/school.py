"""
School Enum and Information for use in Celery and Web API
"""
from os import environ as env_vars


class Schools:
    """
    Supported Schools Enum
    """
    BRANSON = 'branson'
    MA = 'ma'

    @staticmethod
    def is_valid(school):
        """
        Check whether a school is or is not valid
        :param school: school to check
        :return: boolean indicating validity
        """
        return school in [
            Schools.BRANSON, Schools.MA
        ]


class Administrators:
    """
    List of School Administrator's emails to Notify of Risk
    """
    try:
        BRANSON_ADMINISTRATORS = [
            f"{email}@branson.org" for email in env_vars['BRANSON_ADMINISTRATORS'].split(',')
        ]

        MA_ADMINISTRATORS = [
            f"{email}@ma.org" for email in env_vars["MA_ADMINISTRATORS"].split(",")
        ]
    except KeyError as e:
        raise Exception(f"Set environment variable: '{e}'")

    @staticmethod
    def get(school):
        """
        Get Administrators for school enum
        :param school: school name
        :return: list of administrator emails
        """
        return {
            Schools.BRANSON: Administrators.BRANSON_ADMINISTRATORS,
            Schools.MA: Administrators.MA_ADMINISTRATORS
        }[school]
