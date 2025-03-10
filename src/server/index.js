const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

var admin = require("firebase-admin");

var serviceAccount = require("./polling-app-882ec-firebase-adminsdk-fbsvc-2b9c4a02c0.json");
const { Timestamp } = require("firebase-admin/firestore");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }, // Allow frontend requests
});

io.on("connection", (socket) => {
  console.log("A user connected");

  const fetchMessages = async () => {
    try {
      const messagesSnapshot = await db
        .collection("messages")
        .orderBy("timestamp")
        .get();
      messagesSnapshot.forEach((doc) => {
        socket.emit("message", doc.data().text);
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  // Call the async function
  fetchMessages();

  socket.on("message", async (msg) => {
    try {
      await db.collection("messages").add({
        text: msg,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      io.emit("message", msg);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => console.log("A user disconnected"));
});

server.listen(3000, () => console.log("Socket.IO server running on port 3000"));
