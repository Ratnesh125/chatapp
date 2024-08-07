const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Room = require('../models/Room');
const User = require('../models/User');
const auth = require('../middleware/auth');

router.use(auth)

router.post('/create', async (req, res) => {
    const { roomName, userId } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let roomCode;
        let uniqueRoom = false;

        while (!uniqueRoom) {
            roomCode = uuidv4().slice(0, 6).toUpperCase(); 
            const existingRoom = await Room.findOne({ roomCode });
            if (!existingRoom) {
                uniqueRoom = true;
            }
        }

        const newRoom = new Room({
            roomName,
            roomCode,
            members: [user._id]
        });

        await newRoom.save();

        user.rooms.push(newRoom._id);
        await user.save();

        res.status(201).json({ room: newRoom, roomCode }); 
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/join', async (req, res) => {
    const { userId, roomCode } = req.body;

    try {
        const room = await Room.findOne({ roomCode });

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        if (room.blockedMembers.includes(userId)) {
            return res.status(403).json({ error: 'You are blocked from this room' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!room.members.includes(userId)) {
            room.members.push(userId);
            await room.save();
        }

        if (!user.rooms.includes(room._id)) {
            user.rooms.push(room._id);
            await user.save();
        }

        res.status(200).json(room);
    } catch (error) {
        console.error('Error joining room:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/:roomId/messages', async (req, res) => {
    try {
        const room = await Room.findById(req.params.roomId).populate('messages');
        if (!room) {
            return res.status(404).send({ error: 'Room not found' });
        }
        res.send(room.messages);
    } catch (error) {
        res.status(400).send({ error: 'Error fetching messages' });
    }
});

router.post('/:roomId/messages', async (req, res) => {
    try {
        const { text } = req.body;
        const room = await Room.findById(req.params.roomId);

        if (!room) {
            return res.status(404).send({ error: 'Room not found' });
        }
        const message = { user: req.user.name, text };
        room.messages.push(message);
        await room.save();
        io.to(room.roomCode).emit('message', message);
        res.status(201).send(message);
    } catch (error) {
        res.status(400).send({ error: 'Error sending message' });
    }
});


router.post('/:roomCode/block', async (req, res) => {
    const { roomCode } = req.params;
    const { userId } = req.body;

    try {
        const room = await Room.findOne({ roomCode });

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        if (!room.blockedMembers.includes(userId)) {
            room.blockedMembers.push(userId);
            await room.save();
        }

        res.status(200).json(room);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
