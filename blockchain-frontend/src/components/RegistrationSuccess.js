// src/components/RegistrationSuccess.js
import React, { useState } from 'react';

const RegistrationSuccess = ({ registrationData, onLogin, onViewWallet, onViewProfile }) => {
  const [showPassphraseReminder, setShowPassphraseReminder] = useState(true);
  
  // Format wallet address for display (if available)
  const formatWalletAddress = (address) => {
    if (!address || address.startsWith('temp_')) return 'Pending';
    
    // Show first 6 and last 4 characters with ellipsis in the middle
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Determine wallet status message and styling
  const getWalletStatusInfo = () => {
    if (!registrationData) {
      return {
        icon: '⚠️',
        message: 'Unknown wallet status',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200'
      };
    }
    
    const status = registrationData.wallet_status || 'unknown';
    
    switch (status) {
      case 'active':
        return {
          icon: '✅',
          message: 'Wallet created successfully!',
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-100'
        };
      case 'pending':
        return {
          icon: '⏳',
          message: 'Wallet creation pending',
          color: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-100'
        };
      case 'error':
        return {
          icon: '❌',
          message: 'Wallet creation failed',
          color: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-100'
        };
      default:
        return {
          icon: '⚠️',
          message: 'Unknown wallet status',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100',
          borderColor: 'border-gray-200'
        };
    }
  };
  
  const walletStatus = getWalletStatusInfo();
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6 max-w-md mx-auto">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800">Registration Complete!</h2>
        <p className="text-gray-600 mt-1">Your account has been successfully created.</p>
      </div>
      
      {/* Wallet Status */}
      <div className={`p-4 rounded-lg ${walletStatus.bgColor} ${walletStatus.color} border ${walletStatus.borderColor} mb-6`}>
        <div className="flex items-start">
          <span className="text-2xl mr-2">{walletStatus.icon}</span>
          <div>
            <h3 className="font-semibold">{walletStatus.message}</h3>
            <p className="text-sm mt-1">
              {registrationData?.message || 'Your wallet status has been updated.'}
            </p>
            {registrationData?.wallet_address && !registrationData.wallet_address.startsWith('temp_') && (
              <p className="text-sm mt-2">
                Wallet Address: <span className="font-mono">{formatWalletAddress(registrationData.wallet_address)}</span>
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Passphrase Reminder */}
      {showPassphraseReminder && (
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 mb-6">
          <div className="flex items-start">
            <span className="text-2xl mr-2">🔑</span>
            <div>
              <h3 className="font-semibold">Important Reminder</h3>
              <p className="text-sm mt-1">
                Please make sure you have safely stored your wallet passphrase. It cannot be recovered if lost.
              </p>
              <button 
                onClick={() => setShowPassphraseReminder(false)}
                className="text-xs text-blue-600 hover:text-blue-800 mt-2 font-medium"
              >
                I've saved my passphrase
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex flex-col space-y-3">
        <button 
          onClick={onLogin}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
        >
          Log In
        </button>
        
        {registrationData?.wallet_status === 'active' && (
          <button 
            onClick={onViewWallet}
            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
          >
            Go to Wallet
          </button>
        )}
        
        {(registrationData?.wallet_status === 'pending' || registrationData?.wallet_status === 'error') && (
          <button 
            onClick={onViewProfile}
            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 text-center"
          >
            Go to Profile
          </button>
        )}
      </div>
      
      {/* Help Link */}
      <p className="text-center text-sm text-gray-500 mt-6">
        Need help?{' '}
        <button 
          onClick={() => window.location.href = '/support'}
          className="text-blue-600 hover:text-blue-800 bg-transparent border-none p-0 underline cursor-pointer"
        >
          Contact support
        </button>
      </p>
    </div>
  );
};

export default RegistrationSuccess;