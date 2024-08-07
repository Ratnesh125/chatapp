import React, { useState } from 'react';
import axios from 'axios';

const CreateRoomJoinRoom = ({ closeModal }) => {
    const [roomName, setRoomName] = useState('');
    const [joinRoomCode, setJoinRoomCode] = useState('');

    const handleCreateRoom = async () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        if (!user || !user._id) {
            alert('User not authenticated or user ID missing.');
            return;
        }

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/rooms/create`,
                {
                    roomName,
                    userId: user._id
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.status === 201) {
                alert('Room created successfully!');
                setRoomName('');
            }
        } catch (error) {
            console.error('Error creating room:', error);
            alert('Failed to create room');
        }
    };

    const handleJoinRoom = async () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));

        if (!user || !user._id) {
            alert('User not authenticated or user ID missing.');
            return;
        }

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/api/rooms/join`,
                {
                    userId: user._id,
                    roomCode: joinRoomCode
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.status === 200) {
                alert('Joined room successfully!');
                setJoinRoomCode('');
            }

        } catch (error) {
            console.error('Error joining room:', error);
            alert('Failed to join room');
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center z-50">
            <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                <h2 className="text-2xl font-bold mb-4">Create Room</h2>
                <button
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                    onClick={closeModal}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6.293 4.293a1 1 0 011.414 0L10 5.586l2.293-1.293a1 1 0 111.414 1.414L11.414 7l2.293 2.293a1 1 0 01-1.414 1.414L10 8.414l-2.293 2.293a1 1 0 01-1.414-1.414L8.586 7 6.293 4.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Room Name"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md mb-2"
                    />
                    <button
                        onClick={handleCreateRoom}
                        className="mt-4 w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600"
                    >
                        Create Room
                    </button>
                </div>

                <h2 className="text-2xl font-bold mb-4">Join Room</h2>
                <div>
                    <input
                        type="text"
                        placeholder="Room Code"
                        value={joinRoomCode}
                        onChange={(e) => setJoinRoomCode(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md mb-2"
                    />
                    <button
                        onClick={handleJoinRoom}
                        className="w-full bg-green-500 text-white p-2 rounded-md hover:bg-green-600"
                    >
                        Join Room
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateRoomJoinRoom;
