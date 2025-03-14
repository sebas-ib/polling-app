from flask import request
from app_setup import socketio
from global_state import clients, polls, socket_client_map
from models import Client


@socketio.on('connect')
def handle_connect():
    client_id = request.cookies.get("client_id")
    if not client_id:
        return

    socket_id = request.sid

    socket_client_map[socket_id] = client_id

    print(f"Socket connected with valid socket id: {socket_id}, which maps to {socket_client_map[socket_id]}")
    # socketio.emit('message', {'client_name': 'System', 'message': f'Connected as {client_id}'}, room=client_id)

@socketio.on('disconnect')
def handle_disconnect():
    sid = request.sid
    # Remove the mapping safely
    socket_client_map.pop(sid, None)
    print(f"Socket disconnected: sid={sid}")


@socketio.on('message')
def handle_message(data):
    client_id = request.sid
    message_text = data.get('message', '')
    poll_name = data.get('poll')

    if client_id in clients:
        client_name = clients[client_id].name
    else:
        client_name = "Anonymous"

    if poll_name:
        print(f"Message from {client_name} ({client_id}) in room '{poll_name}': {message_text}")
        socketio.emit('message', {'client_name': client_name, 'message': message_text}, room=poll_name)
    else:
        print(f"Message from {client_name} ({client_id}): {message_text}")
        socketio.emit('message', {'client_name': client_name, 'message': message_text}, broadcast=True)


@socketio.on('disconnect')
def handle_disconnect():
    client_id = request.sid
    for poll in polls.values():
        poll.participants.discard(client_id)
    if client_id in clients:
        print(f"Socket disconnected: {clients[client_id].name} ({client_id})")
        del clients[client_id]
    else:
        print(f"Socket disconnected: {client_id}")
