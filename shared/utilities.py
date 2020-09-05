from datetime import datetime

from pytz import timezone, utc

DATE_FORMAT = "%Y-%m-%d"
TIMEZONE = timezone("US/Pacific")

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


def pst_date():
    """
    Return the current PST Date
    """
    return get_pst_time().strftime(DATE_FORMAT)
