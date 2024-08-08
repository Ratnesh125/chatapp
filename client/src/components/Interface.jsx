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
    }, []);

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
                setMessages((prevMessages) => {
                    const updatedMessages = [...prevMessages, message];
                    console.log(updatedMessages);
                    return updatedMessages;
                });
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
        console.log(room);
        setCurrentRoom(room);
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div className="flex flex-col h-screen">
            <div className="flex flex-1 overflow-hidden">
                <div className="w-full lg:w-1/3 border-r border-gray-300 flex flex-col">
                    <div className="p-3 flex-1 overflow-auto">
                        <div className="relative text-gray-600">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                                <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    viewBox="0 0 24 24" className="w-6 h-6 text-gray-300">
                                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                                </svg>
                            </span>
                            <input
                                type="search"
                                className="block w-full py-2 pl-10 bg-gray-100 rounded outline-none"
                                name="search"
                                placeholder="Search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                required
                            />
                        </div>
                        <ul className="overflow-auto mt-3">
                            <h2 className="my-2 mb-2 ml-2 text-lg text-gray-600">Rooms</h2>
                            {filteredRooms.map((room) => (
                                <li key={room._id} className="flex items-center px-3 py-2 text-sm transition duration-150 ease-in-out border-b border-gray-300 cursor-pointer hover:bg-gray-100 focus:outline-none" onClick={() => joinRoom(room)}>
                                    <div className="flex justify-between w-full pb-2">
                                        <span className="block ml-2 font-semibold text-xl text-gray-600">{room.roomName}</span>
                                        <div>
                                            <span className="block ml-2 font-semibold text-gray-600">code: {room.roomCode}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); copyToClipboard(room.roomCode); }}
                                                className="ml-2 bg-gray-200 text-gray-600 p-1 rounded hover:bg-gray-300"
                                                title="Copy Room Code"
                                            >
                                                Copy Room Code
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                        {isModalOpen && <CreateRoomJoinRoom closeModal={closeModal} />}
                    </div>
                    <div className="flex justify-end p-3 pb-8">
                        <button
                            className="bg-blue-500 text-white p-4 h-16 rounded-full shadow-lg flex items-center justify-center text-2xl z-50"
                            onClick={isModalOpen ? closeModal : openModal}
                        >
                            Create Room / Join Room
                        </button>
                    </div>
                </div>
                <div className="w-full lg:w-2/3 flex flex-col">
                    <div className="w-full border-b border-gray-300 p-3">
                        {currentRoom && (<div>

                            <span className="block font-bold text-gray-600">{currentRoom.roomName}</span>
                            <span className="block font-bold text-gray-600">
                                {typingUsers.length > 0 ? `${typingUsers.join(', ')} is typing...` : ''}
                            </span>
                        </div>
                        )}
                    </div>
                    <div className="flex-1 p-6 overflow-y-auto">
                        {messages.length === 0 ? (
                            <div className="h-full w-full flex items-center justify-center text-gray-500">
                                No messages yet. Start the conversation!
                            </div>
                        ) : (
                            <ul className="space-y-2">
                                {messages.map((msg, index) => (
                                    <li key={index} className={`flex ${msg.userId === user._id ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`relative max-w-xl px-4 py-2 text-gray-700 ${msg.userId === user._id ? 'bg-gray-100' : 'bg-white'} rounded shadow`}>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-semibold text-sm">{msg.user}</span>
                                            </div>
                                            <span className="block mt-1 text-lg">{msg.text}</span>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-semibold text-xs">{new Date(msg.createdAt).toUTCString()}</span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                                <div ref={messagesEndRef} />
                            </ul>
                        )}
                    </div>

                    {messages.length > 0 && (
                        <div className="w-full border-t border-gray-300 p-3 pb-8 flex items-center">
                            <input
                                type="text"
                                placeholder="Message"
                                className="block w-full py-4 pl-4 mx-6 bg-gray-100 rounded-full outline-none focus:text-gray-700"
                                value={message}
                                onChange={(e) => {
                                    setMessage(e.target.value);
                                    handleTyping();
                                }}
                                required
                            />
                            <button type="submit" onClick={sendMessage}>
                                <svg
                                    className="w-5 h-5 text-gray-500 origin-center transform rotate-90"
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                </svg>
                            </button>
                        </div>
                    )}


                </div>
            </div>
        </div>
    );
}

export default Interface;
