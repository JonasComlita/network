// components/forum/ForumTopicList.js
import React, { useState, useEffect } from 'react';

const ForumTopicList = ({ onSelectThread, token }) => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API fetch with sample data
    setTimeout(() => {
      setTopics([
        {
          id: 1,
          title: 'Blockchain Scalability Solutions',
          category: 'Technical',
          replies: 42,
          views: 1268,
          lastReply: '2025-03-28T10:15:00Z',
          author: 'cryptodev',
          lastReplyAuthor: 'consensus_builder',
          pinned: true
        },
        {
          id: 2,
          title: 'Layer 2 vs Sharding: Pros and Cons',
          category: 'Technical',
          replies: 37,
          views: 892,
          lastReply: '2025-03-29T14:22:00Z',
          author: 'networkarchitect',
          lastReplyAuthor: 'network_validator',
          pinned: true
        },
        {
          id: 3,
          title: 'The Future of DeFi on NetWork',
          category: 'DeFi',
          replies: 64,
          views: 2157,
          lastReply: '2025-03-30T08:45:00Z',
          author: 'defi_enthusiast',
          lastReplyAuthor: 'yield_optimizer',
          pinned: false
        },
        {
          id: 4,
          title: 'Gaming NFTs: Use Cases and Integration',
          category: 'Gaming',
          replies: 29,
          views: 746,
          lastReply: '2025-03-29T18:33:00Z',
          author: 'game_designer',
          lastReplyAuthor: 'nft_collector',
          pinned: false
        },
        {
          id: 5,
          title: 'Cross-Chain Bridges: Security Considerations',
          category: 'Security',
          replies: 51,
          views: 1423,
          lastReply: '2025-03-30T05:17:00Z',
          author: 'security_expert',
          lastReplyAuthor: 'ethbridger',
          pinned: false
        },
        {
          id: 6,
          title: 'Governance Proposals for Q2 2025',
          category: 'Governance',
          replies: 35,
          views: 892,
          lastReply: '2025-03-29T11:42:00Z',
          author: 'dao_member',
          lastReplyAuthor: 'token_holder',
          pinned: false
        },
        {
          id: 7,
          title: 'NetWork Token Staking Strategies',
          category: 'Staking',
          replies: 47,
          views: 1286,
          lastReply: '2025-03-28T16:05:00Z',
          author: 'staking_pro',
          lastReplyAuthor: 'yield_farmer',
          pinned: false
        },
        {
          id: 8,
          title: 'Community Meetup: Virtual Event April 2025',
          category: 'Community',
          replies: 24,
          views: 654,
          lastReply: '2025-03-27T09:25:00Z',
          author: 'community_lead',
          lastReplyAuthor: 'net_developer',
          pinned: false
        }
      ]);
      setLoading(false);
    }, 800);
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

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
      <div className="flex justify-center items-center py-8">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-700 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded"></div>
              <div className="h-4 bg-gray-700 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {topics.map((topic) => (
        <div 
          key={topic.id}
          className={`p-4 rounded-lg transition-all duration-200 cursor-pointer hover:bg-gray-800 ${topic.pinned ? 'bg-indigo-900/20 border border-indigo-800/50' : 'bg-gray-800/50 border border-gray-700'}`}
          onClick={() => onSelectThread(topic.id)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                {topic.pinned && (
                  <span className="bg-indigo-500 text-xs px-2 py-1 rounded text-white">Pinned</span>
                )}
                <span className="bg-gray-700 text-xs px-2 py-1 rounded text-gray-300">{topic.category}</span>
              </div>
              <h4 className="text-lg font-medium mt-2 text-white">{topic.title}</h4>
              <div className="text-sm text-gray-400 mt-1">
                Started by <span className="text-indigo-400">{topic.author}</span>
              </div>
            </div>
            <div className="text-right text-sm text-gray-400">
              <div>{topic.replies} replies</div>
              <div>{topic.views} views</div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-700/50 text-xs text-gray-500">
            <div>
              Last reply by <span className="text-indigo-400">{topic.lastReplyAuthor}</span>
            </div>
            <div>{formatTimeAgo(topic.lastReply)}</div>
          </div>
          
          {/* Blockchain verification indicator */}
          <div className="mt-2 flex justify-end">
            <div className="flex items-center text-xs text-gray-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Blockchain Verified</span>
            </div>
          </div>
        </div>
      ))}
      
      <div className="flex justify-between items-center mt-6 pt-4 text-sm">
        <div className="text-gray-400">
          Showing {topics.length} topics
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-1 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 transition-colors">
            Previous
          </button>
          <button className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors">
            1
          </button>
          <button className="px-3 py-1 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 transition-colors">
            2
          </button>
          <button className="px-3 py-1 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 transition-colors">
            3
          </button>
          <button className="px-3 py-1 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForumTopicList;