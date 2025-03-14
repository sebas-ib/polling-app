import uuid
import socket_handlers

from dataclasses import asdict

from flask import request, jsonify, make_response
from app_setup import app, socketio
from global_state import clients, polls
from models import Client, Poll


@app.route("/api/set_name", methods=["POST"])
def assign_client_name():
    # Try to get an existing client id from cookies.
    client_id = request.cookies.get("client_id")
    client_name = request.form.get("client_name")
    # If no client id is found, generate a new one.
    if not client_name:
        client_name = "Anonymous"

    if not client_id:
        client_id = str(uuid.uuid4())

    # Add a new entry in the global clients dictionary if it doesn't exist.
    if client_id not in clients:
        # You can use a default name, or customize it as needed.
        clients[client_id] = Client(id=client_id, name=client_name)

    # Create a response with the client ID in JSON
    response = make_response(jsonify({"client_name": client_name, "Result": "Success"}))
    response.set_cookie("client_name", client_name, httponly=True, samesite="Lax")

    return response

@app.route("/api/get_client", methods=["GET"])
def get_client():
    # Retrieve client_id and client_name from the cookies.
    client_id = request.cookies.get("client_id", "")
    client_name = request.cookies.get("client_name", "")
    response_data = {}

    if client_id:
        response_data["client_id"] = client_id
        response_data["client_name"] = client_name
        response_data["Result"] = "Success"

    if not client_id:
        client_id = assign_client()
        response_data["Result"] = "New Client"

    response = make_response(jsonify(response_data))
    if not client_id:
        response.set_cookie("client_id", client_id, httponly=True, samesite="Lax")

    return response

@app.route("/api/get_client_name", methods=["GET"])
def get_client_name():
    client_id = request.cookies.get("client_id", "")
    if not client_id:
        return 404

    client_name = request.cookies.get("client_name", "")

    response = make_response(jsonify("client_name", client_name))



def assign_client():
    client_id = str(uuid.uuid4())
    return client_id

@app.route("/api/polls", methods=["GET"])
def list_polls():
    # Build a list of poll dictionaries containing only 'id' and 'name'
    polls_list = [{"id": poll.id, "name": poll.name} for poll in polls.values()]
    return jsonify({"polls": polls_list})


@app.route("/create", methods=["POST"])
def create_poll():
    # Get the client ID from the cookie
    client_id = request.cookies.get("client_id")

    # Get the poll name from the form data
    poll_name = request.form.get("poll_name")
    if not poll_name:
        return "Poll name required", 400

    # Generate a unique poll id
    poll_id = str(uuid.uuid4())

    # Create a new poll with the client_id as owner
    new_poll = Poll(id=poll_id, name=poll_name, owner=client_id)

    # Optionally, add the owner to the poll's clients list as well
    new_poll.clients.add(client_id)

    # Add the new poll to the global polls dictionary
    polls[poll_id] = new_poll

    # Optionally, you can emit a socket event to refresh polls on the client side:
    # socketio.emit("refresh_polls", {"id": poll_id, "name": poll_name}, broadcast=True)

    # Return only id and name to the client
    return jsonify({"id": poll_id, "name": poll_name}), 201


@app.route("/join", methods=["POST"])
def join_poll():
    # Retrieve form data (assuming form-data is sent, not JSON)
    poll_id = request.form.get("poll_id")

    # Validate required fields
    if not poll_id or not client_id:
        return "Poll and Client ID are required", 400

    # Register the client if not already present
    if client_id not in clients:
        clients[client_id] = Client(id=client_id, name=client_name)

    # Check if the poll exists
    if poll_id not in polls:
        # Option 1: Return error if the poll doesn't exist
        return jsonify({"error": f"Poll with id {poll_id} not found"}), 404

        # Option 2: Create a new poll automatically (uncomment the lines below)
        # polls[poll_id] = Poll(name=f"Poll {poll_id}", id=poll_id)

    # Add the client to the poll's set of clients
    polls[poll_id].clients.add(client_id)

    # Optionally, use Socket.IO to add the client to the corresponding poll:
    #socketio.enter_room(client_id, poll_id)

    # Return the updated poll information as JSON
    return jsonify(asdict(polls[poll_id])), 200

    # Use Socket.IO to add the client to the poll corresponding to the poll
    # socketio.enter_room(client_id, poll_name)

    # Return a JSON response for clarity
    # return jsonify({
    #     "message": f"Client {client_name} with id {client_id} joined poll {poll_name}"
    # }), 200

# Ensure that Socket.IO event handlers are loaded

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=3001)
