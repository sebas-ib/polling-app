import json
import uuid
import socket_handlers
from dataclasses import asdict
from flask import request, jsonify, make_response
from app_setup import app, socketio, db
# from global_state import clients, polls
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
    # if client_id not in clients:
    #     clients[client_id] = Client(id=client_id, name=client_name)

    # Access firestore directly
    client_ref = db.collection("clients").document(client_id)
    client_ref.set({"id": client_id, "name": client_name}, merge=True)

    response = make_response(jsonify({"client_name": client_name, "Result": "Success"}), 200)
    response.set_cookie("client_name", client_name, httponly=True, samesite="Lax")
    return response

@app.route("/api/get_client", methods=["GET"])
def get_client():
    client_id = request.cookies.get("client_id", "")
    client_name = request.cookies.get("client_name", "")
    response_data = {}
    new_client = False
    if client_id:
        client_ref = db.collection("clients").document(client_id)
        client_doc = client_ref.get()

        if client_doc.exists:
            client_data = client_doc.to_dict()
            response_data["client_id"] = client_data["id"]
            response_data["client_name"] = client_data["name"]
            response_data["Result"] = "Success"
        else:
            new_client = True
    else:
        new_client = True

    if new_client:
        client_id = str(uuid.uuid4())  # Generate a new unique client ID
        client_name = "New Client"

        # Store new client in Firestore
        client_ref = db.collection("clients").document(client_id)
        client_ref.set({"id": client_id, "name": client_name})

        response_data["Result"] = "New Client"
        response_data["client_id"] = client_id
        response_data["client_name"] = client_name

    response = make_response(jsonify(response_data))

    if new_client:
        response.set_cookie("client_id", client_id, httponly=True, samesite="Lax")

    return response

@app.route("/api/get_client_name", methods=["GET"])
def get_client_name():
    client_id = request.cookies.get("client_id", "")
    if not client_id:
        return 404

    client_ref = db.collection("clients").document(client_id)
    client_doc = client_ref.get()

    if not client_doc.exists:
        return jsonify({"error": "Client not found"}), 404

    client_data = client_doc.to_dict()
    client_name = client_data.get("name", "Anonymous")

    response = make_response(jsonify({"client_name": client_name}), 200)
    return response

def assign_client():
    return str(uuid.uuid4())

@app.route("/api/polls", methods=["GET"])
def list_polls():
    polls_ref = db.collection("polls").stream()
    polls_list = [{"id": poll.id, "title": poll.to_dict()["title"]} for poll in polls_ref]
    return jsonify({"polls": polls_list})

@app.route("/api/create_poll", methods=["POST"])
def create_poll():
    # Client info comes from cookies.
    client_id = request.cookies.get("client_id")
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
    question_id = str(uuid.uuid4())

    poll_options_dict = {
        opt_id: {"id": opt_id, "text": option, "vote_count": 0}
        for opt_id, option in {
            str(uuid.uuid4()): option for option in options_list if option.strip()
        }.items()
    }

    poll_data = {
        "id": poll_id,
        "title": poll_title,
        "owner_id": client_id,
        "poll_questions": {
            question_id: {
                "id": question_id,
                "question_title": question_title,
                "poll_options": poll_options_dict
            }
        },
        "participants": {client_id: True}
    }

    db.collection("polls").document(poll_id).set(poll_data)

    socketio.emit("refreshPolls", {"id": poll_id, "title": poll_title})
    return jsonify({"id": poll_id, "title": poll_title}), 201


@app.route("/api/join_poll", methods=["POST"])
def join_poll():
    poll_id = request.form.get("poll_id")
    client_id = request.cookies.get("client_id")
    if not poll_id or not client_id:
        return "Poll and Client ID are required", 400
    poll_ref = db.collection("polls").document(poll_id).get()
    if not poll_ref.exists:
        return "Poll not found", 404

    poll_data = poll_ref.to_dict()

    db.collection("polls").document(poll_id).update({"participants." + client_id: True})

    return jsonify(poll_data), 200


@app.route("/api/vote_option", methods=["POST"])
def vote_option():
    client_id = request.cookies.get("client_id")
    client_name = request.cookies.get("client_name", "Anonymous")
    data = request.get_json()

    poll_id = data.get("poll_id")
    question_id = data.get("question_id")
    option_id = data.get("option_id")

    print("Incoming vote payload:", data)
    print("client_id:", client_id)
    print("poll_id:", poll_id, "question_id:", question_id, "option_id:", option_id)

    if not client_id:
        return jsonify({"error": "Missing client ID"}), 403

    if not poll_id or not question_id or not option_id:
        return jsonify({"error": "Invalid vote data"}), 400

    # 🔍 Get client from Firestore
    client_ref = db.collection("clients").document(client_id)
    client_doc = client_ref.get()
    if not client_doc.exists:
        return jsonify({"error": "Client not found"}), 403

    client_data = client_doc.to_dict()
    saved_votes = client_data.get("saved_votes", [])

    if question_id in saved_votes:
        return jsonify({"error": "Already voted on this question"}), 403

    poll_ref = db.collection("polls").document(poll_id)
    poll_doc = poll_ref.get()
    if not poll_doc.exists:
        return jsonify({"error": "Poll not found"}), 404

    poll_data = poll_doc.to_dict()
    question = poll_data.get("poll_questions", {}).get(question_id)
    if not question:
        return jsonify({"error": "Question not found"}), 404

    option = question.get("poll_options", {}).get(option_id)
    if not option:
        return jsonify({"error": "Option not found"}), 404

    question["poll_options"][option_id]["vote_count"] += 1
    poll_data["poll_questions"][question_id] = question
    poll_ref.update({"poll_questions": poll_data["poll_questions"]})

    saved_votes.append(question_id)
    client_ref.update({"saved_votes": saved_votes})

    socketio.emit("vote_event", {
        "option_id": option_id,
        "poll_id": poll_id,
        "question_id": question_id,
        "vote_sent_by": client_name,
        "new_vote_count": question["poll_options"][option_id]["vote_count"]
    })

    return jsonify({
        "Result": "Success",
        "voted_for": option["text"],
        "vote_count": question["poll_options"][option_id]["vote_count"]
    }), 200



if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=3001)
