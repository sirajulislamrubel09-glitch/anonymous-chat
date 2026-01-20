const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, 'public')));

let waitingUser = null;
const activePairs = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('start', () => {
    if (waitingUser && waitingUser !== socket.id) {
      const partnerId = waitingUser;
      activePairs.set(socket.id, partnerId);
      activePairs.set(partnerId, socket.id);
      
      socket.emit('partner-found');
      io.to(partnerId).emit('partner-found');
      
      waitingUser = null;
      console.log('Paired:', socket.id, 'with', partnerId);
    } else {
      waitingUser = socket.id;
      socket.emit('waiting');
      console.log('Waiting:', socket.id);
    }
  });

  socket.on('stop', () => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner-disconnected');
      activePairs.delete(partnerId);
    }
    activePairs.delete(socket.id);
    socket.emit('disconnected');
  });

  socket.on('send-message', (message) => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('receive-message', message);
    }
  });

  socket.on('next-partner', () => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner-disconnected');
      activePairs.delete(partnerId);
    }
    activePairs.delete(socket.id);
    socket.emit('disconnected');
  });

  socket.on('typing', () => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner-typing');
    }
  });

  socket.on('stop-typing', () => {
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner-stop-typing');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    if (waitingUser === socket.id) {
      waitingUser = null;
    }
    
    const partnerId = activePairs.get(socket.id);
    if (partnerId) {
      io.to(partnerId).emit('partner-disconnected');
      activePairs.delete(partnerId);
    }
    activePairs.delete(socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
