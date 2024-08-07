const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { mongoURI, port, client_domain } = require('./config');
const Room = require('./models/Room');
const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: client_domain,
    methods: ['GET', 'POST']
  }
});

mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true, dbName: "chatapp" })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));


app.use(cors({
  origin: client_domain,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));


app.use(bodyParser.json());

// User routes
app.use('/api/users', require('./routes/users'));

// Room routes
app.use('/api/rooms', require('./routes/rooms'));


io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('sendMessage', async ({ roomCode, message }) => {
    console.log(message)
    try {
      if (!roomCode || !message || !message.user || !message.text || !message.userId) {
        return;
      }

      const room = await Room.findOne({ roomCode });

      if (!room) {
        return;
      }

      const newMessage = {
        user: message.user, text: message.text, userId: message.userId, createdAt: new Date().toISOString()
      };
      room.messages.push(newMessage);
      await room.save();

      io.to(roomCode).emit('message', newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('joinRoom', ({ roomCode, user }) => {
    try {
      if (!roomCode || !user || !user.name) {
        return;
      }

      socket.join(roomCode);
      console.log(`${user.name} joined room: ${roomCode}`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});


server.listen(port, () => console.log(`Server running on port ${port}`));
