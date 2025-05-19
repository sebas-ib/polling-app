from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
from pymongo import MongoClient
from home import register_app_routes

# Create the socketio instance at the module level
socketio = SocketIO(
    cors_allowed_origins=[
        "http://localhost:3000",
        "http://54.196.101.219:3000",
        "https://polling-app-git-main-polling-app-project.vercel.app",
        "https://polling-app-cs-496-frontend.vercel.app"
    ]
)

# Initialize MongoDB global variables
mongo_client = None
db = None

socket_clients = {}

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your_secret_key'

    # Set up CORS
    CORS(app, supports_credentials=True, origins=[
        "http://localhost:3000",
        "http://54.196.101.219:3000",
        "https://polling-app-git-main-polling-app-project.vercel.app",
        "https://polling-app-cs-496-frontend.vercel.app"
    ])

    # Attach SocketIO to the app
    socketio.init_app(app)

    global mongo_client, db
    mongo_client = MongoClient("mongodb://mongo:27017/", serverSelectionTimeoutMS=5000)
    db = mongo_client["polling_app_db"]

    register_app_routes(app, db, socketio)

    return app
