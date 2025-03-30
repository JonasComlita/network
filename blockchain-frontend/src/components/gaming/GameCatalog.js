// components/gaming/RevisedGameCatalog.js
import React, { useState } from 'react';
import GameLauncher from './GameLauncher';

const GameCatalog = ({ token }) => {
  const [selectedGame, setSelectedGame] = useState(null);
  const [category, setCategory] = useState('all');
  
  // Game catalog
  const games = [
    {
      id: 'pygame-zero',
      title: 'Pygame Zero',
      description: 'A simple Pygame Zero game running in your browser. Click to interact with the bouncing ball.',
      category: 'arcade',
      image: 'pygame-zero.jpg',
      players: 2450,
      tokens: 'NET',
      blockchain: 'NetWork',
      playToEarn: true,
      filename: 'Untitled-1.html' // The actual filename from your uploaded documents
    },
    {
      id: 'vertical-platformer',
      title: 'Vertical Platformer',
      description: 'A vertical platformer game with dynamic wave platforms. Use arrow keys or WASD to move, and space to jump.',
      category: 'platformer',
      image: 'platformer.jpg',
      players: 3210,
      tokens: 'NET',
      blockchain: 'NetWork',
      playToEarn: true,
      filename: 'Untitled-2.html'
    },
    {
      id: 'poker-game',
      title: 'Blockchain Poker',
      description: 'Play poker with blockchain-verified hands and transactions. Each hand is recorded on the blockchain for fairness.',
      category: 'card',
      image: 'poker.jpg',
      players: 5780,
      tokens: 'NET',
      blockchain: 'NetWork & Ethereum',
      playToEarn: true,
      filename: 'Untitled-3.html',
      dependencies: ['Untitled-3.js']
    },
    {
      id: 'roulette',
      title: 'Crypto Roulette',
      description: 'A blockchain-powered roulette game. Place bets on red, black, or green and watch the wheel spin. All bets are recorded on the blockchain.',
      category: 'casino',
      image: 'roulette.jpg',
      players: 4290,
      tokens: 'NET',
      blockchain: 'NetWork',
      playToEarn: true,
      filename: 'Untitled-4.html'
    },
    {
      id: 'pixel-game',
      title: 'Crypto Pixel Hunt',
      description: 'Find the winning pixel! Click around to discover the single hidden winning pixel. All attempts are recorded on the blockchain.',
      category: 'puzzle',
      image: 'pixel-hunt.jpg',
      players: 1830,
      tokens: 'NET',
      blockchain: 'NetWork',
      playToEarn: true,
      filename: 'Untitled-5.html'
    },
    {
      id: 'checkers',
      title: 'Blockchain Checkers',
      description: 'Play a game of checkers with moves verified on the blockchain. Each move is recorded as a transaction for complete transparency.',
      category: 'board',
      image: 'checkers.jpg',
      players: 2140,
      tokens: 'NET',
      blockchain: 'NetWork',
      playToEarn: true,
      filename: 'Untitled-6.html'
    },
    {
      id: 'racing-game',
      title: 'Crypto Racing',
      description: 'A racing game with blockchain rewards. Complete laps and earn cryptocurrency tokens. Your best times are recorded on the blockchain.',
      category: 'racing',
      image: 'racing.jpg',
      players: 3580,
      tokens: 'NET',
      blockchain: 'NetWork',
      playToEarn: true,
      filename: 'untitled-7.html',
      dependencies: ['untitled-7.js']
    },
    {
      id: 'nft-battle',
      title: 'NFT Battle Arena',
      description: 'Battle with your NFT characters in this strategic combat game. Each character has unique abilities based on its blockchain attributes.',
      category: 'strategy',
      image: 'nft-battle.jpg',
      players: 4120,
      tokens: 'NET',
      blockchain: 'NetWork',
      playToEarn: true
    },
    {
      id: 'crypto-farm',
      title: 'Crypto Farm',
      description: 'Build and manage your own virtual farm. Plant crops, raise animals, and earn tokens based on your farm\'s production.',
      category: 'simulation',
      image: 'farm.jpg',
      players: 5240,
      tokens: 'NET',
      blockchain: 'NetWork',
      playToEarn: true
    },
    {
      id: 'blockchain-rpg',
      title: 'Blockchain RPG',
      description: 'Explore a vast fantasy world where all your items, weapons, and achievements are stored as NFTs on the blockchain.',
      category: 'rpg',
      image: 'rpg.jpg',
      players: 6820,
      tokens: 'NET',
      blockchain: 'NetWork & Polygon',
      playToEarn: true
    }
  ];

  // Filter games by category
  const filteredGames = category === 'all' 
    ? games 
    : games.filter(game => game.category === category);

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All Games' },
    { id: 'arcade', name: 'Arcade' },
    { id: 'platformer', name: 'Platformer' },
    { id: 'card', name: 'Card Games' },
    { id: 'casino', name: 'Casino' },
    { id: 'puzzle', name: 'Puzzle' },
    { id: 'board', name: 'Board Games' },
    { id: 'racing', name: 'Racing' },
    { id: 'strategy', name: 'Strategy' },
    { id: 'simulation', name: 'Simulation' },
    { id: 'rpg', name: 'RPG' }
  ];

  // Handle selecting a game to play
  const handleSelectGame = (gameId) => {
    setSelectedGame(gameId);
  };

  // Handle back button to return to catalog
  const handleBack = () => {
    setSelectedGame(null);
  };

  // If a game is selected, show the game launcher component
  if (selectedGame) {
    return (
      <div>
        <button 
          onClick={handleBack}
          className="mb-4 text-indigo-400 hover:text-indigo-300 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Games
        </button>
        <GameLauncher gameId={selectedGame} token={token} />
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-6">
        Blockchain Games
      </h3>
      
      <div className="flex flex-wrap gap-3 mb-8">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm ${
              category === cat.id 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
            } transition-colors`}
          >
            {cat.name}
          </button>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGames.map(game => (
          <div 
            key={game.id}
            className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden hover:border-indigo-500/50 transition-colors"
          >
            <div className="h-48 bg-gray-700 relative overflow-hidden">
              {/* In a real app, you would use actual images */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/80 via-indigo-900/80 to-blue-900/80">
                <h3 className="text-xl font-bold text-white">{game.title}</h3>
              </div>
              
              {game.playToEarn && (
                <div className="absolute top-2 right-2 bg-green-900/80 text-green-400 text-xs px-2 py-1 rounded">
                  Play to Earn
                </div>
              )}
              
              {game.filename && (
                <div className="absolute bottom-2 left-2 bg-indigo-900/80 text-indigo-400 text-xs px-2 py-1 rounded">
                  Ready to Play
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded capitalize">{game.category}</span>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-gray-400 ml-1">{game.players.toLocaleString()}</span>
                </div>
              </div>
              
              <p className="text-gray-400 text-sm mb-4 line-clamp-3">{game.description}</p>
              
              <div className="flex justify-between text-xs text-gray-500 mb-4">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                  <span>{game.tokens}</span>
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
                  </svg>
                  <span>{game.blockchain}</span>
                </div>
              </div>
              
              <button 
                onClick={() => handleSelectGame(game.id)}
                disabled={!game.filename}
                className={`w-full py-2 text-white rounded transition-colors flex items-center justify-center ${
                  game.filename 
                    ? 'bg-indigo-600 hover:bg-indigo-500' 
                    : 'bg-gray-700 cursor-not-allowed'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                {game.filename ? 'Play Now' : 'Coming Soon'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredGames.length === 0 && (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h4 className="text-xl font-semibold text-white mb-2">No Games Found</h4>
          <p className="text-gray-400 mb-6">No games match your current filter criteria.</p>
          <button 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            onClick={() => setCategory('all')}
          >
            View All Games
          </button>
        </div>
      )}
    </div>
  );
};

export default GameCatalog;