import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import CreateRoomJoinRoom from './CreateRoomJoinRoom';

const Interface = () => {
    const navigate = useNavigate();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [user, setUser] = useState(null);
    const [rooms, setRooms] = useState([]);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [socket, setSocket] = useState(null);
    const [typingUsers, setTypingUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const copyToClipboard = (roomCode) => {
        navigator.clipboard.writeText(roomCode).then(() => {
            alert('Room code copied to clipboard!');
        }).catch((err) => {
            console.error('Failed to copy room code: ', err);
        });
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/signin');
        } else {
            const user = JSON.parse(localStorage.getItem('user'));
            setUser(user);
        }
    }, [navigate]);

    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const token = localStorage.getItem('token');
                const userId = JSON.parse(localStorage.getItem('user'))._id;
                const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/users/rooms`, {
                    params: { userId: userId },
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRooms(response.data);
            } catch (error) {
                console.error('Error fetching rooms', error);
                if (error.response.status === 401) {
                    navigate('/signin')
                }
            }
        };

        fetchRooms();
    }, [navigate]);

    useEffect(() => {
        const newSocket = io(`${import.meta.env.VITE_API_SERVER_URL}`);
        setSocket(newSocket);
        return () => {
            newSocket.disconnect();
        };
    }, []);

    useEffect(() => {
        if (socket && currentRoom) {
            const fetchMessages = async () => {
                try {
                    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/rooms/${currentRoom._id}/messages`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    setMessages(response.data);
                } catch (error) {
                    console.error('Error fetching messages', error);
                }
            };

            fetchMessages();

            socket.emit('joinRoom', { roomCode: currentRoom.roomCode, user });

            socket.on('message', (message) => {
                setMessages((prevMessages) => [...prevMessages, message]);
            });

            socket.on('typing', (username) => {
                setTypingUsers((prev) => {
                    if (!prev.includes(username)) {
                        return [...prev, username];
                    }
                    return prev;
                });
            });

            socket.on('stop typing', (username) => {
                setTypingUsers((prev) => prev.filter((user) => user !== username));
            });

            return () => {
                socket.emit('leaveRoom', { roomCode: currentRoom.roomCode, user });
                socket.off('message');
            };
        }
    }, [currentRoom, socket, user]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (message.trim() && currentRoom && socket && user) {
            const newMessage = {
                user: user.name,
                text: message,
                userId: user._id,
            };
            const roomCode = currentRoom.roomCode;

            socket.emit('sendMessage', { roomCode, message: newMessage });
            setMessage('');
        }
    };

    const handleTyping = () => {
        socket.emit('typing', user?.name);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('stop typing', user?.name);
        }, 3000);
    };

    const filteredRooms = rooms.filter((room) =>
        room.roomName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const joinRoom = (room) => {
        setCurrentRoom(room);
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <div className="flex flex-1 overflow-hidden">
                <div className={`w-full lg:w-1/3 border-r border-gray-200 bg-white flex flex-col shadow-lg transition-transform duration-300 ${currentRoom ? 'hidden lg:flex' : 'flex'}`}>
                    <div className="p-4 flex-1 overflow-auto">
                        <div className="relative text-gray-700">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    viewBox="0 0 24 24" className="w-6 h-6 text-gray-400">
                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </span>
                            <input
                                type="search"
                                className="block w-full py-2 pl-10 bg-gray-100 rounded-md outline-none focus:ring-2 focus:ring-green-500"
                                name="search"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                required
                            />
                        </div>
                        <ul className="mt-4">
                            <h2 className="mb-3 text-lg font-semibold text-gray-800">Rooms</h2>
                            {filteredRooms.map((room) => (
                                <li key={room._id} className="flex items-center px-4 py-3 text-sm border-b border-gray-200 cursor-pointer hover:bg-gray-100 transition duration-150 ease-in-out" onClick={() => joinRoom(room)}>
                                    <div className="flex flex-col w-full">
                                        <span className="block font-semibold text-gray-800">{room.roomName}</span>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Code: {room.roomCode}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); copyToClipboard(room.roomCode); }}
                                                className="ml-2 text-green-500 hover:text-green-700"
                                                title="Copy Room Code"
                                            >
                                                Copy Code
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        {isModalOpen && <CreateRoomJoinRoom closeModal={closeModal} />}
                    </div>
                    <div className="p-4 flex justify-center">
                        <button
                            className="bg-green-600 text-white px-4 py-2 rounded-full shadow-md hover:bg-green-700 transition duration-200"
                            onClick={isModalOpen ? closeModal : openModal}
                        >
                            Create / Join Room
                        </button>
                    </div>
                </div>

                {currentRoom && (
                    <div className="w-full lg:w-2/3 flex flex-col bg-gray-100">
                        <div className="w-full border-b border-gray-200 p-4 bg-white shadow-md">
                            <div className="flex justify-between items-center">
                                <h1 className="text-2xl font-semibold text-gray-800">{currentRoom.roomName}</h1>
                                <button onClick={() => setCurrentRoom(null)} className="text-red-500 hover:text-red-700 text-sm">
                                    Close Room
                                </button>
                            </div>
                            <p className="text-gray-600">
                                {typingUsers.length > 0 ? `${typingUsers.join(', ')} ${typingUsers.length > 1 ? 'are' : 'is'} typing...` : ''}
                            </p>
                        </div>
                        <div className="flex-1 p-4 overflow-y-auto">
                            {messages.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-500">
                                    No messages yet. Start the conversation!
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {messages.map((msg, index) => (
                                        <li key={index} className={`flex ${msg.userId === user._id ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`relative max-w-md px-4 py-2 text-gray-800 ${msg.userId === user._id ? 'bg-blue-100' : 'bg-white'} rounded-md shadow-md`}>
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-semibold text-sm">{msg.user}</span>
                                                </div>
                                                <p className="mt-1 text-lg">{msg.text}</p>
                                                <div className="flex items-center justify-between mt-1 text-gray-500 text-xs">
                                                    <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                    <div ref={messagesEndRef} />
                                </ul>
                            )}
                        </div>
                        <div className="w-full border-t border-gray-200 p-4 bg-white flex items-center">
                            <input
                                type="text"
                                placeholder="Type a message..."
                                className="block w-full py-2 pl-4 bg-gray-100 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                    handleTyping();
                                }}
                                required
                            />
                            <button type="submit" onClick={sendMessage} className="ml-4 text-blue-600 hover:text-blue-800">
                                <svg
                                    className="w-6 h-6 transform rotate-90"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Interface;
