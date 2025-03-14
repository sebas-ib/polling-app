import json
import uuid
import socket_handlers

from dataclasses import asdict

from flask import request, jsonify, make_response
from app_setup import app, socketio
from global_state import clients, polls
from models import Client, Poll, PollQuestion, PollOption


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
        clients[client_id] = Client(client_id, client_name)

    # Create a response with the client ID in JSON
    response = make_response(jsonify({"client_name": client_name, "Result": "Success"}), 200)
    response.set_cookie("client_name", client_name, httponly=True, samesite="Lax")

    return response

@app.route("/api/get_client", methods=["GET"])
def get_client():
    # Retrieve client_id and client_name from the cookies.

    client_id = request.cookies.get("client_id", "")
    client_name = request.cookies.get("client_name", "")
    response_data = {}
    newClient = False
    if client_id:
        response_data["client_id"] = client_id
        response_data["client_name"] = client_name
        response_data["Result"] = "Success"

    if not client_id:
        client_id = assign_client()
        newClient = True
        response_data["Result"] = "New Client"
        response_data["client_id"] = client_id

    response = make_response(jsonify(response_data))
    if newClient:
        response.set_cookie("client_id", client_id, httponly=True, samesite="Lax")
        clients[client_id] = Client(id=client_id, name="New Client")

    if client_id not in clients:
        clients[client_id] = Client(id=client_id, name="New Client")
    return response


@app.route("/api/get_client_name", methods=["GET"])
def get_client_name():
    client_id = request.cookies.get("client_id", "")
    if not client_id:
        return 404

    client_name = clients[client_id].name

    response = make_response(jsonify("client_name", client_name))



def assign_client():
    client_id = str(uuid.uuid4())
    return client_id

@app.route("/api/polls", methods=["GET"])
def list_polls():
    # Build a list of poll dictionaries containing only 'id' and 'name'
    polls_list = [{"id": poll.id, "title": poll.title} for poll in polls.values()]
    return jsonify({"polls": polls_list})


@app.route("/api/create_poll", methods=["POST"])
def create_poll():
    # client data is stored in cookies not in form
    client_id = request.cookies.get("client_id")
    client_name = request.cookies.get("client_name")

    # form data
    poll_title = request.form.get("poll_title")
    question_title = request.form.get("question_title")
    options_json = request.form.get("options")

    # server side validation
    if not poll_title or not question_title or options_json is None:
        return "Invalid poll creation: missing required fields", 400

    # convert options json to a list
    try:
        options_data = json.loads(options_json)
        options_list = options_data.get("options", [])
    except Exception as e:
        return make_response(
            jsonify({"error": "Invalid options JSON", "message": str(e)}), 400
        )

    # generate a unique poll id
    poll_id = str(uuid.uuid4())

    # Convert each option text into a PollOption object.
    # This comprehension filters out empty option strings.
    poll_options_set = {
        PollOption(id=str(uuid.uuid4()), text=option)
        for option in options_list if option.strip()
    }

    # Create a PollQuestion using the provided question_title and poll options.
    poll_question = PollQuestion(
        id=str(uuid.uuid4()),
        question_title=question_title,
        poll_options=poll_options_set
    )
    owner = clients[client_id]
    # Create a new Poll with the provided title and owner from client_id.
    new_poll = Poll(
        id=poll_id,
        title=poll_title,
        owner=owner,
        poll_questions={poll_question},
        participants={owner}  # the owner is automatically added as a participant.
    )

    # Store the new poll in the global poll dictionary.
    polls[poll_id] = new_poll

    # Optionally: emit a socket event to refresh polls.
    socketio.emit("refreshPolls", {"id": poll_id, "title": poll_title})

    return jsonify({"id": poll_id, "title": poll_title}), 201


@app.route("/api/join_poll", methods=["POST"])
def join_poll():
    # Retrieve form data (assuming form-data is sent, not JSON)
    poll_id = request.form.get("poll_id")
    client_id = request.cookies.get("client_id")
    # Validate required fields
    if not poll_id or not client_id:
        return "Poll and Client ID are required", 400

    return jsonify(asdict(polls[poll_id])), 200


# Ensure that Socket.IO event handlers are loaded

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=3001)
