import json
import uuid
from dataclasses import asdict
from flask import request, jsonify, make_response
from models import Client, Poll, PollQuestion, PollOption
from json_encoder import to_serializable


def register_app_routes(app, db, socketio):

    #register all routes

    @app.route("/api/set_name", methods=["POST"])
    def assign_client_name():
        """
        Assigns a display name to a client. If the client doesn't have an ID cookie, one is created.
        Saves the client data to Firestore and sets relevant cookies.
        """
        client_id = request.cookies.get("client_id")
        client_name = request.form.get("client_name")
        if not client_name:
            client_name = "Anonymous"

        if not client_id:
            # If the client doesn't already have an ID, assign one
            client_id = str(uuid.uuid4())

        # Store or update the client in Firestore
        client_ref = db.collection("clients").document(client_id)
        client_ref.set({"id": client_id, "name": client_name}, merge=True)

        # Set cookies for client_id and client_name
        response = make_response(jsonify({"client_name": client_name, "Result": "Success"}), 200)
        response.set_cookie("client_id", client_id, httponly=True, samesite="Lax")
        response.set_cookie("client_name", client_name, httponly=True, samesite="Lax")
        return response


    @app.route("/api/get_client", methods=["GET"])
    def get_client():
        """
        Retrieves the client information from cookies and Firestore.
        If the client is new, generates a new ID and saves them to Firestore.
        """
        client_id = request.cookies.get("client_id", "")
        client_name = request.cookies.get("client_name", "")
        response_data = {}
        new_client = False

        if client_id:
            # Get client data from Firestore
            client_ref = db.collection("clients").document(client_id)
            client_doc = client_ref.get()

            if client_doc.exists:
                # If the client exists, fetch and return info
                client_data = client_doc.to_dict()
                response_data["client_id"] = client_data["id"]
                response_data["client_name"] = client_data["name"]
                response_data["Result"] = "Success"
            else:
                # If client ID is in cookies, but not in firestore, treat it as new client
                new_client = True
        else:
            new_client = True

        # Create new client if one doesn't exist
        if new_client:
            # Create new client with unique ID
            client_id = str(uuid.uuid4())
            client_name = "New Client"

            # Save the new client to firestore
            client_ref = db.collection("clients").document(client_id)
            client_ref.set({"id": client_id, "name": client_name})

            response_data["Result"] = "New Client"
            response_data["client_id"] = client_id
            response_data["client_name"] = client_name

        # Return client info and set cookies if new
        response = make_response(jsonify(response_data))
        if new_client:
            response.set_cookie("client_id", client_id, httponly=True, samesite="Lax")
            response.set_cookie("client_name", client_name, httponly=True, samesite="Lax")

        return response


    @app.route("/api/get_client_name", methods=["GET"])
    def get_client_name():
        """
        Retrieves only the client's name from Firestore using the client_id cookie.
        """
        client_id = request.cookies.get("client_id", "")
        if not client_id:
            return 404 # No ID to look up

        client_ref = db.collection("clients").document(client_id)
        client_doc = client_ref.get()

        if not client_doc.exists:
            return jsonify({"error": "Client not found"}), 404

        # Return client name or default to Anonymous
        client_data = client_doc.to_dict()
        client_name = client_data.get("name", "Anonymous")

        response = make_response(jsonify({"client_name": client_name}), 200)
        return response


    def assign_client():
        """
        Generates a new UUID for a client ID.
        """
        return str(uuid.uuid4())


    @app.route("/api/polls", methods=["GET"])
    def list_polls():
        """
        Returns a list of active polls from Firestore.
        """
        polls_ref = db.collection("polls").stream()
        polls_list = [{"id": poll.id, "title": poll.to_dict()["title"]} for poll in polls_ref]
        return jsonify({"polls": polls_list})

    @app.route("/api/create_poll", methods=["POST"])
    def create_poll():
        """
        Creates a new poll with a single question and multiple options.
        Stores the poll in Firestore and emits a socket event to refresh poll listings.
        """
        client_id = request.cookies.get("client_id")

        # Get data from poll
        poll_title = request.form.get("poll_title")
        question_title = request.form.get("question_title")
        options_json = request.form.get("options")

        if not poll_title or not question_title or options_json is None:
            return "Invalid poll creation: missing required fields", 400

        # Parse through the options JSON
        try:
            options_data = json.loads(options_json)
            options_list = options_data.get("options", [])
        except Exception as e:
            return make_response(jsonify({"error": "Invalid options JSON", "message": str(e)}), 400)

        poll_id = str(uuid.uuid4())
        question_id = str(uuid.uuid4())

        # Construct poll options with IDs and vote counts
        poll_options_dict = {
            opt_id: {"id": opt_id, "text": option, "vote_count": 0}
            for opt_id, option in {
                str(uuid.uuid4()): option for option in options_list if option.strip()
            }.items()
        }

        # Construct poll object to save to Firestore
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

        # Notify clients via socket
        socketio.emit("refreshPolls", {"id": poll_id, "title": poll_title})
        return jsonify({"id": poll_id, "title": poll_title}), 201


    @app.route("/api/join_poll", methods=["POST"])
    def join_poll():
        """
        Adds the client to the list of poll participants and returns poll data.
        """
        poll_id = request.form.get("poll_id")
        client_id = request.cookies.get("client_id")

        if not poll_id or not client_id:
            return "Poll and Client ID are required", 400

        poll_ref = db.collection("polls").document(poll_id).get()
        if not poll_ref.exists:
            return "Poll not found", 404

        poll_data = poll_ref.to_dict()

        # Add client to participants
        db.collection("polls").document(poll_id).update({"participants." + client_id: True})

        return jsonify(poll_data), 200

    # -------------------------------
    # VOTING ROUTE
    # -------------------------------

    @app.route("/api/vote_option", methods=["POST"])
    def vote_option():
        """
        Handles voting for a given option in a poll question.
        Prevents duplicate votes by tracking votes per question in client data.
        Emits a socket event with updated vote count.
        """
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

        # Fetch client info from Firestore
        client_ref = db.collection("clients").document(client_id)
        client_doc = client_ref.get()
        if not client_doc.exists:
            return jsonify({"error": "Client not found"}), 403

        client_data = client_doc.to_dict()
        saved_votes = client_data.get("saved_votes", [])

        # Prevent double voting on the same question
        if question_id in saved_votes:
            return jsonify({"error": "Already voted on this question"}), 403

        # Get poll and question data
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

        # Record the vote
        question["poll_options"][option_id]["vote_count"] += 1
        poll_data["poll_questions"][question_id] = question
        poll_ref.update({"poll_questions": poll_data["poll_questions"]})

        # Track the vote in the client record
        saved_votes.append(question_id)
        client_ref.update({"saved_votes": saved_votes})

        # Emit real-time vote update
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

