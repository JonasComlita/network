// src/components/PassphraseExplainer.js
import React, { useState } from 'react';

const PassphraseExplainer = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState('what');
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-blue-600 p-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Understanding Wallet Passphrases</h2>
        <button 
          onClick={onClose}
          className="text-white hover:text-blue-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('what')}
            className={`py-3 px-4 font-medium text-sm ${
              activeTab === 'what'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            What Is It?
          </button>
          <button
            onClick={() => setActiveTab('why')}
            className={`py-3 px-4 font-medium text-sm ${
              activeTab === 'why'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Why It Matters
          </button>
          <button
            onClick={() => setActiveTab('best')}
            className={`py-3 px-4 font-medium text-sm ${
              activeTab === 'best'
                ? 'text-blue-600 border-b-2 border-blue-500'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Best Practices
          </button>
        </nav>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {activeTab === 'what' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">What is a Wallet Passphrase?</h3>
            <p className="text-gray-600 mb-4">
              A wallet passphrase is a secret password that protects your blockchain wallet and the cryptocurrency assets it contains.
            </p>
            
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-800">Different from your account password</h4>
                <p className="text-sm text-gray-600">
                  Your account password gives access to your user profile. Your wallet passphrase specifically unlocks your cryptocurrency wallet.
                </p>
              </div>
            </div>
            
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-800">Cannot be reset or recovered</h4>
                <p className="text-sm text-gray-600">
                  Unlike most passwords, if you forget your wallet passphrase, it cannot be reset. This provides security but means you must remember it.
                </p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-800">Private key to your digital assets</h4>
                <p className="text-sm text-gray-600">
                  Your passphrase protects the private keys that control your cryptocurrency. Anyone with your passphrase can access your funds.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'why' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Why Your Wallet Passphrase Matters</h3>
            <p className="text-gray-600 mb-4">
              Your wallet passphrase is the most critical security element for your cryptocurrency assets.
            </p>
            
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Important:</strong> If you lose your wallet passphrase, you will permanently lose access to any funds in that wallet.
                  </p>
                </div>
              </div>
            </div>
            
            <h4 className="font-medium text-gray-800 mb-2">Key security implications:</h4>
            <ul className="list-disc pl-5 text-gray-600 space-y-2 mb-4">
              <li>We do not store your passphrase for security reasons</li>
              <li>We cannot reset or recover it for you if lost</li>
              <li>It's your sole responsibility to keep it secure</li>
              <li>Anyone with your passphrase can access and transfer your funds</li>
              <li>All blockchain transactions are irreversible</li>
            </ul>
            
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-gray-800">The benefit of this system</h4>
                <p className="text-sm text-gray-600">
                  This security model means only you have control over your cryptocurrency. No company, bank, or government can freeze, seize, or control your assets.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'best' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Best Practices for Your Passphrase</h3>
            <p className="text-gray-600 mb-4">
              Follow these guidelines to keep your cryptocurrency wallet secure.
            </p>
            
            <h4 className="font-medium text-gray-800 mb-2">Creating a Strong Passphrase:</h4>
            <ul className="list-disc pl-5 text-gray-600 space-y-1 mb-4">
              <li>Use at least 12 characters (longer is better)</li>
              <li>Include uppercase and lowercase letters</li>
              <li>Include numbers and special characters</li>
              <li>Don't use common phrases or dictionary words</li>
              <li>Don't use personal information (birthdays, names, etc.)</li>
            </ul>
            
            <h4 className="font-medium text-gray-800 mb-2">Securing Your Passphrase:</h4>
            <ul className="list-disc pl-5 text-gray-600 space-y-1 mb-4">
              <li>Write it down on paper and store in a secure location (like a safe)</li>
              <li>Consider using a reputable password manager</li>
              <li>Split the passphrase and store parts in different secure locations</li>
              <li>Never store it in plain text on your computer or phone</li>
              <li>Never share it with anyone or enter it on untrusted websites</li>
              <li>Don't send it via email, text message, or social media</li>
            </ul>
            
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h4 className="font-medium text-green-800 mb-2">Example of a Strong Passphrase:</h4>
              <p className="font-mono text-green-800 bg-green-100 p-2 rounded">
                tR0ub4dor&3xample!Key
              </p>
              <p className="text-sm text-green-700 mt-2">
                This passphrase has 20 characters and includes uppercase letters, lowercase letters, numbers, and special characters.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="bg-gray-50 px-6 py-3 flex justify-between">
        <button 
          onClick={onClose}
          className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Close
        </button>
        
        <a 
          href="/help/wallet-guide" 
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          View Full Guide
        </a>
      </div>
    </div>
  );
};

export default PassphraseExplainer;