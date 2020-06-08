from flask import Flask, request, make_response, jsonify
import firebase_admin
from firebase_admin import auth as firebase_auth, credentials as firebase_credentials

# Initialize Firebase Authorization
CREDENTIALS = firebase_credentials.Certificate("path/to/serviceAccountKey.json")
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
def index():
    """
    Verify Firebase JWT and handle the query appropriately
    :return: JSON Confirmation Response
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return make_response(jsonify(code=400, message='Authorization header must be specified'), 400)
    if 'Bearer' in auth_header:
        if not firebase_auth.verify_id_token(auth_header.split('Bearer ')[1]):
            return make_response(jsonify(code=403, message='Invalid JWT Token... Access denied'), 403)
    else:
        return make_response(jsonify(code=400, message="Authorization must be prefixed with 'Bearer'"))
