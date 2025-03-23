// src/components/Register.js
import React, { useState } from 'react';
import apiService from './apiService';

const Register = ({ onSuccess }) => {
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    isAdmin: false,
    isMiner: false,
    walletPassphrase: '',
    confirmWalletPassphrase: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAdvancedError, setShowAdvancedError] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  
  // Handle form field changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  // Form validation
  const validateForm = () => {
    // Reset previous errors
    setError('');
    
    // Check if all required fields are filled
    if (!formData.username || !formData.email || !formData.password || 
        !formData.confirmPassword || !formData.walletPassphrase || 
        !formData.confirmWalletPassphrase) {
      setError('All fields are required');
      return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Check password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Check wallet passphrase match
    if (formData.walletPassphrase !== formData.confirmWalletPassphrase) {
      setError('Wallet passphrases do not match');
      return false;
    }
    
    return true;
  };
  
  // Register user
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError('');
      setErrorDetails('');
      
      // Prepare user data
      const userData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        wallet_passphrase: formData.walletPassphrase,
        is_admin: formData.isAdmin,
        is_miner: formData.isMiner
      };
      
      // Register user
      const response = await apiService.auth.register(userData);
      
      console.log('Registration successful:', response.data);
      
      // Notify parent component of successful registration
      if (onSuccess && typeof onSuccess === 'function') {
        onSuccess(response.data);
      }
      
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        isAdmin: false,
        isMiner: false,
        walletPassphrase: '',
        confirmWalletPassphrase: ''
      });
      
    } catch (err) {
      console.error('Registration error:', err);
      
      // Improved error handling
      let errorMessage = 'Registration failed. Please try again later.';
      let detailedError = '';
      
      // Handle different types of error responses
      if (err.response) {
        // The server responded with an error status
        if (typeof err.response.data === 'string' && err.response.data.includes('ProgrammingError')) {
          // This is a Django database error
          errorMessage = 'Backend database error. The system might not be properly set up.';
          detailedError = err.response.data;
        } else if (err.response.data) {
          // Try to extract structured error messages
          try {
            if (typeof err.response.data === 'object') {
              const errorMessages = [];
              Object.keys(err.response.data).forEach(key => {
                const errors = err.response.data[key];
                errorMessages.push(`${key}: ${Array.isArray(errors) ? errors.join(', ') : errors}`);
              });
              errorMessage = errorMessages.join('\n');
            } else {
              errorMessage = String(err.response.data).substring(0, 100); // Limit to 100 chars
              detailedError = String(err.response.data);
            }
          } catch (e) {
            errorMessage = `Server error (${err.response.status})`;
            detailedError = String(err.response.data);
          }
        }
      } else if (err.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Error in setting up the request
        errorMessage = err.message || 'An unknown error occurred';
      }
      
      setError(errorMessage);
      setErrorDetails(detailedError);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Account & Wallet</h2>
      
      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-700 rounded">
          <p className="font-medium">Error: {error}</p>
          
          {errorDetails && (
            <div className="mt-2">
              <button
                onClick={() => setShowAdvancedError(!showAdvancedError)}
                className="text-sm underline"
              >
                {showAdvancedError ? 'Hide details' : 'Show technical details'}
              </button>
              
              {showAdvancedError && (
                <div className="mt-2 p-2 bg-red-100 rounded overflow-auto max-h-40 text-xs font-mono">
                  {errorDetails}
                </div>
              )}
              
              <p className="mt-2 text-sm">
                It appears there might be an issue with the server configuration. 
                Please contact the system administrator.
              </p>
            </div>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your username"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Create a password"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Confirm your password"
            required
          />
        </div>
        
        <div className="mt-6 mb-4">
          <h3 className="text-md font-medium text-gray-800 mb-2">Wallet Security</h3>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4">
            <p className="text-sm text-blue-700">
              Your wallet passphrase protects your cryptocurrency and cannot be recovered if lost.
              Save it somewhere secure.
            </p>
          </div>
          
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wallet Passphrase
          </label>
          <input
            type="password"
            name="walletPassphrase"
            value={formData.walletPassphrase}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Create a wallet passphrase"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Wallet Passphrase
          </label>
          <input
            type="password"
            name="confirmWalletPassphrase"
            value={formData.confirmWalletPassphrase}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Confirm your wallet passphrase"
            required
          />
        </div>
        
        <div className="mb-4">
          <div className="flex items-center">
            <input
              id="isMiner"
              name="isMiner"
              type="checkbox"
              checked={formData.isMiner}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isMiner" className="ml-2 text-sm text-gray-700">
              Register as a Miner
            </label>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center">
            <input
              id="isAdmin"
              name="isAdmin"
              type="checkbox"
              checked={formData.isAdmin}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isAdmin" className="ml-2 text-sm text-gray-700">
              Register as an Admin
            </label>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {loading ? 'Creating Account...' : 'Create Account & Wallet'}
        </button>
      </form>
    </div>
  );
};

export default Register;