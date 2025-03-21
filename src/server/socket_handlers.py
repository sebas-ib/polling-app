from flask import request
from app_setup import socketio, db
from firebase_admin import firestore

@socketio.on('connect')
def handle_connect():
    """
    Handles a new WebSocket connection from the client.
    Maps the socket ID to the client ID using the 'client_id' cookie.
    Stores this mapping in Firestore under 'socket_clients'.
    """
    client_id = request.cookies.get("client_id")
    if not client_id:
        print("Client connected without client_id cookie.")
        return

    socket_id = request.sid

    # Store socket-to-client mapping in Firestore
    db.collection("socket_clients").document(socket_id).set({
        "client_id": client_id
    })

    print(f"Socket connected: {socket_id} -> {client_id}")


@socketio.on('disconnect')
def handle_disconnect():
    """
    Handles cleanup when a socket disconnects.
    Removes the socket-to-client mapping from Firestore.
    Optionally logs and could trigger poll participant cleanup if needed.
    """
    socket_id = request.sid

    # Get the document that maps socket ID to client ID
    doc_ref = db.collection("socket_clients").document(socket_id)
    doc = doc_ref.get()

    if doc.exists:
        client_id = doc.to_dict()["client_id"]
        print(f"Socket disconnected: {socket_id} (client_id: {client_id})")

        # remove client from participants in any poll
        doc_ref.delete()
    else:
        print(f"Socket disconnected: {socket_id} (no mapping found)")


@socketio.on('message')
def handle_message(data):
    """
    Handles incoming chat messages via WebSocket.
    Resolves the socket ID to a client ID, then looks up the client name.
    Emits the message either to a specific poll room or to all clients.
    """
    socket_id = request.sid
    message_text = data.get('message', '')
    poll_room = data.get('poll')

    # Lookup client_id via socket_id
    doc = db.collection("socket_clients").document(socket_id).get()
    if not doc.exists:
        print(f"Message from unknown socket: {socket_id}")
        return

    client_id = doc.to_dict()["client_id"]

    # Lookup the client name from Firestore
    client_doc = db.collection("clients").document(client_id).get()
    client_name = client_doc.to_dict()["name"] if client_doc.exists else "Anonymous"

    message_payload = {
        "client_name": client_name,
        "message": message_text
    }

    # Emit the message to a specific poll room or to everyone
    if poll_room:
        print(f"Message from {client_name} ({client_id}) in room '{poll_room}': {message_text}")
        socketio.emit("message", message_payload, room=poll_room)
    else:
        print(f"Message from {client_name} ({client_id}): {message_text}")
        socketio.emit("message", message_payload, broadcast=True)
