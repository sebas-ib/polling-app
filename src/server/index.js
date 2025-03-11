const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const crypto = require("crypto");

// import firebase admin SDK to interact with firebase
var admin = require("firebase-admin");

// private key for Firebase
// git wont let you push this file to remote repo, just avoid commiting for now
var serviceAccount = require("./private-key/polling-app-882ec-firebase-adminsdk-fbsvc-2b9c4a02c0.json");

// for the firebase timestamps
const { Timestamp } = require("firebase-admin/firestore");

admin.initializeApp({
  // authenticate using the serviceAccount
  credential: admin.credential.cert(serviceAccount),
});

// referance to the database
const db = admin.firestore();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // Allow frontend requests
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("createPoll", async ({ question, options }) => {
    const passcode = crypto.randomBytes(3).toString("hex").toUpperCase();
    const poll = await db.collection("polls").add({
      question,
      options,
      votes: options.map(() => 0),
      passcode,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    socket.emit("pollCreated", { id: poll.id, passcode });
  });

  socket.on("joinPoll", async ({ passcode }) => {
    const snapshot = await db
      .collection("polls")
      .where("passcode", "==", passcode)
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const poll = snapshot.docs[0].data();
      socket.emit("pollJoined", { id: snapshot.docs[0].id, ...poll });
    } else {
      socket.emit("error", "Invalid passcode.");
    }
  });

  socket.on("vote", async ({ pollId, optionIndex }) => {
    const poll = db.collection("polls").doc(pollId);
    await poll.update({
      [`votes.${optionIndex}`]: admin.firestore.FieldValue.increment(1),
    });

    const updatedPoll = (await poll.get()).data();
    io.emit("updatePoll", { id: pollId, ...updatedPoll });
  });

  socket.on("disconnect", () => console.log("A user disconnected"));
});

server.listen(3000, () => console.log("Socket.IO server running on port 3000"));
