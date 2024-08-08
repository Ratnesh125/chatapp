const express = require('express');
const User = require('../models/User');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const { jwtSecret } = require('../config');

router.get('/rooms', authMiddleware, async (req, res) => {
    try {
        const userId = req.query.userId;
        const user = await User.findById(userId).populate({
            path: 'rooms',
            select: '-messages'
        }).exec();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const rooms = user.rooms
        res.status(200).json(rooms);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 12);

        const result = await User.create({ name, email, password: hashedPassword });

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
});

router.post('/signin', async (req, res) => {
    const { email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (!existingUser) return res.status(404).json({ message: 'User not found' });

        console.log(existingUser)
        const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
        console.log(isPasswordCorrect)
        if (!isPasswordCorrect) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ email: existingUser.email, id: existingUser._id }, jwtSecret, { expiresIn: '1h' });
        console.log(token)

        res.status(200).json({ result: existingUser, token });
    } catch (error) {
        res.status(500).json({ message: 'Something went wrong' });
    }
});


module.exports = router;

