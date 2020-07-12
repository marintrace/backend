from contextlib import contextmanager
from datetime import datetime
from os import environ as env_vars

from pytz import timezone, utc
from py2neo import Graph


def get_pst_time():
    """
    Get the current localized datetime for pacific time
    :return: localized datetime
    """
    return datetime.now(tz=utc).astimezone(timezone("US/Pacific"))


def pst_timestamp():
    """
    Get the current PST timestamp
    :return: float unix timestamp (seconds since 1970)
    """
    return get_pst_time().timestamp()
