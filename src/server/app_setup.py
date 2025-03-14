from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'  # Use a secure key in production
CORS(app, supports_credentials=True)

socketio = SocketIO(app, cors_allowed_origins="*")
