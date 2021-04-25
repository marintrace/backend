#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Custom Logging Configuration so we can control FastAPI Logging and use
Loguru for increased performance and flexibility
"""
import logging
from json import load as read_json_file
from os import environ as env_vars
from sys import stdout
from typing import Dict

from loguru import logger as loguru_logger

from celery.utils.log import get_task_logger


class InterceptHandler(logging.Handler):
    """
    Intercept FastAPI logging calls (with standard logging) into our Loguru Sink
    See: https://github.com/Delgan/loguru#entirely-compatible-with-standard-logging
    """

    def emit(self, record):
        """
        Intercept a record into the loguru sink
        :param record: record to intercept
        """
        level = loguru_logger.level(record.levelname).name
        frame, depth = logging.currentframe(), 2
        while frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1

        log = loguru_logger.bind(request_id="app")
        log.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


class Logger:
    """
    Custom Logger that intercepts existing logging calls to simplify configuration options
    """

    STANDARD_INTERCEPTION_TARGETS = {
        "uvicorn.error", "fastapi", "neo4j.http", "httpstream", "celery.task"
    }

    SUPPRESS_INTERCEPTION_TARGETS = {
        "uvicorn", "uvicorn.access", "boto3", "botocore", "gunicorn", "gunicorn.access"
    }

    ALL_TARGETS = STANDARD_INTERCEPTION_TARGETS.union(SUPPRESS_INTERCEPTION_TARGETS)

    def __init__(
            self,
            config_file: str = "shared/logger/config.json",
            debug=env_vars.get("DEV", False),
    ):
        """
        :param config_file: relative path to logging configuration
        :param debug: whether in testing mode (default=False)
        """
        self.debug = bool(debug)

        with open(config_file) as config_file:
            self.config: Dict = read_json_file(config_file)[
                "development" if debug else "production"
            ]

    def create_logger(self):
        """
        Create Loguru Logger for FastAPI
        :return: logger object
        """
        loguru_logger.remove()
        if self.config.get("console"):
            loguru_logger.add(stdout, **self.config["console"])

        if self.config.get("logfile"):
            loguru_logger.add(
                self.config["logfile"].pop("path"), **self.config["logfile"]
            )

        logging.basicConfig(handlers=[InterceptHandler()], level=logging.DEBUG)

        for module in Logger.ALL_TARGETS:
            module_logger = logging.getLogger(module)
            if module in Logger.SUPPRESS_INTERCEPTION_TARGETS:
                module_logger.setLevel(logging.WARNING)  # Suppress Verbose Output
            module_logger.propagate = False
            module_logger.handlers = [InterceptHandler()]

        return loguru_logger.bind(request_id=None, method=None)


logger = Logger().create_logger()
