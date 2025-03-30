// components/gaming/GameLeaderboard.js
import React, { useState, useEffect } from 'react';

const GameLeaderboard = ({ gameId, token }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('weekly');

  useEffect(() => {
    // Simulate API fetch for leaderboard data
    setTimeout(() => {
      const sampleLeaderboard = [
        { rank: 1, username: 'crypto_master', score: 9843, earnings: 245, walletAddress: '0x1a2b...3c4d' },
        { rank: 2, username: 'blockchain_gamer', score: 8765, earnings: 210, walletAddress: '0x5e6f...7g8h' },
        { rank: 3, username: 'nft_collector', score: 8432, earnings: 185, walletAddress: '0x9i0j...1k2l' },
        { rank: 4, username: 'token_wizard', score: 7951, earnings: 162, walletAddress: '0x3m4n...5o6p' },
        { rank: 5, username: 'legend_player', score: 7645, earnings: 148, walletAddress: '0x7q8r...9s0t' },
        { rank: 6, username: 'digital_asset', score: 7321, earnings: 135, walletAddress: '0x1u2v...3w4x' },
        { rank: 7, username: 'meta_gamer', score: 6982, earnings: 120, walletAddress: '0x5y6z...7a8b' },
        { rank: 8, username: 'defi_champion', score: 6749, earnings: 112, walletAddress: '0x9c0d...1e2f' },
        { rank: 9, username: 'web3_warrior', score: 6512, earnings: 104, walletAddress: '0x3g4h...5i6j' },
        { rank: 10, username: 'crypto_legend', score: 6287, earnings: 96, walletAddress: '0x7k8l...9m0n' }
      ];
      
      setLeaderboard(sampleLeaderboard);
      setLoading(false);
    }, 1000);
  }, [gameId, period]);

  if (loading) {
    return (
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
          <div className="animate-pulse bg-gray-700 h-8 w-40 rounded"></div>
        </div>
        
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center">
              <div className="w-8 h-6 bg-gray-700 rounded mr-4"></div>
              <div className="h-6 bg-gray-700 rounded w-32 mr-auto"></div>
              <div className="h-6 bg-gray-700 rounded w-20 mr-4"></div>
              <div className="h-6 bg-gray-700 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
        
        <div className="flex rounded-lg overflow-hidden border border-gray-600">
          <button 
            className={`px-3 py-1 text-sm ${period === 'daily' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            onClick={() => setPeriod('daily')}
          >
            Daily
          </button>
          <button 
            className={`px-3 py-1 text-sm ${period === 'weekly' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            onClick={() => setPeriod('weekly')}
          >
            Weekly
          </button>
          <button 
            className={`px-3 py-1 text-sm ${period === 'alltime' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
            onClick={() => setPeriod('alltime')}
          >
            All Time
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-gray-700">
              <th className="pb-3 text-gray-400 font-medium">Rank</th>
              <th className="pb-3 text-gray-400 font-medium">Player</th>
              <th className="pb-3 text-gray-400 font-medium text-right">Score</th>
              <th className="pb-3 text-gray-400 font-medium text-right">Earnings</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((player) => (
              <tr key={player.rank} className="border-b border-gray-800 hover:bg-gray-800/30">
                <td className="py-3 text-white">{player.rank}</td>
                <td className="py-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 mr-3 flex items-center justify-center text-white font-bold">
                      {player.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-indigo-400">{player.username}</div>
                      <div className="text-gray-500 text-xs">{player.walletAddress}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-white text-right">{player.score.toLocaleString()}</td>
                <td className="py-3 text-green-400 text-right">{player.earnings} LEGEND</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center text-sm">
        <span className="text-gray-400">
          {period === 'daily' ? 'Updated hourly' : period === 'weekly' ? 'Updated daily' : 'Updated weekly'}
        </span>
        <button className="text-indigo-400 hover:text-indigo-300">
          View Full Leaderboard
        </button>
      </div>
    </div>
  );
};

export default GameLeaderboard;