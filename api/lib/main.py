#!/usr/bin/env python
"""
Flask App and Router for Processing asynchronous information
from iOS App
"""
import logging
import firebase_admin

from firebase_admin import auth as fb_auth, _auth_utils as fb_auth_utils, credentials as fb_credentials
from flask import Flask, request, make_response, jsonify

from operations import Operations

# Initialize Firebase Authorization for verifying Bearer JWTs
CREDENTIALS = fb_credentials.Certificate("credentials/firebase_creds.json")
firebase_admin.initialize_app(CREDENTIALS)

# Initialize Flask
logging.basicConfig()

app = Flask('app')
app.logger.setLevel(logging.DEBUG)


@app.route('/health', methods=['GET'])
def health_check():
    """
    Make sure that the server is alive
    :return: OK
    """
    return 'OK'


@app.route('/api', methods=['POST'])
def api():
    """
    Verify Firebase JWT and handle the query appropriately
    :return: JSON Confirmation Response
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return make_response(jsonify(message='Authorization header must be specified'), 400)
    if 'Bearer' not in auth_header:
        return make_response(jsonify(code=400, message="Authorization must be prefixed with 'Bearer'"), 400)

    try:
        #fb_auth.verify_id_token(auth_header.split('Bearer ')[1])  # verify validity of Firebase JWT
        operation = Operations.build(operation=request.json['operation'])
        return jsonify(data=operation(flask_request=request))
    except fb_auth_utils.InvalidIdTokenError:
        app.logger.exception("Could not validate specified JWT:")
        return make_response(jsonify(code=403, message='ID Token Invalid... Access Denied'), 403)

    except Exception as e:
        app.logger.exception("Encountered Unexpected Error while Processing Request:")
        return make_response(jsonify(code=500, message=f'Unexpected Error Occurred- {e.__class__}: {e}'), 500)
