// components/forum/PopularThreads.js
import React, { useState, useEffect } from 'react';

const PopularThreads = ({ onSelectThread, token }) => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch with sample data
    setTimeout(() => {
      setThreads([
        {
          id: 201,
          title: 'How to optimize gas fees on Network blockchain',
          category: 'Technical',
          replies: 42,
          views: 1268,
          lastReply: '2025-03-29T14:22:00Z',
          author: 'gas_optimizer',
          lastReplyAuthor: 'blockchain_dev',
        },
        {
          id: 202,
          title: 'Network Token Staking Guide for Beginners',
          category: 'Staking',
          replies: 56,
          views: 2180,
          lastReply: '2025-03-30T08:45:00Z',
          author: 'staking_guru',
          lastReplyAuthor: 'network_newbie',
        },
        {
          id: 203,
          title: 'DeFi Integration with Network Blockchain',
          category: 'DeFi',
          replies: 31,
          views: 987,
          lastReply: '2025-03-29T18:33:00Z',
          author: 'defi_integrator',
          lastReplyAuthor: 'yield_farmer',
        },
        {
          id: 204,
          title: 'Building NFT Marketplaces on Network',
          category: 'Gaming',
          replies: 47,
          views: 1586,
          lastReply: '2025-03-30T11:17:00Z',
          author: 'nft_creator',
          lastReplyAuthor: 'marketplace_dev',
        },
        {
          id: 205,
          title: 'Governance Proposal: Community Fund Allocation',
          category: 'Governance',
          replies: 89,
          views: 3240,
          lastReply: '2025-03-30T09:05:00Z',
          author: 'governance_lead',
          lastReplyAuthor: 'community_voter',
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-start">
            <div className="h-10 w-10 bg-gray-700 rounded-full mr-3"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-700 rounded w-5/6 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {threads.map((thread) => (
        <div 
          key={thread.id}
          className="flex items-start cursor-pointer hover:bg-gray-800/50 p-2 rounded transition-colors"
          onClick={() => onSelectThread(thread.id)}
        >
          <div className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-400 text-sm font-medium mr-3 flex-shrink-0">
            {thread.category.charAt(0)}
          </div>
          <div>
            <h4 className="text-sm text-white font-medium line-clamp-2 mb-1">{thread.title}</h4>
            <div className="flex items-center text-xs text-gray-500">
              <span>{thread.replies} replies</span>
              <span className="mx-2">•</span>
              <span>{formatTimeAgo(thread.lastReply)}</span>
            </div>
          </div>
        </div>
      ))}
      
      <div className="pt-3 mt-3 border-t border-gray-700">
        <button 
          className="text-sm text-indigo-400 hover:text-indigo-300"
          onClick={() => onSelectThread && onSelectThread(0)}
        >
          View All Threads
        </button>
      </div>
    </div>
  );
};

export default PopularThreads;