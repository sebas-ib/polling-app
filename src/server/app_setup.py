from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
from pymongo import MongoClient
from home import register_app_routes

# Create a socketio instance
socketio = SocketIO(cors_allowed_origins="*")

# Initialize variables for the mongodb client and database
mongo_client = None
db = None

def create_app():
    # Create a new flask app instance
    app = Flask(__name__)

    # Secret key
    app.config['SECRET_KEY'] = 'your_secret_key'

    # Enable CORS so frontend apps can make requests to the backend
    CORS(app, supports_credentials=True)

    # Connect to MongoDB running on docker service named mongo, timeout in case db is unresponsive
    global mongo_client, db
    mongo_client = MongoClient("mongodb://mongo:27017/", serverSelectionTimeoutMS=5000)
    db = mongo_client["polling_app_db"] # Create or use existing database named polling_app_db

    socketio.init_app(app)

    # Pass in the app, database, and socket instance to the route registration function
    register_app_routes(app, db, socketio)

    # return the configured app
    return app
