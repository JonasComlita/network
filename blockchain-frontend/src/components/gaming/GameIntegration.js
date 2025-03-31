// components/gaming/GameIntegration.js
import React, { useState, useEffect } from 'react';

const GameIntegration = ({ gameId, token }) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle'); // idle, loading, playing, completed
  const [earnedTokens, setEarnedTokens] = useState(0);

  useEffect(() => {
    // Simulate API fetch for game details
    setTimeout(() => {
      setGame({
        id: gameId || 'default-game',
        title: 'Cosmic Defenders',
        description: 'A space-themed arcade game where you defend planets from invaders. Earn tokens by destroying enemy ships and completing levels.',
        controls: 'Arrow keys to move, Space to shoot, P to pause',
        rewards: {
          perKill: 0.1,
          perLevel: 5,
          levelBonus: [10, 15, 25, 40, 60]
        },
        thumbnail: 'cosmic_defenders.jpg',
        lastScore: 1450,
        highScore: 2800,
        totalEarned: 125.5
      });
      setLoading(false);
    }, 1000);
  }, [gameId]);

  // Simulate launching game
  const launchGame = () => {
    setStatus('loading');
    
    // Simulate loading time
    setTimeout(() => {
      setStatus('playing');
      
      // Simulate game play and earning tokens
      const earnInterval = setInterval(() => {
        setEarnedTokens(prev => prev + 0.5);
      }, 5000);
      
      // Automatically end game after some time (for demo purposes)
      setTimeout(() => {
        clearInterval(earnInterval);
        setStatus('completed');
      }, 30000); // 30 seconds for demo
      
      return () => clearInterval(earnInterval);
    }, 2000);
  };

  // Reset game state
  const resetGame = () => {
    setStatus('idle');
    setEarnedTokens(0);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-3/4 mb-6"></div>
        <div className="h-64 bg-gray-700 rounded w-full mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="h-24 bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-700 rounded"></div>
        </div>
        <div className="h-10 bg-gray-700 rounded w-32 mx-auto"></div>
      </div>
    );
  }

  if (!game) {
    return <div className="text-red-400">Game not found</div>;
  }

  return (
    <div>
      <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-6">
        {game.title}
      </h3>
      
      {status === 'idle' && (
        <>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
            <p className="text-gray-300 mb-4">{game.description}</p>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 mb-4">
              <h4 className="text-indigo-400 font-medium mb-2">Controls</h4>
              <p className="text-gray-400">{game.controls}</p>
            </div>
            
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h4 className="text-indigo-400 font-medium mb-2">Rewards</h4>
              <ul className="text-gray-400 space-y-1">
                <li>• {game.rewards.perKill} NET per enemy destroyed</li>
                <li>• {game.rewards.perLevel} NET per level completed</li>
                <li>• Bonus rewards for reaching milestone levels</li>
              </ul>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-3">Your Stats</h4>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Score:</span>
                  <span className="text-white font-medium">{game.lastScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">High Score:</span>
                  <span className="text-white font-medium">{game.highScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Earned:</span>
                  <span className="text-green-400 font-medium">{game.totalEarned} NET</span>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-3">Blockchain Integration</h4>
              <p className="text-gray-400 mb-4">
                All your earnings are securely stored on the NetWork blockchain. Your progress and achievements are also recorded as NFTs.
              </p>
              <div className="flex items-center text-indigo-400 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>NetWork Blockchain Verified</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <button
              onClick={launchGame}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-colors shadow-lg shadow-purple-900/30 relative overflow-hidden group"
            >
              <span className="relative z-10 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play Game
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            </button>
          </div>
        </>
      )}
      
      {status === 'loading' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 text-center">
          <div className="animate-spin h-16 w-16 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-6"></div>
          <h4 className="text-xl font-bold text-white mb-2">Loading Game...</h4>
          <p className="text-gray-400">Connecting to blockchain network...</p>
        </div>
      )}
      
      {status === 'playing' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold text-white">Game in Progress</h4>
            <div className="bg-indigo-900/50 text-indigo-400 px-3 py-1 rounded-full text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 3.636a1 1 0 010 1.414 7 7 0 000 9.9 1 1 0 11-1.414 1.414 9 9 0 010-12.728 1 1 0 011.414 0zm9.9 0a1 1 0 011.414 0 9 9 0 010 12.728 1 1 0 11-1.414-1.414 7 7 0 000-9.9 1 1 0 010-1.414zM7.879 6.464a1 1 0 010 1.414 3 3 0 000 4.243 1 1 0 11-1.414 1.414 5 5 0 010-7.07 1 1 0 011.414 0zm4.242 0a1 1 0 011.414 0 5 5 0 010 7.072 1 1 0 01-1.414-1.415 3 3 0 000-4.242 1 1 0 010-1.415z" clipRule="evenodd" />
              </svg>
              Live
            </div>
          </div>
          
          {/* Simulated game content */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg aspect-video flex items-center justify-center mb-6">
            <div className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-4">
                {game.title}
              </div>
              <p className="text-gray-400 mb-6">Game simulation in progress...</p>
              <div className="inline-block relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-xl opacity-30 animate-pulse"></div>
                <div className="relative bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white">
                  Press any key to continue
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h5 className="text-gray-400 text-sm mb-1">Score</h5>
              <div className="text-xl font-bold text-white">1,250</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h5 className="text-gray-400 text-sm mb-1">Level</h5>
              <div className="text-xl font-bold text-white">3</div>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h5 className="text-gray-400 text-sm mb-1">Tokens Earned</h5>
              <div className="text-xl font-bold text-green-400">{earnedTokens.toFixed(1)} NET</div>
            </div>
          </div>
          
          <div className="text-center">
            <button
              onClick={() => setStatus('completed')}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded transition-colors"
            >
              End Game
            </button>
          </div>
        </div>
      )}
      
      {status === 'completed' && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-block bg-indigo-900/50 p-4 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">Game Completed!</h4>
            <p className="text-gray-400 mb-6">Your progress has been recorded on the blockchain</p>
          </div>
          
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-6 mb-8">
            <h5 className="text-lg font-semibold text-white mb-4">Session Summary</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Score:</span>
                  <span className="text-white font-medium">3,750</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Levels Completed:</span>
                  <span className="text-white font-medium">5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Enemies Destroyed:</span>
                  <span className="text-white font-medium">87</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Play Time:</span>
                  <span className="text-white font-medium">12m 30s</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Base Reward:</span>
                  <span className="text-white font-medium">5.0 NET</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Kill Rewards:</span>
                  <span className="text-white font-medium">8.7 NET</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Level Bonuses:</span>
                  <span className="text-white font-medium">11.5 NET</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 font-bold">Total Earned:</span>
                  <span className="text-green-400 font-bold">{earnedTokens.toFixed(1)} NET</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-4 text-center mb-8">
            <div className="flex items-center justify-center text-green-400 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
              <span>Transaction Successful</span>
            </div>
            <p className="text-gray-300">
              {earnedTokens.toFixed(1)} NET tokens have been transferred to your wallet
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-center space-y-3 md:space-y-0 md:space-x-4">
            <button
              onClick={resetGame}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            >
              Play Again
            </button>
            <button
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              View Leaderboard
            </button>
            <button
              className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            >
              Share Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameIntegration;