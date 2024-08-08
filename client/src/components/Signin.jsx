import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Signin = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/users/signin`, formData);
            const { token, result } = response.data;

            localStorage.setItem('user', JSON.stringify(result));
            localStorage.setItem('token', token);

            navigate('/');
        } catch (error) {
            setError('Invalid email or password');
            console.error(error);
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-md">
                <div className="overflow-auto">{import.meta.env.VITE_API_INSTRUCTION}  </div>
                <div>{import.meta.env.VITE_API_EMAIL} </div>
                <div>{import.meta.env.VITE_API_PASSWORD}</div>
                <h2 className="text-2xl font-bold mb-6 text-center">Signin</h2>
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Signin
                    </button>
                    <span>new user?</span>
                    <button
                        onClick={() => navigate("/signup")}
                        className="py-2 px-2 rounded-lg hover:text-gray-400"
                    >
                        Click here to register
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Signin;
