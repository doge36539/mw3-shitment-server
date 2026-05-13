const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

// CORS is critical so your CodeSandbox frontend is allowed to talk to this Render backend!
const io = new Server(server, {
  cors: { origin: "*" }
});

const players = {};

io.on('connection', (socket) => {
  console.log('A wild player appeared:', socket.id);

  // 1. Create a fresh stats block for the new player
  players[socket.id] = { x: 0, y: 5, z: 10, isDead: false };

  // 2. Send the new player the current state of the world
  socket.emit('init', { id: socket.id, players });

  // 3. Tell everyone else in the lobby that someone joined
  socket.broadcast.emit('playerJoined', { id: socket.id, state: players[socket.id] });

  // 4. Listen for blazing fast movement updates and broadcast them
  socket.on('move', (state) => {
    players[socket.id] = state;
    // 'volatile' means if a packet drops, don't slow down to resend it. Just drop it! Perfect for FPS.
    socket.volatile.broadcast.emit('playerMoved', { id: socket.id, state });
  });

  // 5. Cleanup when they rage quit
  socket.on('disconnect', () => {
    console.log('Player vanished:', socket.id);
    delete players[socket.id];
    io.emit('playerLeft', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server blasting packets on port ${PORT}`));
