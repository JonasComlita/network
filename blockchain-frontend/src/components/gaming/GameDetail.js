import React, { useState, useEffect } from 'react';
import GameLeaderboard from './GameLeaderboard';

const GameDetail = ({ gameId, token }) => {
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Simulate API fetch for game details
    setTimeout(() => {
      // In a real app, you would fetch data for the specific gameId
      setGame({
        id: gameId,
        title: 'Crypto Legends',
        description: 'A strategic card game where each card is a unique NFT. Battle other players to earn rewards and rare cards. Build powerful decks, create strategies, and climb the competitive ladder.',
        longDescription: 'Crypto Legends takes place in a fantastical world where powerful beings battle for supremacy. Each card represents a legendary character, spell, or artifact with unique abilities and attributes stored immutably on the blockchain.\n\nAs a player, you\'ll collect cards through gameplay, marketplace purchases, or special events. Build custom decks to suit your playstyle and face off against opponents in PvP matches. Win matches to earn rewards including tokens, card packs, and exclusive seasonal NFTs.\n\nAll game assets are tokenized on the NetWork blockchain, giving you true ownership of your collection. Trade cards on the integrated marketplace or export them to external NFT platforms.',
        category: 'Card Game',
        players: 12458,
        activeNow: 843,
        rating: 4.7,
        thumbnail: 'crypto_legends.jpg',
        nftCount: 50000,
        launched: '2024-12-10T00:00:00Z',
        blockchain: 'NetWork',
        developer: 'Blockchain Studios',
        website: 'https://cryptolegends.network',
        earning: true,
        earningMechanics: [
          'Daily quests reward tokens',
          'Tournament winnings in NET tokens',
          'Rare card drops can be sold on marketplace',
          'Staking rewards for card holders'
        ],
        screenshots: [
          'screenshot1.jpg',
          'screenshot2.jpg',
          'screenshot3.jpg'
        ],
        tokenomics: {
          gameToken: 'LEGEND',
          totalSupply: '100,000,000',
          circulatingSupply: '42,500,000',
          currentPrice: '0.37 NET'
        },
        systemRequirements: {
          os: 'Windows 10/11, macOS 12+, iOS 14+, Android 10+',
          processor: 'Intel i5 or equivalent',
          memory: '8 GB RAM',
          graphics: 'Integrated graphics',
          storage: '2 GB available space'
        }
      });
      setLoading(false);
    }, 1200);
  }, [gameId]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-3/4 mb-6"></div>
        <div className="h-64 bg-gray-700 rounded w-full mb-6"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!game) {
    return <div className="text-red-400">Game not found</div>;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-4">{game.title}</h2>
      
      <div className="flex flex-wrap gap-3 mb-6">
        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">{game.category}</span>
        {game.earning && (
          <span className="bg-green-900/80 text-green-400 text-xs px-2 py-1 rounded">Play to Earn</span>
        )}
        <span className="bg-purple-900/80 text-purple-400 text-xs px-2 py-1 rounded">{game.blockchain}</span>
        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">Released: {formatDate(game.launched)}</span>
      </div>
      
      <div className="h-72 bg-gray-800 rounded-lg mb-6 relative overflow-hidden">
        {/* In a real app, you would display actual screenshots or video */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/80 via-indigo-900/80 to-blue-900/80">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-white mb-2">{game.title}</h3>
            <p className="text-gray-300 max-w-md mx-auto">{game.description}</p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h4 className="text-gray-400 mb-1">Players</h4>
          <div className="text-xl font-bold text-white">{game.players.toLocaleString()}</div>
          <div className="text-green-400 text-sm">{game.activeNow} online now</div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h4 className="text-gray-400 mb-1">Rating</h4>
          <div className="flex items-center">
            <div className="text-xl font-bold text-white mr-2">{game.rating}/5.0</div>
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${i < Math.floor(game.rating) ? 'text-yellow-500' : 'text-gray-600'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
          <h4 className="text-gray-400 mb-1">Developer</h4>
          <div className="text-xl font-bold text-white">{game.developer}</div>
          <a href={game.website} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm">Visit Website</a>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-700 mb-6">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 font-medium text-sm border-b-2 transition-all ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('earning')}
            className={`py-3 font-medium text-sm border-b-2 transition-all ${
              activeTab === 'earning'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Play to Earn
          </button>
          <button
            onClick={() => setActiveTab('tokenomics')}
            className={`py-3 font-medium text-sm border-b-2 transition-all ${
              activeTab === 'tokenomics'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Tokenomics
          </button>
          <button
            onClick={() => setActiveTab('requirements')}
            className={`py-3 font-medium text-sm border-b-2 transition-all ${
              activeTab === 'requirements'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            System Requirements
          </button>
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="mb-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">About the Game</h3>
              <p className="text-gray-300 whitespace-pre-line">{game.longDescription}</p>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Screenshots</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {game.screenshots.map((screenshot, index) => (
                  <div key={index} className="h-40 bg-gray-700 rounded-lg overflow-hidden relative">
                    {/* In a real app, you would display actual screenshots */}
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/50 via-indigo-900/50 to-blue-900/50">
                      <span className="text-white">Screenshot {index + 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-semibold text-white mb-3">Leaderboard</h3>
              <GameLeaderboard gameId={game.id} token={token} />
            </div>
          </div>
        )}
        
        {activeTab === 'earning' && (
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Earning Mechanics</h3>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 mb-6">
              <p className="text-gray-300 mb-6">
                {game.title} offers multiple ways to earn cryptocurrency through gameplay. By actively participating and improving your skills, you can generate substantial rewards.
              </p>
              
              <ul className="space-y-4">
                {game.earningMechanics.map((mechanic, index) => (
                  <li key={index} className="flex items-start">
                    <div className="h-6 w-6 rounded-full bg-green-900/50 text-green-400 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-gray-300">{mechanic}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-3">Average Earnings</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Daily (casual play)</span>
                    <span className="text-green-400 font-semibold">3-5 {game.tokenomics.gameToken}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Weekly (regular play)</span>
                    <span className="text-green-400 font-semibold">25-40 {game.tokenomics.gameToken}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Monthly (competitive)</span>
                    <span className="text-green-400 font-semibold">150-300 {game.tokenomics.gameToken}</span>
                  </div>
                  <div className="border-t border-gray-700 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Current value</span>
                      <span className="text-white font-semibold">1 {game.tokenomics.gameToken} = 0.37 NET</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-3">NFT Earnings</h4>
                <p className="text-gray-300 mb-4">
                  Rare NFT cards can be sold on the marketplace, with some legendary cards fetching high prices.
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Common Cards</span>
                    <span className="text-white">0.1-1 NET</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Rare Cards</span>
                    <span className="text-white">2-10 NET</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Epic Cards</span>
                    <span className="text-white">15-50 NET</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Legendary Cards</span>
                    <span className="text-white">75-200+ NET</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'tokenomics' && (
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">Tokenomics</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-3">Token Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Token Name</span>
                    <span className="text-white font-semibold">{game.tokenomics.gameToken}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Supply</span>
                    <span className="text-white">{game.tokenomics.totalSupply}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Circulating Supply</span>
                    <span className="text-white">{game.tokenomics.circulatingSupply}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Current Price</span>
                    <span className="text-green-400">{game.tokenomics.currentPrice}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Blockchain</span>
                    <span className="text-white">{game.blockchain}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-3">Token Utility</h4>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    Purchase premium card packs and special items
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    Entry fees for tournaments with larger prize pools
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    Stake tokens to earn passive rewards and exclusive items
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    Governance voting rights for game updates and features
                  </li>
                  <li className="flex items-start">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                    </svg>
                    Trade with other players for cards and in-game assets
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-white mb-4">Token Distribution</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64 rounded-lg bg-gray-900/50 flex items-center justify-center">
                  {/* In a real app, this would be a chart */}
                  <div className="text-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                    Token Distribution Chart
                  </div>
                </div>
                
                <div>
                  <ul className="space-y-3">
                    <li className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></div>
                        <span className="text-gray-300">Play-to-earn Rewards</span>
                      </div>
                      <span className="text-white">40%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                        <span className="text-gray-300">Development & Operations</span>
                      </div>
                      <span className="text-white">20%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        <span className="text-gray-300">Team & Advisors</span>
                      </div>
                      <span className="text-white">15%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-gray-300">Liquidity Pool</span>
                      </div>
                      <span className="text-white">10%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                        <span className="text-gray-300">Marketing</span>
                      </div>
                      <span className="text-white">10%</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                        <span className="text-gray-300">Community & Airdrops</span>
                      </div>
                      <span className="text-white">5%</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'requirements' && (
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">System Requirements</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-3">Minimum Requirements</h4>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <span className="text-gray-400 w-24 flex-shrink-0">OS:</span>
                    <span className="text-white">{game.systemRequirements.os}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-400 w-24 flex-shrink-0">Processor:</span>
                    <span className="text-white">{game.systemRequirements.processor}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-400 w-24 flex-shrink-0">Memory:</span>
                    <span className="text-white">{game.systemRequirements.memory}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-400 w-24 flex-shrink-0">Graphics:</span>
                    <span className="text-white">{game.systemRequirements.graphics}</span>
                  </div>
                  <div className="flex items-start">
                    <span className="text-gray-400 w-24 flex-shrink-0">Storage:</span>
                    <span className="text-white">{game.systemRequirements.storage}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-3">Blockchain Requirements</h4>
                <div className="space-y-4">
                  <p className="text-gray-300">
                    To fully enjoy the game and its blockchain features, you'll need:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-300">A NetWork wallet (available through this platform)</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-300">A small amount of NET for transaction fees</span>
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400 mr-2 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-300">MetaMask or a compatible browser extension (for web version)</span>
                    </li>
                  </ul>
                  
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Download Game
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700">
        <div>
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded mr-3 transition-colors">
            Add to Favorites
          </button>
          <button className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors">
            Share
          </button>
        </div>
        
        <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded hover:from-indigo-500 hover:to-purple-500 transition-colors shadow-lg shadow-purple-900/30 relative overflow-hidden group">
          <span className="relative z-10">Play Now</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
        </button>
      </div>
    </div>
  );
};

export default GameDetail;