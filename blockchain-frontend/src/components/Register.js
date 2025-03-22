import React, { useState } from 'react';
import apiService from './apiService'; // Adjust the import path as needed

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        isAdmin: false,
        isMiner: false,
        wallet_passphrase: ''
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return;
        }
        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }
        setLoading(true);
        try {
            const response = await apiService.auth.register({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                is_admin: formData.isAdmin,
                is_miner: formData.isMiner,
                wallet_passphrase: formData.walletPassphrase
            });
            setSuccess('Registration successful! You can now log in.');
            setFormData({
                username: '',
                email: '',
                password: '',
                confirmPassword: '',
                isAdmin: false,
                isMiner: false,
                wallet_passphrase: ''
            });
            // No need to call wallet/create here; wallet is created during registration
        } catch (error) {
            if (error.response && error.response.data) {
                const errorMessages = [];
                Object.keys(error.response.data).forEach(key => {
                    const errors = error.response.data[key];
                    errorMessages.push(`${key}: ${Array.isArray(errors) ? errors.join(', ') : errors}`);
                });
                setError(errorMessages.join('\n'));
            } else {
                setError('Registration failed. Please try again later.');
            }
            console.error('Registration error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center">Create an Account</h2>
            
            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded whitespace-pre-line">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
                    {success}
                </div>
            )}
            
            <form onSubmit={handleRegister}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                        Username
                    </label>
                    <input
                        id="username"
                        name="username"
                        type="text"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>
                
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Must be at least 8 characters long
                    </p>
                </div>
                
                <div className="mb-6">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
                        Confirm Password
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                </div>
                
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="walletPassphrase">
                        Wallet Passphrase
                    </label>
                    <input
                        id="walletPassphrase"
                        name="walletPassphrase"
                        type="password"
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="Wallet Passphrase"
                        value={formData.walletPassphrase}
                        onChange={handleChange}
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        This passphrase will be used to secure your blockchain wallet
                    </p>
                </div>

                <div className="mb-4">
                    <div className="flex items-center mb-2">
                        <input
                            id="isMiner"
                            name="isMiner"
                            type="checkbox"
                            className="mr-2"
                            checked={formData.isMiner}
                            onChange={handleChange}
                        />
                        <label className="text-gray-700 text-sm" htmlFor="isMiner">
                            Register as a Miner
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 ml-5">
                        Miners help validate transactions on the blockchain
                    </p>
                </div>
                
                {/* Admin checkbox is often restricted, but included for completeness */}
                <div className="mb-6">
                    <div className="flex items-center mb-2">
                        <input
                            id="isAdmin"
                            name="isAdmin"
                            type="checkbox"
                            className="mr-2"
                            checked={formData.isAdmin}
                            onChange={handleChange}
                        />
                        <label className="text-gray-700 text-sm" htmlFor="isAdmin">
                            Register as an Admin
                        </label>
                    </div>
                    <p className="text-xs text-gray-500 ml-5">
                        Admin registration may require approval
                    </p>
                </div>
                
                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className={`w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Register'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Register;