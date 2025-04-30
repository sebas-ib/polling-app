import json
import uuid
import random
import string
from flask import request, jsonify, make_response
from bson.objectid import ObjectId
from flask_socketio import join_room



# Function to generate 6-digit hex code for each poll
def generate_hex_code(length=6):
    return ''.join(random.choices('0123456789ABCDEF', k=length))


# Register all app rounts and socket events
def register_app_routes(app, db, socketio):

    #Rount to assign a clients name
    @app.route("/api/set_name", methods=["POST"])
    def assign_client_name():
        client_id = request.cookies.get("client_id")
        client_name = request.form.get("client_name") or "Anonymous"

        # If no client_id yet, then create a new one
        if not client_id:
            client_id = str(uuid.uuid4())

        # store client info in the database, or update if it already exists
        db.clients.update_one(
            {"_id": client_id},
            {"$set": {"name": client_name, "saved_votes": {}}},
            upsert=True
        )

        # Send a responce and set cookies
        response = make_response(jsonify({"client_name": client_name, "Result": "Success"}), 200)
        response.set_cookie("client_id", client_id, httponly=True, samesite="Lax")
        response.set_cookie("client_name", client_name, httponly=True, samesite="Lax")
        return response

    # Route to fetch client info using cookies or create a new one if not found
    @app.route("/api/get_client", methods=["GET"])
    def get_client():
        client_id = request.cookies.get("client_id", "")
        client_name = request.cookies.get("client_name", "")

        # If the exitsing info is found in cookies
        if client_id and client_name:
            return jsonify({
                "client_id": client_id,
                "client_name": client_name,
                "Result": "Success (from cookies)"
            })

        # If not then create a new id and name in the database
        client_id = str(uuid.uuid4())
        client_name = "New Client"

        db.clients.insert_one({
            "_id": client_id,
            "name": client_name,
            "saved_votes": {}
        })

        response = make_response(jsonify({
            "client_id": client_id,
            "client_name": client_name,
            "Result": "New Client"
        }))
        response.set_cookie("client_id", client_id, httponly=True, samesite="Lax")
        response.set_cookie("client_name", client_name, httponly=True, samesite="Lax")
        return response

    # Route to list all the polls, title, and unique code
    @app.route("/api/polls", methods=["GET"])
    def list_polls():
        polls = db.polls.find({}, {"title": 1, "code": 1})
        polls_list = [{"id": str(p["_id"]), "title": p["title"], "code": p["code"]} for p in polls]
        return jsonify({"polls": polls_list})

    # Route to create a poll
    @app.route("/api/create_poll", methods=["POST"])
    def create_poll():
        client_id = request.cookies.get("client_id")
        poll_title = request.form.get("poll_title")
        questions_json = request.form.get("questions")


        if not poll_title or not questions_json:
            return "Missing title or questions", 400

        # Parse the question data sent as JSON
        questions_data = json.loads(questions_json)

        poll_questions = []
        for q in questions_data:
            q_title = q.get("question_title")
            q_options = q.get("options", [])
            if not q_title or not q_options:
                continue

            options_list = []
            for opt in q_options:
                options_list.append({
                    "id": str(uuid.uuid4()), # Each option has a unique ID
                    "text": opt.strip(),
                    "vote_count": 0
                })

            poll_questions.append({
                "id": str(uuid.uuid4()), # Each question also has a unique ID
                "question_title": q_title,
                "poll_options": options_list
            })

        hex_code = generate_hex_code()

        poll_data = {
            "title": poll_title,
            "code": hex_code,
            "owner_id": client_id,
            "poll_questions": poll_questions,
            "participants": [client_id]
        }

        # Add new poll to the database
        inserted = db.polls.insert_one(poll_data)
        poll_id = str(inserted.inserted_id)

        # Notify all connected clients
        socketio.emit("refreshPolls", {"id": poll_id, "title": poll_title})
        return jsonify({"id": poll_id, "title": poll_title, "code": hex_code}), 201

    # Route to join a poll
    @app.route("/api/join_poll", methods=["POST"])
    def join_poll():
        # accept JSON or form-data
        if request.is_json:
            payload = request.get_json() or {}
            poll_code = payload.get("poll_code", "").upper().strip()
        else:
            poll_code = (request.form.get("poll_code") or "").upper().strip()

        client_id = request.cookies.get("client_id")
        if not poll_code or not client_id:
            return "Poll code and Client ID are required", 400

        _log = app.logger
        _log.debug(f"JOIN POLL: code={poll_code}, client={client_id}")

        doc = db.polls.find_one({"code": poll_code})
        if not doc:
            _log.debug(f"Poll not found for code: {poll_code}")
            return "Poll not found", 404

        # Add client to the list of poll participants
        db.polls.update_one(
            {"_id": doc["_id"]},
            {"$addToSet": {"participants": client_id}}
        )

        # Get the client’s previously saved votes
        client = db.clients.find_one({"_id": client_id})
        saved_votes = client.get("saved_votes", {}) if client else {}

        # Remove Mongodbs objectid and convert to JSON-serializable format
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)


        for q in doc.get("poll_questions", []):
            for opt in q.get("poll_options", []):
                pass

        return jsonify({
            "poll": doc,
            "saved_votes": saved_votes
        }), 200


    # Route to vote in a poll
    @app.route("/api/vote_option", methods=["POST"])
    def vote_option():
        if not request.is_json:
            return jsonify({"error": "Expected application/json"}), 400

        client_id = request.cookies.get("client_id")
        client_name = request.cookies.get("client_name", "Anonymous")
        data = request.get_json()

        if isinstance(data, list): # Support old clients sending array
            data = data[0]

        poll_id = data.get("poll_id")
        question_id = data.get("question_id")
        option_id = data.get("option_id")

        if not client_id or not poll_id or not question_id or not option_id:
            return jsonify({"error": "Missing required fields"}), 400

        poll_object_id = ObjectId(poll_id)
        poll = db.polls.find_one({"_id": poll_object_id})
        if not poll:
            return jsonify({"error": "Poll not found"}), 404

        client = db.clients.find_one({"_id": client_id})
        if not client:
            return jsonify({"error": "Client not found"}), 403

        saved_votes = client.get("saved_votes", {})
        previous_option_id = saved_votes.get(question_id)

        # If vote is being changed, decrement the old option count
        if previous_option_id and previous_option_id != option_id:
            db.polls.update_one(
                {"_id": poll_object_id},
                {"$inc": {"poll_questions.$[q].poll_options.$[o].vote_count": -1}},
                array_filters=[
                    {"q.id": question_id},
                    {"o.id": previous_option_id}
                ]
            )

        # Increment new vote
        db.polls.update_one(
            {"_id": poll_object_id},
            {"$inc": {"poll_questions.$[q].poll_options.$[o].vote_count": 1}},
            array_filters=[
                {"q.id": question_id},
                {"o.id": option_id}
            ]
        )

        # Save vote for client
        saved_votes[question_id] = option_id
        db.clients.update_one(
            {"_id": client_id},
            {"$set": {"saved_votes": saved_votes}}
        )

        # Get updated vote counts for both new and previous option
        updated_poll = db.polls.find_one({"_id": poll_object_id})
        new_vote_count = None
        old_vote_count = None

        for q in updated_poll.get("poll_questions", []):
            if q["id"] == question_id:
                for opt in q["poll_options"]:
                    if opt["id"] == option_id:
                        new_vote_count = opt["vote_count"]
                    if previous_option_id and opt["id"] == previous_option_id:
                        old_vote_count = opt["vote_count"]

        # Notify all clients in the poll room about the vote change
        socketio.emit("vote_event", {
            "poll_id": poll_id,
            "question_id": question_id,
            "vote_sent_by": client_name,
            "client_id": client_id,
            "new_vote": {
                "option_id": option_id,
                "vote_count": new_vote_count
            },
            "old_vote": {
                "option_id": previous_option_id,
                "vote_count": old_vote_count
            } if previous_option_id else None
        }, room=poll_id)

        return jsonify({
            "Result": "Success",
            "voted_for": option_id,
            "vote_count": new_vote_count
        }), 200

    # SocketIO event listener to let a client join a specific poll's room for real-time updates
    @socketio.on("join_poll")
    def handle_join_poll(data):
        poll_id = data.get("poll_id")
        if poll_id:
            join_room(poll_id)
            print(f"Client joined poll room: {poll_id}")
