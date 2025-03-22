import React, { useState } from 'react';
import apiService from './apiService'; // Adjust the import path as needed

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
            // Use the improved auth service for login
            const response = await apiService.auth.login(username, password);
            
            // Set token in parent component state
            setToken(response.access);
            
            // Log success for debugging
            console.log('Login successful');
        } catch (error) {
            console.error('Login error:', error);
            
            // More detailed error handling with consistent UI messaging
            if (error.response) {
                // The request was made and the server responded with an error status
                if (error.response.status === 401) {
                    setError('Invalid username or password');
                } else if (error.response.data?.detail) {
                    setError(error.response.data.detail);
                } else {
                    setError(`Error ${error.response.status}: Authentication failed`);
                }
            } else if (error.request) {
                // The request was made but no response was received
                setError('Server not responding. Please check your connection.');
            } else {
                // Something happened in setting up the request
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
                
                <div className="flex flex-col space-y-4">
                    <button
                        type="submit"
                        className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                    
                    <div className="text-center">
                        <a href="/register" className="text-sm text-blue-500 hover:text-blue-700">
                            Don't have an account? Register here
                        </a>
                    </div>
                </div>
                
                <div className="mt-4 p-3 bg-gray-100 rounded border border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Test Credentials</h3>
                    <p className="text-xs text-gray-600">
                        Username: <span className="font-mono">admin</span><br />
                        Password: <span className="font-mono">password</span>
                    </p>
                </div>
            </form>
        </div>
    );
};

export default Login;