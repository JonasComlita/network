// src/components/BlockchainDashboardIntegration.js
import React, { useState } from 'react';
import BlockchainChart from './BlockchainChart';
import UserWallet from './UserWallet';
import PriceData from './PriceData';
import SentimentData from './SentimentData';
import NotificationList from './NotificationList';
import { useBlockchain } from '../hooks/useBlockchain';

/**
 * Integrated blockchain dashboard that combines wallet and blockchain features
 */
const BlockchainDashboardIntegration = ({ token, blockchainData }) => {
  // Always call the hook, but use provided data if available
  const localBlockchainData = useBlockchain();
  // Use the provided blockchain data or our local data
  const blockchain = blockchainData || localBlockchainData;
  
  // Active section
  const [activeSection, setActiveSection] = useState('overview');
  
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
          <div className="text-sm text-gray-500 mb-1">Avg. Block Time</div>
          <div className="text-2xl font-bold text-gray-900">
            {!blockchain || blockchain.isLoading
              ? <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
              : blockchain.analytics?.avg_block_time 
                ? `${parseFloat(blockchain.analytics.avg_block_time).toFixed(2)}s`
                : 'N/A'}
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
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Wallet
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
          <UserWallet token={token} />
        )}
        
        {activeSection === 'explorer' && (
          <BlockchainChart blockchainData={blockchain} />
        )}
        
        {activeSection === 'notifications' && (
          <NotificationList token={token} />
        )}
      </div>
    </div>
  );
};

export default BlockchainDashboardIntegration;