import React, { useState, useEffect } from 'react';

const GameWallet = ({ token }) => {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');
  
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      setWallet({
        netToken: 357.82,
        balances: [
          { token: 'LEGEND', balance: 1824.5, usdValue: 675.07 },
          { token: 'RACE', balance: 428.3, usdValue: 214.15 },
          { token: 'BATTLE', balance: 156.7, usdValue: 94.02 },
          { token: 'CREATURE', balance: 312.4, usdValue: 187.44 }
        ],
        totalValue: 1528.50,
        netAddress: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t',
        earnings: {
          day: 12.4,
          week: 78.6,
          month: 312.5
        }
      });
      
      setTransactions([
        {
          id: 'tx-001',
          type: 'Earning',
          game: 'Crypto Legends',
          token: 'LEGEND',
          amount: 24.5,
          timestamp: '2025-03-30T10:15:00Z',
          description: 'Tournament Reward',
          txHash: '0x8a21d6b59be7f3a4582d8f81be076e6e5c664d0c142bb456743cb66e6ab53b29'
        },
        {
          id: 'tx-002',
          type: 'Purchase',
          game: 'Crypto Legends',
          token: 'NET',
          amount: -15.0,
          timestamp: '2025-03-29T14:22:00Z',
          description: 'Premium Card Pack',
          txHash: '0x3a58d9b2d704c839189321ef832f4d43a69f18f168fb9f0225127d0a5a749572'
        },
        {
          id: 'tx-003',
          type: 'Earning',
          game: 'Metaverse Racing',
          token: 'RACE',
          amount: 18.2,
          timestamp: '2025-03-28T18:05:00Z',
          description: 'Race Victory',
          txHash: '0x9f4b2d1a5e6f8c3d7b0a4e5d6f0c9b8a7d6e5f4a3b2c1d0e9f8b7a6c5d4e3f2a1'
        },
        {
          id: 'tx-004',
          type: 'Swap',
          game: null,
          token: 'RACE',
          amount: -100.0,
          token2: 'NET',
          amount2: 45.2,
          timestamp: '2025-03-28T12:30:00Z',
          description: 'Token Swap',
          txHash: '0x1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3'
        },
        {
          id: 'tx-005',
          type: 'Earning',
          game: 'Blockchain Battles',
          token: 'BATTLE',
          amount: 12.5,
          timestamp: '2025-03-27T09:15:00Z',
          description: 'Territory Control Rewards',
          txHash: '0x2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f'
        },
        {
          id: 'tx-006',
          type: 'Sale',
          game: 'Crypto Creatures',
          token: 'NET',
          amount: 65.0,
          timestamp: '2025-03-26T15:45:00Z',
          description: 'Sold Rare Ice Elemental',
          txHash: '0x3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a'
        },
        {
          id: 'tx-007',
          type: 'Earning',
          game: 'Crypto Legends',
          token: 'LEGEND',
          amount: 16.8,
          timestamp: '2025-03-25T11:20:00Z',
          description: 'Daily Quest Rewards',
          txHash: '0x4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b'
        }
      ]);
      
      setLoading(false);
    }, 1000);
  }, [token]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'Earning':
        return 'text-green-400';
      case 'Purchase':
        return 'text-red-400';
      case 'Sale':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
          </svg>
        );
      case 'Swap':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const filterTransactions = () => {
    if (period === 'all') return transactions;
    
    const now = new Date();
    let cutoff = new Date();
    
    if (period === 'day') {
      cutoff.setDate(now.getDate() - 1);
    } else if (period === 'week') {
      cutoff.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      cutoff.setMonth(now.getMonth() - 1);
    }
    
    return transactions.filter(tx => new Date(tx.timestamp) >= cutoff);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-48 mb-6"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="h-64 bg-gray-800/30 border border-gray-700 rounded-lg"></div>
          <div className="h-64 bg-gray-800/30 border border-gray-700 rounded-lg"></div>
        </div>
        
        <div className="h-6 bg-gray-700 rounded w-32 mb-4"></div>
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg h-64"></div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="text-center py-12">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        <h3 className="text-xl font-semibold text-white mb-2">No Wallet Connected</h3>
        <p className="text-gray-400 mb-6">Connect your wallet to see your game tokens and transaction history.</p>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors">
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-6">Gaming Wallet</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="text-gray-400 mb-1">Total Value</h4>
              <div className="text-3xl font-bold text-white">${wallet.totalValue.toFixed(2)}</div>
              <div className="text-green-400 text-sm mt-1">+${wallet.earnings[period].toFixed(2)} this {period}</div>
            </div>
            <div className="flex space-x-2">
              <button 
                className={`px-2 py-1 text-xs rounded ${period === 'day' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                onClick={() => setPeriod('day')}
              >
                1D
              </button>
              <button 
                className={`px-2 py-1 text-xs rounded ${period === 'week' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                onClick={() => setPeriod('week')}
              >
                1W
              </button>
              <button 
                className={`px-2 py-1 text-xs rounded ${period === 'month' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                onClick={() => setPeriod('month')}
              >
                1M
              </button>
              <button 
                className={`px-2 py-1 text-xs rounded ${period === 'all' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}
                onClick={() => setPeriod('all')}
              >
                All
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            {wallet.balances.map((balance, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 mr-3 flex items-center justify-center text-white font-bold">
                    {balance.token.charAt(0)}
                  </div>
                  <div>
                    <div className="text-white">{balance.token}</div>
                    <div className="text-xs text-gray-400">${balance.usdValue.toFixed(2)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-white font-medium">{balance.balance.toLocaleString()}</div>
                  <div className="text-xs text-gray-400">Tokens</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-white">NET Balance</h4>
              <div className="text-xl font-bold text-white">{wallet.netToken.toLocaleString()} NET</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors">
                Deposit
              </button>
              <button className="py-2 bg-green-600 hover:bg-green-500 text-white rounded transition-colors">
                Withdraw
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 flex flex-col">
          <h4 className="text-lg font-semibold text-white mb-4">Your Gaming Wallet</h4>
          
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
                <div className="text-sm text-gray-400 mb-1">Wallet Address</div>
                <div className="flex justify-between items-center">
                  <div className="text-white font-mono">
                    {wallet.netAddress.substring(0, 6)}...{wallet.netAddress.substring(wallet.netAddress.length - 4)}
                  </div>
                  <button className="text-indigo-400 hover:text-indigo-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                      <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Blockchain</div>
                <div className="flex items-center">
                  <div className="w-5 h-5 rounded-full bg-indigo-900 mr-2"></div>
                  <div className="text-white">NetWork Blockchain</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">Secured by proof-of-stake consensus</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mt-6">
              <button className="py-2 px-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm">
                Token Swap
              </button>
              <button className="py-2 px-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm">
                Send Tokens
              </button>
              <button className="py-2 px-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm">
                Explorer
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <h4 className="text-lg font-semibold text-white mb-4">Transaction History</h4>
      
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-800/50">
                <th className="py-3 px-4 text-left text-gray-400 font-medium">Type</th>
                <th className="py-3 px-4 text-left text-gray-400 font-medium">Description</th>
                <th className="py-3 px-4 text-left text-gray-400 font-medium">Game</th>
                <th className="py-3 px-4 text-right text-gray-400 font-medium">Amount</th>
                <th className="py-3 px-4 text-right text-gray-400 font-medium">Date</th>
                <th className="py-3 px-4 text-center text-gray-400 font-medium">Tx Info</th>
              </tr>
            </thead>
            <tbody>
              {filterTransactions().map((tx, index) => (
                <tr key={tx.id} className={`${index % 2 === 0 ? 'bg-gray-800/20' : ''} hover:bg-indigo-900/10`}>
                  <td className="py-3 px-4">
                    <div className={`flex items-center ${getTransactionColor(tx.type)}`}>
                      <div className="w-8 h-8 rounded-full bg-gray-800/80 mr-3 flex items-center justify-center">
                        {getTransactionIcon(tx.type)}
                      </div>
                      {tx.type}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-white">{tx.description}</td>
                  <td className="py-3 px-4 text-indigo-400">{tx.game || '-'}</td>
                  <td className="py-3 px-4 text-right">
                    <div className={tx.amount > 0 ? 'text-green-400' : 'text-red-400'}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount} {tx.token}
                    </div>
                    {tx.token2 && (
                      <div className="text-green-400">
                        +{tx.amount2} {tx.token2}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-right">{formatDate(tx.timestamp)}</td>
                  <td className="py-3 px-4 text-center">
                    <a 
                      href={`https://explorer.network.io/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 inline-block"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                      </svg>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filterTransactions().length === 0 && (
          <div className="text-center py-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h4 className="text-white mb-1">No transactions found</h4>
            <p className="text-gray-400">No transactions in the selected period.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameWallet;