#!/usr/bin/env python
"""
Flask App and Router for Processing asynchronous information
from iOS App
"""
from dataclasses import dataclass
from typing import Callable

from flask import Flask, request, make_response, jsonify
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials as firebase_credentials

from shared.neo4j import Member, Neo4JConfig
from shared.utils import Schools

# Initialize Firebase Authorization
CREDENTIALS = firebase_credentials.Certificate("credentials/firebase_creds.json")
firebase_admin.initialize_app(CREDENTIALS)

# Initialize Flask
APP = Flask(__name__)


@dataclass
class Operation:
    """
    Namedtuple type object for API Operations
    """
    name: str
    callback: Callable = lambda x: x  # identity function by default


class Callbacks:
    """
    Callbacks for API Routes
    """

    @staticmethod
    def list_users(flask_request):
        """
        List the Users in the Neo4J
        :param flask_request: Flask request object
        :return: list of member emails objects
        """
        school = flask_request.headers['X-School']
        if not Schools.is_valid(school):
            raise Exception(f"Invalid School {school}")

        with Neo4JConfig.acquire_graph() as g:
            result_set = Member.select(g).where(school=school).all()

        return [member.email for member in result_set]

    @staticmethod
    def report_interaction(flask_request):
        pass


@APP.route('/health', methods=['GET'])
def health_check():
    """
    Make sure that the server is alive
    :return: OK
    """
    return 'OK'


@APP.route('/api', methods=['POST'])
def index():
    """
    Verify Firebase JWT and handle the query appropriately
    :return: JSON Confirmation Response
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return make_response(jsonify(code=400, message='Authorization header must be specified'), 400)
    if 'Bearer' not in auth_header:
        return make_response(jsonify(code=400, message="Authorization must be prefixed with 'Bearer'"))
    if not firebase_auth.verify_id_token(auth_header.split('Bearer ')[1]):
        return make_response(jsonify(code=403, message='Invalid JWT Token... Access denied'), 403)
