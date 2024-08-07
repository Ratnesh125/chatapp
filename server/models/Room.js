const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Message Schema
const messageSchema = new Schema({

    user: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
});

// Room Schema
const roomSchema = new Schema({
    roomName: { type: String, required: true },
    roomCode: { type: String, required: true, unique: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    blockedMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    messages: [messageSchema]
});

module.exports = mongoose.model('Room', roomSchema);
