// components/gaming/GamesList.js
import React, { useState, useEffect } from 'react';

const GamesList = ({ onSelectGame, token }) => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      const sampleGames = [
        {
          id: 1,
          title: 'Crypto Legends',
          description: 'A strategic card game where each card is a unique NFT. Battle other players to earn rewards and rare cards.',
          category: 'Card Game',
          players: 12458,
          rating: 4.7,
          thumbnail: 'crypto_legends.jpg',
          nftCount: 50000,
          launched: '2024-12-10T00:00:00Z',
          blockchain: 'NetWork',
          earning: true
        },
        {
          id: 2,
          title: 'Metaverse Racing',
          description: 'Race custom NFT vehicles across dynamic tracks in the metaverse. Upgrade parts, customize your ride, and compete in tournaments.',
          category: 'Racing',
          players: 8721,
          rating: 4.5,
          thumbnail: 'metaverse_racing.jpg',
          nftCount: 35000,
          launched: '2025-01-15T00:00:00Z',
          blockchain: 'NetWork',
          earning: true
        },
        {
          id: 3,
          title: 'Blockchain Battles',
          description: 'A turn-based strategy game where your army consists of NFT units. Conquer territories and establish your blockchain empire.',
          category: 'Strategy',
          players: 5932,
          rating: 4.3,
          thumbnail: 'blockchain_battles.jpg',
          nftCount: 28000,
          launched: '2025-02-10T00:00:00Z',
          blockchain: 'NetWork',
          earning: true
        },
        {
          id: 4,
          title: 'Crypto Creatures',
          description: 'Collect, train, and battle with unique crypto creatures. Each creature is an NFT with its own attributes and abilities.',
          category: 'Collectible',
          players: 15683,
          rating: 4.8,
          thumbnail: 'crypto_creatures.jpg',
          nftCount: 70000,
          launched: '2024-11-05T00:00:00Z',
          blockchain: 'NetWork & Ethereum',
          earning: true
        },
        {
          id: 5,
          title: 'Decentraland Defenders',
          description: 'Protect your virtual land in this tower defense game. Place NFT defense units strategically to repel invaders.',
          category: 'Tower Defense',
          players: 4215,
          rating: 4.2,
          thumbnail: 'decentraland_defenders.jpg',
          nftCount: 18000,
          launched: '2025-03-01T00:00:00Z',
          blockchain: 'NetWork',
          earning: false
        },
        {
          id: 6,
          title: 'Token Tycoon',
          description: 'Build your financial empire in this economic simulation. Invest in virtual businesses and properties represented as NFTs.',
          category: 'Simulation',
          players: 7240,
          rating: 4.4,
          thumbnail: 'token_tycoon.jpg',
          nftCount: 25000,
          launched: '2025-02-20T00:00:00Z',
          blockchain: 'NetWork',
          earning: true
        }
      ];
      
      setGames(sampleGames);
      setLoading(false);
    }, 1000);
  }, []);

  const filterGames = () => {
    if (filter === 'all') return games;
    if (filter === 'earning') return games.filter(game => game.earning);
    return games.filter(game => game.category.toLowerCase() === filter.toLowerCase());
  };

  const formatPlayerCount = (count) => {
    if (count >= 10000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toLocaleString();
  };

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Loading Games...</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-700"></div>
              <div className="p-4">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-700 rounded w-full mb-3"></div>
                <div className="flex justify-between mt-4">
                  <div className="h-8 bg-gray-700 rounded w-24"></div>
                  <div className="h-8 bg-gray-700 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-semibold text-white">Available Games</h3>
        
        <div className="flex space-x-2">
          <select 
            className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500/20 transition-colors"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Games</option>
            <option value="earning">Play to Earn</option>
            <option value="Card Game">Card Games</option>
            <option value="Racing">Racing</option>
            <option value="Strategy">Strategy</option>
            <option value="Collectible">Collectibles</option>
            <option value="Simulation">Simulation</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filterGames().map((game) => (
          <div 
            key={game.id}
            className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden hover:border-indigo-500/50 transition-colors cursor-pointer"
            onClick={() => onSelectGame(game.id)}
          >
            <div className="h-48 bg-gray-700 relative overflow-hidden">
              {/* In a real app, you would use actual images */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/80 via-indigo-900/80 to-blue-900/80">
                <h3 className="text-xl font-bold text-white">{game.title}</h3>
              </div>
              
              {game.earning && (
                <div className="absolute top-2 right-2 bg-green-900/80 text-green-400 text-xs px-2 py-1 rounded">
                  Play to Earn
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">{game.category}</span>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-white ml-1">{game.rating}</span>
                </div>
              </div>
              
              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{game.description}</p>
              
              <div className="flex justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  {formatPlayerCount(game.players)} players
                </div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  {(game.nftCount / 1000).toFixed(1)}K NFTs
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-between">
                <span className="text-indigo-400 text-sm">{game.blockchain}</span>
                <button 
                  className="px-3 py-1 bg-indigo-600/80 hover:bg-indigo-500/80 text-white text-sm rounded transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectGame(game.id);
                  }}
                >
                  Play Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GamesList;