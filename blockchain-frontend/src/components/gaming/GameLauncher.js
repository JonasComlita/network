// components/gaming/GameLauncher.js
import React from 'react';

const GameLauncher = ({ gameId, token }) => {
  // Function to handle game launch
  const launchGame = () => {
    // Generate a unique token parameter for blockchain verification and user identification
    const gamePlayToken = `${token}-${Date.now()}`;
    
    // Create a token with the user's information for authentication
    const gameAuthToken = btoa(JSON.stringify({
      userId: token, // User's main token
      timestamp: Date.now(),
      gameId
    }));
    
    // Construct game URL with auth token parameter
    const gameUrl = `/games/${gameId}.html?auth=${gameAuthToken}`;
    
    // Open the game in a new window/tab
    window.open(gameUrl, '_blank', 'height=600,width=800');
    
    // Record play session start in blockchain (would be implemented in a real app)
    console.log(`Game session started: ${gameId} by user ${token} at ${new Date().toISOString()}`);
  };

  // Define game info for the launcher
  const games = {
    'pygame-zero': {
      title: 'Pygame Zero',
      description: 'A simple Pygame Zero game running in your browser. Click to interact with the bouncing ball.',
      instructions: 'Click the game area to change the ball direction.',
      rewardsInfo: 'Earn 1 NET token for every minute played.'
    },
    'vertical-platformer': {
      title: 'Vertical Platformer',
      description: 'A vertical platformer game with dynamic wave platforms. Challenge yourself to reach as high as possible!',
      instructions: 'Use A/D or Left/Right arrows to move, Space to jump.',
      rewardsInfo: 'Earn 5 NET tokens for every 1000 points scored.'
    },
    'poker-game': {
      title: 'Blockchain Poker',
      description: 'Play poker with blockchain-verified hands and transactions. Each hand is recorded for complete transparency.',
      instructions: 'Standard poker rules apply. Click on cards to select them.',
      rewardsInfo: 'Earn NET tokens based on your winnings - all tracked on the blockchain.'
    },
    'roulette': {
      title: 'Crypto Roulette',
      description: 'A blockchain-powered roulette game with verifiable randomness.',
      instructions: 'Place bets on red, black, or green and watch the wheel spin.',
      rewardsInfo: 'Winnings are automatically converted to NET tokens and added to your wallet.'
    },
    'pixel-game': {
      title: 'Crypto Pixel Hunt',
      description: 'Find the winning pixel! Each attempt is recorded on the blockchain.',
      instructions: 'Click around to discover the single hidden winning pixel.',
      rewardsInfo: 'Win 100 NET tokens for finding the winning pixel.'
    },
    'checkers': {
      title: 'Blockchain Checkers',
      description: 'Play checkers with blockchain verification for each move.',
      instructions: 'Click to select a piece, then click to move it. Standard checkers rules apply.',
      rewardsInfo: 'Earn 10 NET tokens for winning a game.'
    },
    'racing-game': {
      title: 'Crypto Racing',
      description: 'A racing game with blockchain rewards for completing laps and setting records.',
      instructions: 'Use arrow keys to drive, Space to brake.',
      rewardsInfo: 'Earn 5 NET tokens per lap completed, with bonuses for fast lap times.'
    }
  };

  // Get game info or return default values if game doesn't exist
  const game = games[gameId] || {
    title: 'Unknown Game',
    description: 'No description available.',
    instructions: 'No instructions available.',
    rewardsInfo: 'No rewards information available.'
  };

  return (
    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
      <div className="mb-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-2">
          {game.title}
        </h3>
        <p className="text-gray-300 mb-6">{game.description}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-2">Game Instructions</h4>
          <p className="text-gray-300">{game.instructions}</p>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h4 className="text-lg font-semibold text-white mb-2">Blockchain Rewards</h4>
          <p className="text-gray-300">{game.rewardsInfo}</p>
          <div className="flex items-center mt-4 text-indigo-300 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>All rewards are verified and recorded on the NetWork blockchain</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <button 
          onClick={launchGame}
          className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-500 hover:to-purple-500 transition-colors shadow-lg shadow-purple-900/30 relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            Launch Game
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
        </button>
      </div>
      
      <div className="mt-8 pt-6 border-t border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-4">Your Game Stats</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h5 className="text-gray-400 mb-1">Play Time</h5>
            <div className="text-xl font-bold text-white">12h 45m</div>
            <div className="text-green-400 text-sm mt-1">+2h today</div>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h5 className="text-gray-400 mb-1">Total Earned</h5>
            <div className="text-xl font-bold text-white">127.5 NET</div>
            <div className="text-green-400 text-sm mt-1">+15 this week</div>
          </div>
          
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h5 className="text-gray-400 mb-1">Achievements</h5>
            <div className="text-xl font-bold text-white">8/12</div>
            <div className="text-indigo-400 text-sm mt-1">66% complete</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLauncher;