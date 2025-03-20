import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ setToken }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            // Add log to troubleshoot request
            console.log('Sending login request with:', { username, password: '******' });
            
            const response = await axios.post('http://localhost:8000/api/token/', { username, password });
            
            // Log for debugging
            console.log('Login response:', response.data);
            
            // Store token in localStorage
            localStorage.setItem('token', response.data.access);
            
            // Store refresh token if available
            if (response.data.refresh) {
                localStorage.setItem('refresh_token', response.data.refresh);
            }
            
            // Update parent component state
            setToken(response.data.access);
            
            console.log('Token stored:', localStorage.getItem('token'));
        } catch (error) {
            console.error('Login error:', error);
            
            // More detailed error logging
            if (error.response) {
                // The request was made and the server responded with a status code
                console.error('Error response:', error.response.data);
                console.error('Status code:', error.response.status);
                setError(error.response.data?.detail || `Error ${error.response.status}: Authentication failed`);
            } else if (error.request) {
                // The request was made but no response was received
                console.error('No response received:', error.request);
                setError('No response from server. Please check your connection.');
            } else {
                // Something happened in setting up the request
                console.error('Request setup error:', error.message);
                setError(`Request error: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Login to Blockchain Dashboard</h2>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleLogin}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                        Username
                    </label>
                    <input
                        id="username"
                        type="text"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                
                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </div>
                
                <div className="mt-4 text-center text-sm">
                    <p>Test credentials: admin / password</p>
                </div>
            </form>
        </div>
    );
};

export default Login;