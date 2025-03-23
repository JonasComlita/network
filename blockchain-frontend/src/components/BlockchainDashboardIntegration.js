// src/components/BlockchainDashboardIntegration.js
import React, { useState, useEffect } from 'react';
import BlockchainChart from './BlockchainChart';
import UserWallet from './UserWallet';
import PriceData from './PriceData';
import SentimentData from './SentimentData';
import NotificationList from './NotificationList';
import PassphraseExplainer from './PassphraseExplainer';
import apiService from './apiService';
import { useBlockchain } from '../hooks/useBlockchain';

/**
 * Enhanced blockchain dashboard that integrates wallet and blockchain features
 * with better educational content and wallet status indicators
 */
const BlockchainDashboardIntegration = ({ token, blockchainData }) => {
  // Always call the hook, but use provided data if available
  const localBlockchainData = useBlockchain();
  // Use the provided blockchain data or our local data
  const blockchain = blockchainData || localBlockchainData;
  
  // State management
  const [activeSection, setActiveSection] = useState('overview');
  const [walletStatus, setWalletStatus] = useState({
    isLoading: true,
    hasWallet: false,
    isActive: false,
    walletAddress: null,
    balance: 0,
    error: null
  });
  const [showPassphraseModal, setShowPassphraseModal] = useState(false);
  
  // Fetch wallet status on component mount
  useEffect(() => {
    const fetchWalletStatus = async () => {
      if (!token) return;
      
      try {
        // Try to get wallet info without passphrase first to check status
        const response = await apiService.api.get('/wallet/info/');
        
        if (response.data) {
          setWalletStatus({
            isLoading: false,
            hasWallet: true,
            isActive: response.data.status === 'active',
            walletAddress: response.data.address,
            balance: response.data.balance || 0,
            error: null
          });
        }
      } catch (err) {
        // Handle case where wallet exists but needs passphrase
        if (err.response && err.response.status === 400 && 
            err.response.data.error === 'Wallet passphrase is required') {
          setWalletStatus({
            isLoading: false,
            hasWallet: true,
            isActive: false,
            walletAddress: null,
            balance: 0,
            error: 'Wallet passphrase required to view wallet'
          });
        } 
        // Handle case where wallet doesn't exist
        else if (err.response && err.response.status === 404) {
          setWalletStatus({
            isLoading: false,
            hasWallet: false,
            isActive: false,
            walletAddress: null,
            balance: 0,
            error: 'No wallet found for this account'
          });
        } 
        // Handle other errors
        else {
          setWalletStatus({
            isLoading: false,
            hasWallet: false,
            isActive: false,
            walletAddress: null,
            balance: 0,
            error: 'Error loading wallet information'
          });
        }
      }
    };
    
    fetchWalletStatus();
  }, [token]);
  
  // Connection status indicator
  const getConnectionStatus = (status) => {
    switch (status) {
      case 'connected':
        return { text: 'Connected', color: 'bg-green-100 text-green-800', dot: 'bg-green-500' };
      case 'connecting':
        return { text: 'Connecting...', color: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' };
      case 'error':
        return { text: 'Error', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' };
      case 'disconnected':
      default:
        return { text: 'Disconnected', color: 'bg-red-100 text-red-800', dot: 'bg-red-500' };
    }
  };
  
  // Socket status
  const blockSocketStatus = getConnectionStatus(blockchain?.socketStatus?.blocks || 'disconnected');
  const txSocketStatus = getConnectionStatus(blockchain?.socketStatus?.transactions || 'disconnected');
  
  // Wallet status panel
  const renderWalletStatusPanel = () => {
    if (walletStatus.isLoading) {
      return (
        <div className="bg-white shadow rounded-lg p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      );
    }
    
    if (!walletStatus.hasWallet) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">No Blockchain Wallet Found</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You don't have a blockchain wallet yet. You'll need one to send and receive cryptocurrency.
                </p>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('wallet')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Create Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setShowPassphraseModal(true)}
                  className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Learn About Wallets
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (walletStatus.hasWallet && !walletStatus.isActive) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Wallet Access Required</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You have a wallet but need to enter your passphrase to access it.
                </p>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => setActiveSection('wallet')}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Access Wallet
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Wallet is active
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex justify-between">
          <h3 className="text-sm font-medium text-gray-700">Wallet Status</h3>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1"></span>
            Active
          </span>
        </div>
        <div className="mt-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">Address:</span>
            <span className="text-xs font-mono">
              {walletStatus.walletAddress ? 
                `${walletStatus.walletAddress.substring(0, 8)}...${walletStatus.walletAddress.substring(walletStatus.walletAddress.length - 6)}` 
                : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs text-gray-500">Balance:</span>
            <span className="text-xs font-semibold">
              {walletStatus.balance.toFixed(8)} ORIG
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveSection('wallet')}
          className="mt-3 w-full inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Manage Wallet
        </button>
      </div>
    );
  };
  
  return (
    <div className="space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Blockchain Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Manage your wallet and monitor blockchain activity
        </p>
        
        {/* Connection status indicators */}
        <div className="flex items-center space-x-4 mt-4">
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Blocks WebSocket:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${blockSocketStatus.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full mr-1 ${blockSocketStatus.dot}`}></span>
              {blockSocketStatus.text}
            </span>
          </div>
          
          <div className="flex items-center">
            <span className="text-sm text-gray-500 mr-2">Transactions WebSocket:</span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${txSocketStatus.color}`}>
              <span className={`h-1.5 w-1.5 rounded-full mr-1 ${txSocketStatus.dot}`}></span>
              {txSocketStatus.text}
            </span>
          </div>
          
          {blockchain && blockchain.reconnectSockets && (
            <button 
              onClick={blockchain.reconnectSockets}
              className="ml-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              title="Reconnect WebSockets"
            >
              Reconnect
            </button>
          )}
        </div>
      </header>
      
      {blockchain && blockchain.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
          {blockchain.error}
        </div>
      )}
      
      {/* Dashboard stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Total Blocks</div>
            <div className="text-2xl font-bold text-gray-900">
              {!blockchain || blockchain.isLoading
                ? <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
                : blockchain.analytics?.total_blocks || blockchain.blocks?.length || 0}
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Total Transactions</div>
            <div className="text-2xl font-bold text-gray-900">
              {!blockchain || blockchain.isLoading
                ? <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
                : blockchain.analytics?.total_transactions || 0}
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg p-4">
            <div className="text-sm text-gray-500 mb-1">Mining Difficulty</div>
            <div className="text-2xl font-bold text-gray-900">
              {!blockchain || blockchain.isLoading
                ? <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
                : blockchain.analytics?.difficulty || 'N/A'}
            </div>
          </div>
        </div>
        
        {/* Wallet status panel */}
        <div className="md:col-span-1">
          {renderWalletStatusPanel()}
        </div>
      </div>
      
      {/* Section navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSection('overview')}
            className={`${
              activeSection === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveSection('wallet')}
            className={`${
              activeSection === 'wallet'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm relative`}
          >
            Wallet
            {!walletStatus.hasWallet && (
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveSection('explorer')}
            className={`${
              activeSection === 'explorer'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Blockchain Explorer
          </button>
          <button
            onClick={() => setActiveSection('notifications')}
            className={`${
              activeSection === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Notifications
          </button>
        </nav>
      </div>
      
      {/* Section content */}
      <div>
        {activeSection === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <BlockchainChart blockchainData={blockchain} />
            </div>
            <div className="lg:col-span-1">
              <div className="grid grid-cols-1 gap-6">
                <PriceData />
                <SentimentData />
              </div>
            </div>
          </div>
        )}
        
        {activeSection === 'wallet' && (
          <div>
            {/* Show special message for users without wallets */}
            {!walletStatus.hasWallet && (
              <div className="bg-blue-50 border border-blue-100 text-blue-700 px-4 py-3 rounded relative mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">
                      You're about to create your blockchain wallet. This wallet will let you store and transfer cryptocurrency on our platform.
                    </p>
                    <p className="mt-2 text-sm">
                      <button 
                        onClick={() => setShowPassphraseModal(true)}
                        className="text-blue-700 hover:text-blue-500 font-medium underline"
                      >
                        Learn more about wallet passphrases
                      </button>
                    </p>
                  </div>
                </div>
              </div>
            )}
            <UserWallet token={token} />
          </div>
        )}
        
        {activeSection === 'explorer' && (
          <BlockchainChart blockchainData={blockchain} />
        )}
        
        {activeSection === 'notifications' && (
          <NotificationList token={token} />
        )}
      </div>
      
      {/* Passphrase explainer modal */}
      {showPassphraseModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="max-w-3xl w-full mx-4">
            <PassphraseExplainer onClose={() => setShowPassphraseModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainDashboardIntegration;