import json
import uuid
import socket_handlers
from dataclasses import asdict
from flask import request, jsonify, make_response
from app_setup import app, socketio
from global_state import clients, polls
from models import Client, Poll, PollQuestion, PollOption
from json_encoder import to_serializable

@app.route("/api/set_name", methods=["POST"])
def assign_client_name():
    # Retrieve client_name from form data and client_id from cookies.
    client_id = request.cookies.get("client_id")
    client_name = request.form.get("client_name")
    if not client_name:
        client_name = "Anonymous"

    if not client_id:
        client_id = str(uuid.uuid4())

    # If client_id is not already in the dictionary, add it.
    if client_id not in clients:
        clients[client_id] = Client(id=client_id, name=client_name)

    response = make_response(jsonify({"client_name": client_name, "Result": "Success"}), 200)
    response.set_cookie("client_name", client_name, httponly=True, samesite="Lax")
    return response

@app.route("/api/get_client", methods=["GET"])
def get_client():
    client_id = request.cookies.get("client_id", "")
    client_name = request.cookies.get("client_name", "")
    response_data = {}
    newClient = False
    if client_id:
        response_data["client_id"] = client_id
        response_data["client_name"] = client_name
        response_data["Result"] = "Success"
    if not client_id:
        client_id = assign_client()  # generate a new client id
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
    response = make_response(jsonify({"client_name": client_name}))
    return response

def assign_client():
    return str(uuid.uuid4())

@app.route("/api/polls", methods=["GET"])
def list_polls():
    # Return a list of polls with only id and title.
    polls_list = [{"id": poll.id, "title": poll.title} for poll in polls.values()]
    return jsonify({"polls": polls_list})

@app.route("/api/create_poll", methods=["POST"])
def create_poll():
    # Client info comes from cookies.
    client_id = request.cookies.get("client_id")
    client_name = request.cookies.get("client_name")
    # Form data.
    poll_title = request.form.get("poll_title")
    question_title = request.form.get("question_title")
    options_json = request.form.get("options")

    if not poll_title or not question_title or options_json is None:
        return "Invalid poll creation: missing required fields", 400

    try:
        options_data = json.loads(options_json)
        options_list = options_data.get("options", [])
    except Exception as e:
        return make_response(jsonify({"error": "Invalid options JSON", "message": str(e)}), 400)

    poll_id = str(uuid.uuid4())

    # Convert options_list to a dictionary of PollOption objects.
    poll_options_dict = {
        opt_id: PollOption(id=opt_id, text=option, vote_count=0)
        for opt_id, option in {str(uuid.uuid4()): option for option in options_list if option.strip()}.items()
    }

    # Create a PollQuestion using question_title and poll_options dictionary.
    poll_question = PollQuestion(
        id=str(uuid.uuid4()),
        question_title=question_title,
        poll_options=poll_options_dict
    )
    owner = clients[client_id]
    # Create a new Poll using dictionaries for participants and poll_questions.
    new_poll = Poll(
        id=poll_id,
        title=poll_title,
        owner=owner,
        poll_questions={poll_question.id: poll_question},
        participants={client_id: owner}
    )
    polls[poll_id] = new_poll
    # Optionally emit a socket event.
    socketio.emit("refreshPolls", {"id": poll_id, "title": poll_title})
    return jsonify({"id": poll_id, "title": poll_title}), 201

@app.route("/api/join_poll", methods=["POST"])
def join_poll():
    poll_id = request.form.get("poll_id")
    client_id = request.cookies.get("client_id")
    if not poll_id or not client_id:
        return "Poll and Client ID are required", 400
    poll = polls.get(poll_id)
    if not poll:
        return "Poll not found", 404
    serializable_poll = to_serializable(poll)
    return jsonify(serializable_poll), 200

@app.route("/api/vote_option", methods=["POST"])
def vote_option():
    client_id = request.cookies.get("client_id")

    client = clients.get(client_id)
    if not client_id or client is None:
        return "You must have a client id.", 403

    client_name = request.cookies.get("client_name")
    data = request.get_json()

    poll_id = data.get("poll_id")
    question_id = data.get("question_id")
    option_id = data.get("option_id")
    if not poll_id or not question_id or not option_id:
        return "Invalid vote data", 400

    if question_id in client.saved_votes:
        return "Already voted for this question.", 403

    poll = polls.get(poll_id)
    if not poll:
        return "Poll not found", 404
    # Use dictionary lookup for poll question and option.
    question = poll.poll_questions.get(question_id)
    if not question:
        return "Question not found", 404
    option = question.poll_options.get(option_id)
    if not option:
        return "Option not found", 404

    option.vote_count += 1
    client.saved_votes.add(question_id)

    socketio.emit("vote_event", {"option_id": option_id, "vote_sent_by": client_name})
    return jsonify({"Result": "Success", "voted_for": option.text}), 200

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=3001)
