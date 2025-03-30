// components/gaming/NFTInventory.js
import React, { useState, useEffect } from 'react';

const NFTInventory = ({ token }) => {
  const [nfts, setNfts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [view, setView] = useState('grid');

  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      const sampleNfts = [
        {
          id: 'nft-001',
          name: 'Legendary Dragon Card',
          game: 'Crypto Legends',
          type: 'Card',
          rarity: 'Legendary',
          image: 'dragon_card.jpg',
          attributes: [
            { trait: 'Attack', value: 85 },
            { trait: 'Defense', value: 70 },
            { trait: 'Magic', value: 90 }
          ],
          acquiredAt: '2025-02-15T08:42:00Z',
          lastPrice: 125,
          tokenId: '42',
          contractAddress: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
          blockchain: 'NetWork'
        },
        {
          id: 'nft-002',
          name: 'Hypersonic Racer',
          game: 'Metaverse Racing',
          type: 'Vehicle',
          rarity: 'Epic',
          image: 'hypersonic_racer.jpg',
          attributes: [
            { trait: 'Speed', value: 92 },
            { trait: 'Acceleration', value: 88 },
            { trait: 'Handling', value: 75 }
          ],
          acquiredAt: '2025-01-30T14:22:00Z',
          lastPrice: 85,
          tokenId: '157',
          contractAddress: '0x9s8r7q6p5o4n3m2l1k0j9i8h7g6f5e4d3c2b1a',
          blockchain: 'NetWork'
        },
        {
          id: 'nft-003',
          name: 'Ancient Wizard',
          game: 'Crypto Legends',
          type: 'Card',
          rarity: 'Epic',
          image: 'ancient_wizard.jpg',
          attributes: [
            { trait: 'Attack', value: 60 },
            { trait: 'Defense', value: 55 },
            { trait: 'Magic', value: 95 }
          ],
          acquiredAt: '2025-03-10T18:05:00Z',
          lastPrice: 65,
          tokenId: '89',
          contractAddress: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
          blockchain: 'NetWork'
        },
        {
          id: 'nft-004',
          name: 'Tactical Base',
          game: 'Blockchain Battles',
          type: 'Building',
          rarity: 'Rare',
          image: 'tactical_base.jpg',
          attributes: [
            { trait: 'Defense', value: 85 },
            { trait: 'Production', value: 70 },
            { trait: 'Storage', value: 80 }
          ],
          acquiredAt: '2025-02-28T10:11:00Z',
          lastPrice: 42,
          tokenId: '215',
          contractAddress: '0x2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a',
          blockchain: 'NetWork'
        },
        {
          id: 'nft-005',
          name: 'Frost Titan',
          game: 'Crypto Creatures',
          type: 'Creature',
          rarity: 'Epic',
          image: 'frost_titan.jpg',
          attributes: [
            { trait: 'Power', value: 88 },
            { trait: 'Health', value: 92 },
            { trait: 'Special', value: 75 }
          ],
          acquiredAt: '2025-03-22T09:18:00Z',
          lastPrice: 78,
          tokenId: '134',
          contractAddress: '0x3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b',
          blockchain: 'NetWork'
        },
        {
          id: 'nft-006',
          name: 'Energy Shield Tower',
          game: 'Decentraland Defenders',
          type: 'Defense',
          rarity: 'Rare',
          image: 'energy_shield.jpg',
          attributes: [
            { trait: 'Shield', value: 90 },
            { trait: 'Range', value: 60 },
            { trait: 'Duration', value: 75 }
          ],
          acquiredAt: '2025-03-05T16:45:00Z',
          lastPrice: 35,
          tokenId: '78',
          contractAddress: '0x4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1a2b3c',
          blockchain: 'NetWork'
        }
      ];
      
      setNfts(sampleNfts);
      setLoading(false);
    }, 1200);
  }, [token]);

  const filterNfts = () => {
    if (filter === 'all') return nfts;
    return nfts.filter(nft => {
      if (filter === 'legendary') return nft.rarity === 'Legendary';
      if (filter === 'epic') return nft.rarity === 'Epic';
      if (filter === 'rare') return nft.rarity === 'Rare';
      if (filter === 'cards') return nft.type === 'Card';
      if (filter === 'creatures') return nft.type === 'Creature';
      if (filter === 'vehicles') return nft.type === 'Vehicle';
      if (filter === 'buildings') return nft.type === 'Building' || nft.type === 'Defense';
      return true;
    });
  };

  const sortNfts = (filteredNfts) => {
    if (sortBy === 'recent') {
      return [...filteredNfts].sort((a, b) => new Date(b.acquiredAt) - new Date(a.acquiredAt));
    }
    if (sortBy === 'oldest') {
      return [...filteredNfts].sort((a, b) => new Date(a.acquiredAt) - new Date(b.acquiredAt));
    }
    if (sortBy === 'price-high') {
      return [...filteredNfts].sort((a, b) => b.lastPrice - a.lastPrice);
    }
    if (sortBy === 'price-low') {
      return [...filteredNfts].sort((a, b) => a.lastPrice - b.lastPrice);
    }
    if (sortBy === 'rarity') {
      const rarityOrder = { 'Legendary': 0, 'Epic': 1, 'Rare': 2, 'Uncommon': 3, 'Common': 4 };
      return [...filteredNfts].sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
    }
    return filteredNfts;
  };

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleView = () => {
    setView(view === 'grid' ? 'list' : 'grid');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'Legendary':
        return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50';
      case 'Epic':
        return 'text-purple-400 bg-purple-900/30 border-purple-700/50';
      case 'Rare':
        return 'text-blue-400 bg-blue-900/30 border-blue-700/50';
      case 'Uncommon':
        return 'text-green-400 bg-green-900/30 border-green-700/50';
      default:
        return 'text-gray-400 bg-gray-900/30 border-gray-700/50';
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">NFT Inventory</h3>
          <div className="flex space-x-2 animate-pulse">
            <div className="h-8 w-32 bg-gray-700 rounded"></div>
            <div className="h-8 w-32 bg-gray-700 rounded"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-700"></div>
              <div className="p-4">
                <div className="h-6 bg-gray-700 rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-700 rounded w-full mb-1"></div>
                <div className="h-4 bg-gray-700 rounded w-full mb-3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const displayNfts = sortNfts(filterNfts());

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h3 className="text-xl font-semibold text-white">NFT Inventory ({nfts.length} items)</h3>
        
        <div className="flex flex-wrap gap-2">
          <select 
            className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500/20 transition-colors"
            value={filter}
            onChange={handleFilterChange}
          >
            <option value="all">All NFTs</option>
            <option value="legendary">Legendary</option>
            <option value="epic">Epic</option>
            <option value="rare">Rare</option>
            <option value="cards">Cards</option>
            <option value="creatures">Creatures</option>
            <option value="vehicles">Vehicles</option>
            <option value="buildings">Buildings & Defenses</option>
          </select>
          
          <select 
            className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-indigo-500 focus:ring focus:ring-indigo-500/20 transition-colors"
            value={sortBy}
            onChange={handleSortChange}
          >
            <option value="recent">Most Recent</option>
            <option value="oldest">Oldest First</option>
            <option value="price-high">Highest Value</option>
            <option value="price-low">Lowest Value</option>
            <option value="rarity">Rarity</option>
          </select>
          
          <button
            className="bg-gray-900 border border-gray-700 rounded-lg p-2 text-white text-sm focus:border-indigo-500 hover:bg-gray-800 transition-colors"
            onClick={toggleView}
          >
            {view === 'grid' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {displayNfts.length === 0 ? (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h4 className="text-xl font-semibold text-white mb-2">No NFTs Found</h4>
          <p className="text-gray-400 mb-6">No NFTs match your current filter criteria.</p>
          <button 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
            onClick={() => setFilter('all')}
          >
            View All NFTs
          </button>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayNfts.map((nft) => (
            <div 
              key={nft.id}
              className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden hover:border-indigo-500/50 transition-colors"
            >
              <div className="h-48 bg-gray-700 relative overflow-hidden">
                {/* In a real app, you would use actual images */}
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/80 via-indigo-900/80 to-blue-900/80">
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white">{nft.name}</h3>
                    <p className="text-gray-300">{nft.game}</p>
                  </div>
                </div>
                
                <div className={`absolute top-2 right-2 ${getRarityColor(nft.rarity)} text-xs px-2 py-1 rounded border`}>
                  {nft.rarity}
                </div>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-white font-medium">{nft.name}</h4>
                    <p className="text-indigo-400 text-sm">{nft.game}</p>
                  </div>
                  <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">{nft.type}</span>
                </div>
                
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {nft.attributes.map((attr, index) => (
                    <div key={index} className="bg-gray-800 rounded p-2 text-center">
                      <div className="text-xs text-gray-400">{attr.trait}</div>
                      <div className="text-white font-medium">{attr.value}</div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-700/50 flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Acquired: {formatDate(nft.acquiredAt)}
                  </div>
                  <div className="text-green-400 font-medium">
                    {nft.lastPrice} NET
                  </div>
                </div>
                
                <div className="mt-3 flex space-x-2">
                  <button className="flex-1 py-1.5 bg-indigo-600/80 hover:bg-indigo-500/80 text-white text-sm rounded transition-colors">
                    Use in Game
                  </button>
                  <button className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors">
                    Transfer
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-800/50">
                  <th className="py-3 px-4 text-left text-gray-400 font-medium">NFT</th>
                  <th className="py-3 px-4 text-left text-gray-400 font-medium">Game</th>
                  <th className="py-3 px-4 text-left text-gray-400 font-medium">Type</th>
                  <th className="py-3 px-4 text-left text-gray-400 font-medium">Rarity</th>
                  <th className="py-3 px-4 text-right text-gray-400 font-medium">Value</th>
                  <th className="py-3 px-4 text-right text-gray-400 font-medium">Acquired</th>
                  <th className="py-3 px-4 text-center text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayNfts.map((nft, index) => (
                  <tr key={nft.id} className={`${index % 2 === 0 ? 'bg-gray-800/20' : ''} hover:bg-indigo-900/10`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-900 to-indigo-900 rounded mr-3 flex items-center justify-center text-white font-bold">
                          {nft.name.charAt(0)}
                        </div>
                        <span className="text-white">{nft.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-indigo-400">{nft.game}</td>
                    <td className="py-3 px-4 text-gray-300">{nft.type}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-1 rounded text-xs ${getRarityColor(nft.rarity)}`}>
                        {nft.rarity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-green-400 text-right">{nft.lastPrice} NET</td>
                    <td className="py-3 px-4 text-gray-400 text-right">{formatDate(nft.acquiredAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center space-x-2">
                        <button className="p-1.5 bg-indigo-600/80 hover:bg-indigo-500/80 text-white text-xs rounded transition-colors">
                          Use
                        </button>
                        <button className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors">
                          Transfer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTInventory;