from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
from pymongo import MongoClient

socketio = SocketIO(cors_allowed_origins="*")
mongo_client = None
db = None

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'your_secret_key'
    CORS(app, supports_credentials=True)

    global mongo_client, db
    mongo_client = MongoClient("mongodb://mongo:27017/", serverSelectionTimeoutMS=5000)
    db = mongo_client["polling_app_db"]

    socketio.init_app(app)

    from home import register_app_routes
    register_app_routes(app, db, socketio)

    return app
