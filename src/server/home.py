import json
import uuid
from dataclasses import asdict
from flask import request, jsonify, make_response
from models import Client, Poll, PollQuestion, PollOption
from json_encoder import to_serializable


def register_app_routes(app, db, socketio):

    @app.route("/api/set_name", methods=["POST"])
    def assign_client_name():
        client_id = request.cookies.get("client_id")
        client_name = request.form.get("client_name") or "Anonymous"

        if not client_id:
            client_id = str(uuid.uuid4())

        client_ref = db.collection("clients").document(client_id)
        client_ref.set({
            "id": client_id,
            "name": client_name,
            "saved_votes": {}
        }, merge=True)

        response = make_response(jsonify({"client_name": client_name, "Result": "Success"}), 200)
        response.set_cookie("client_id", client_id, httponly=True, samesite="Lax")
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
                response_data.update({
                    "client_id": client_data["id"],
                    "client_name": client_data["name"],
                    "Result": "Success"
                })
            else:
                new_client = True
        else:
            new_client = True

        if new_client:
            client_id = str(uuid.uuid4())
            client_name = "New Client"
            client_ref = db.collection("clients").document(client_id)
            client_ref.set({"id": client_id, "name": client_name, "saved_votes": {}})
            response_data.update({
                "Result": "New Client",
                "client_id": client_id,
                "client_name": client_name
            })

        response = make_response(jsonify(response_data))
        if new_client:
            response.set_cookie("client_id", client_id, httponly=True, samesite="Lax")
            response.set_cookie("client_name", client_name, httponly=True, samesite="Lax")

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
        return jsonify({"client_name": client_name}), 200

    @app.route("/api/polls", methods=["GET"])
    def list_polls():
        polls_ref = db.collection("polls").stream()
        polls_list = [{"id": poll.id, "title": poll.to_dict()["title"]} for poll in polls_ref]
        return jsonify({"polls": polls_list})

    @app.route("/api/create_poll", methods=["POST"])
    def create_poll():
        client_id = request.cookies.get("client_id")
        poll_title = request.form.get("poll_title")
        questions_json = request.form.get("questions")

        if not poll_title or not questions_json:
            return "Missing title or questions", 400

        try:
            questions_data = json.loads(questions_json)
        except Exception as e:
            return jsonify({"error": "Invalid JSON", "message": str(e)}), 400

        poll_id = str(uuid.uuid4())
        poll_questions = {}

        for q in questions_data:
            q_title = q.get("question_title")
            q_options = q.get("options", [])
            if not q_title or not q_options:
                continue

            question_id = str(uuid.uuid4())
            options_dict = {}

            for opt in q_options:
                if opt.strip():
                    option_id = str(uuid.uuid4())
                    options_dict[option_id] = {
                        "id": option_id,
                        "text": opt.strip(),
                        "vote_count": 0
                    }

            poll_questions[question_id] = {
                "id": question_id,
                "question_title": q_title,
                "poll_options": options_dict
            }

        poll_data = {
            "id": poll_id,
            "title": poll_title,
            "owner_id": client_id,
            "poll_questions": poll_questions,
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
        db.collection("polls").document(poll_id).update({f"participants.{client_id}": True})

        client_ref = db.collection("clients").document(client_id)
        client_doc = client_ref.get()
        saved_votes = {}
        if client_doc.exists:
            client_data = client_doc.to_dict()
            saved_votes = client_data.get("saved_votes", {})

        return jsonify({
            "poll": poll_data,
            "saved_votes": saved_votes
        }), 200

    @app.route("/api/vote_option", methods=["POST"])
    def vote_option():
        if not request.is_json:
            return jsonify({"error": "Expected application/json"}), 400

        client_id = request.cookies.get("client_id")
        client_name = request.cookies.get("client_name", "Anonymous")
        data = request.get_json()

        if isinstance(data, list):
            if not data:
                return jsonify({"error": "Empty vote payload"}), 400
            data = data[0]

        poll_id = data.get("poll_id")
        question_id = data.get("question_id")
        option_id = data.get("option_id")

        if not client_id or not poll_id or not question_id or not option_id:
            return jsonify({"error": "Missing required fields"}), 400

        client_ref = db.collection("clients").document(client_id)
        client_doc = client_ref.get()
        if not client_doc.exists:
            return jsonify({"error": "Client not found"}), 403

        client_data = client_doc.to_dict()
        saved_votes = client_data.get("saved_votes", {})
        if not isinstance(saved_votes, dict):
            saved_votes = {}

        previous_option_id = saved_votes.get(question_id)

        poll_ref = db.collection("polls").document(poll_id)
        poll_doc = poll_ref.get()
        if not poll_doc.exists:
            return jsonify({"error": "Poll not found"}), 404

        poll_data = poll_doc.to_dict()
        question = poll_data.get("poll_questions", {}).get(question_id)
        if not question:
            return jsonify({"error": "Question not found"}), 404

        poll_options = question.get("poll_options", {})
        if option_id not in poll_options:
            return jsonify({"error": "Option not found"}), 404

        # Decrement previous option if switching
        if previous_option_id and previous_option_id != option_id:
            prev_count = poll_options.get(previous_option_id, {}).get("vote_count", 1)
            poll_ref.update({
                f"poll_questions.{question_id}.poll_options.{previous_option_id}.vote_count": max(prev_count - 1, 0)
            })

        # Increment current option
        current_count = poll_options[option_id].get("vote_count", 0) + 1
        poll_ref.update({
            f"poll_questions.{question_id}.poll_options.{option_id}.vote_count": current_count
        })

        # Update client's saved votes
        saved_votes[question_id] = option_id
        client_ref.update({"saved_votes": saved_votes})

        socketio.emit("vote_event", {
            "option_id": option_id,
            "poll_id": poll_id,
            "question_id": question_id,
            "vote_sent_by": client_name,
            "new_vote_count": current_count
        })

        return jsonify({
            "Result": "Success",
            "voted_for": poll_options[option_id]["text"],
            "vote_count": current_count
        }), 200
