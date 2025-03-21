import firebase_admin
import os
import base64
import json
from firebase_admin import credentials, firestore
from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'  # Use a secure key in production
CORS(app, supports_credentials=True)

socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize Firestore
firebase_key_b64 = os.getenv("FIREBASE_ADMIN_KEY_BASE64")

if not firebase_key_b64:
    raise RuntimeError("Missing FIREBASE_ADMIN_KEY_BASE64 environment variable")

firebase_key_json = base64.b64decode(firebase_key_b64).decode("utf-8")
cred_dict = json.loads(firebase_key_json)
cred = credentials.Certificate(cred_dict)

firebase_admin.initialize_app(cred)
db = firestore.client()
