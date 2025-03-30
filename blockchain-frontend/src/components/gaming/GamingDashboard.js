// components/gaming/GamingDashboard.js
import React from 'react';
import GamesList from './GamesList';
import NFTInventory from './NFTInventory';
import GameWallet from './GameWallet';

const GamingDashboard = ({ token, onSelectGame }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-6">
        Blockchain Gaming Hub
      </h2>
      
      <p className="text-gray-400 mb-8">
        Explore blockchain-powered games with true ownership of in-game assets, play-to-earn opportunities, and seamless integration with your NetWork wallet.
      </p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-900/70 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white">Games Available</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-2">14</div>
          <p className="text-gray-400 text-sm">3 new games this month</p>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-indigo-900/70 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white">Your NFTs</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-2">6</div>
          <p className="text-gray-400 text-sm">Across 3 different games</p>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-900/70 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white">Gaming Earnings</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-2">247 NET</div>
          <p className="text-gray-400 text-sm">+32 NET this week</p>
        </div>
      </div>
      
      <div className="mb-10">
        <GamesList onSelectGame={onSelectGame} token={token} />
      </div>
    </div>
  );
};

export default GamingDashboard;