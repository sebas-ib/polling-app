const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Allow frontend requests
});

io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('message', (msg) => io.emit('message', msg));
    socket.on('disconnect', () => console.log('A user disconnected'));
});

server.listen(3001, () => console.log('Socket.IO server running on port 3001'));
