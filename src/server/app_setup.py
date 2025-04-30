# server/app_setup.py

import os
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS

from home import register_app_routes

socketio = SocketIO(cors_allowed_origins="*")
db = None


def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your_secret_key'
    CORS(app, supports_credentials=True)
    # Initialize Firebase
    cred_path = os.path.join(os.path.dirname(__file__), "polling-app-882ec-firebase-adminsdk-fbsvc-5234e61f54.json")
    print(cred_path)
    cred = credentials.Certificate(cred_path)
    try:
        firebase_admin.initialize_app(cred, {
            'projectId': 'polling-app-882ec'
        })
        print("Firebase initialized successfully.")
    except Exception as e:
        print("Firebase initialization failed:", e)
    global db
    db = firestore.client()
    socketio.init_app(app)
    register_app_routes(app, db, socketio)

    return app
=======
# Initialize Firestore
cred = credentials.Certificate("/Users/melissatreziok/Documents/GitHub/polling-app/polling-app-882ec-firebase-adminsdk-fbsvc-833f309abd.json")
firebase_admin.initialize_app(cred)
db = firestore.client()
