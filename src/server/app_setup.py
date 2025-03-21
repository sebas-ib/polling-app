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
cred = credentials.Certificate("your-private-key-goes-here")
firebase_admin.initialize_app(cred)
db = firestore.client()