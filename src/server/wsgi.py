# wsgi.py
from app_setup import create_app, socketio

app = create_app()
# -------------------------------
# ENTRY POINT
# -------------------------------
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)
