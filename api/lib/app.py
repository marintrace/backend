#!/usr/bin/env python
"""
Flask App and Router for Processing asynchronous information
from iOS App
"""
from flask import Flask, request, make_response, jsonify
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials as firebase_credentials

from operations import Operations

# Initialize Firebase Authorization for verifying Bearer JWTs
CREDENTIALS = firebase_credentials.Certificate("credentials/firebase_creds.json")
firebase_admin.initialize_app(CREDENTIALS)

# Initialize Flask
APP = Flask(__name__)


@APP.route('/health', methods=['GET'])
def health_check():
    """
    Make sure that the server is alive
    :return: OK
    """
    return 'OK'


@APP.route('/api', methods=['POST'])
def api():
    """
    Verify Firebase JWT and handle the query appropriately
    :return: JSON Confirmation Response
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return make_response(jsonify(code=400, message='Authorization header must be specified'), 400)
    if 'Bearer' not in auth_header:
        return make_response(jsonify(code=400, message="Authorization must be prefixed with 'Bearer'"), 400)
    if not firebase_auth.verify_id_token(auth_header.split('Bearer ')[1]):
        return make_response(jsonify(code=403, message='Invalid JWT Token... Access denied'), 403)

    try:
        return jsonify(
            code=200,
            data=Operations.build(operation=request.json['operation'])(logger=APP.logger, flask_request=request)
        )
    except Exception as e:
        APP.logger.exception("Encountered Unexpected Error while Processing Request:")
        return make_response(jsonify(code=500, message=f'Unexpected Error Occured: {e}'), 500)
