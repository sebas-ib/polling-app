import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'  # Use a secure key in production
CORS(app, supports_credentials=True)

socketio = SocketIO(app, cors_allowed_origins="*")

# Initialize Firestore
cred = credentials.Certificate("/Users/sebastian/Documents/project/polling-app/src/server/private-key/polling-app-882ec-firebase-adminsdk-fbsvc-3c08c94340.json")
firebase_admin.initialize_app(cred)
db = firestore.client()