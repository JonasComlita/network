// components/forum/ForumThread.js
import React, { useState, useEffect } from 'react';

const ForumThread = ({ threadId, token, blockchainData }) => {
  const [thread, setThread] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Simulate API fetch for thread data
    setTimeout(() => {
      // In a real app, you would fetch data for the specific threadId
      setThread({
        id: threadId,
        title: 'Blockchain Scalability Solutions',
        content: 'As our network grows, we need to explore various scalability solutions to ensure transaction throughput remains high while keeping fees low. Some options include:\n\n1. Layer 2 scaling solutions like state channels and sidechains\n2. Sharding the blockchain to process transactions in parallel\n3. Optimizing the consensus algorithm for better performance\n4. Implementing zero-knowledge proofs for transaction batching\n\nWhat are your thoughts on these approaches? Do you have experience implementing any of these in other blockchain networks?',
        author: 'cryptodev',
        category: 'Technical',
        created_at: '2025-03-28T10:15:00Z',
        updated_at: '2025-03-28T10:15:00Z',
        views: 1268,
        pinned: true,
        blockchain_verified: true,
        transaction_hash: '0x3a58d9b2d704c839189321ef832f4d43a69f18f168fb9f0225127d0a5a749572'
      });
      
      setReplies([
        {
          id: 1,
          content: 'I\'ve worked with state channels in the past, and they excel for applications with frequent transactions between the same parties. For instance, our gaming platform uses state channels, and it\'s reduced on-chain transactions by 90% while keeping the security guarantees intact.',
          author: 'network_architect',
          created_at: '2025-03-28T11:30:00Z',
          updated_at: '2025-03-28T11:30:00Z',
          blockchain_verified: true,
          upvotes: 15,
          transaction_hash: '0x4b2d1a5e6f8c3d7b0a4e5d6f0c9b8a7d6e5f4a3b2c1d0e9f8b7a6c5d4e3f2a1'
        },
        {
          id: 2,
          content: 'Sharding is promising but introduces significant complexity in cross-shard communication. We implemented a version in our testnet and saw a 5x throughput increase, but the trade-off was occasional delays for cross-shard transactions. Still worth exploring though!',
          author: 'consensus_builder',
          created_at: '2025-03-28T13:45:00Z',
          updated_at: '2025-03-28T13:45:00Z',
          blockchain_verified: true,
          upvotes: 8,
          transaction_hash: '0x5c3e2f1d0b9a8c7e6f5d4e3f2d1c0b9a8e7f6d5e4f3d2c1b0a9f8e7d6c5b4a3f2'
        },
        {
          id: 3,
          content: 'Zero-knowledge proofs are definitely the most exciting option to me. ZK-rollups can bundle thousands of transactions into a single proof, and the verification is still cryptographically secure. The downside is the computational complexity of generating the proofs, but with specialized hardware, this is becoming less of an issue.',
          author: 'cryptography_enthusiast',
          created_at: '2025-03-29T09:20:00Z',
          updated_at: '2025-03-29T09:20:00Z',
          blockchain_verified: true,
          upvotes: 21,
          transaction_hash: '0x6d4e3f2c1b0a9d8e7f6g5h4i3j2k1l0m9n8o7p6q5r4s3t2u1v0w9x8y7z6a5'
        },
        {
          id: 4,
          content: 'Has anyone looked into Validium chains? They use validity proofs like ZK-rollups but store data off-chain. This approach can potentially achieve even higher throughput, though with some additional trust assumptions for data availability.',
          author: 'scaling_researcher',
          created_at: '2025-03-29T16:10:00Z',
          updated_at: '2025-03-29T16:10:00Z',
          blockchain_verified: true,
          upvotes: 7,
          transaction_hash: '0x7e5f4g3h2i1j0k9l8m7n6o5p4q3r2s1t0u9v8w7x6y5z4a3b2c1d0e9f8g7h6'
        },
        {
          id: 5,
          content: 'I think we should also consider optimizing the base layer before adding complexity with L2 solutions. Simple improvements like transaction batching, better signature schemes (e.g., Schnorr), and optimized VM execution can go a long way.',
          author: 'blockchain_optimizer',
          created_at: '2025-03-30T08:45:00Z',
          updated_at: '2025-03-30T08:45:00Z',
          blockchain_verified: true,
          upvotes: 12,
          transaction_hash: '0x8f6g5h4i3j2k1l0m9n8o7p6q5r4s3t2u1v0w9x8y7z6a5b4c3d2e1f0g9h8i7'
        }
      ]);
      
      setLoading(false);
    }, 1000);
  }, [threadId]);

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

  const handleSubmitReply = (e) => {
    e.preventDefault();
    
    if (!replyText.trim()) return;
    
    setSubmitting(true);
    
    // Simulate API call to post reply
    setTimeout(() => {
      // In a real app, you would post to your API and get the response
      const newReply = {
        id: Date.now(),
        content: replyText,
        author: 'current_user', // In a real app, this would be the authenticated user
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        blockchain_verified: true,
        upvotes: 0,
        transaction_hash: `0x${Math.random().toString(16).substring(2, 64)}`
      };
      
      setReplies([...replies, newReply]);
      setReplyText('');
      setSubmitting(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-3/4 mb-6"></div>
        <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-6"></div>
        
        <div className="h-6 bg-gray-700 rounded w-32 my-6"></div>
        
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-800/50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-700 mr-3"></div>
                <div className="h-4 bg-gray-700 rounded w-24"></div>
              </div>
              <div className="h-4 bg-gray-700 rounded w-16"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!thread) {
    return <div className="text-red-400">Thread not found</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">{thread.title}</h2>
        
        <div className="flex flex-wrap items-center text-sm text-gray-400 mb-4">
          <div className="flex items-center mr-4">
            <div className="w-6 h-6 rounded-full bg-indigo-900 flex items-center justify-center text-white text-xs mr-2">
              {thread.author.charAt(0).toUpperCase()}
            </div>
            <span className="text-indigo-400">{thread.author}</span>
          </div>
          <div className="mr-4">{formatDate(thread.created_at)}</div>
          <div className="flex items-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            {thread.views} views
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            {replies.length} replies
          </div>
          
          {thread.blockchain_verified && (
            <div className="ml-auto flex items-center text-xs text-indigo-400 bg-indigo-900/30 px-2 py-1 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Blockchain Verified</span>
            </div>
          )}
        </div>
        
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 mb-6">
          <div className="prose prose-dark prose-invert max-w-none text-gray-300">
            <p>{thread.content}</p>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-700 flex items-center justify-between">
            <div className="flex space-x-2">
              <button className="flex items-center text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                Upvote
              </button>
              <button className="flex items-center text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
                </svg>
                Downvote
              </button>
              <button className="flex items-center text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clipRule="evenodd" />
                </svg>
                Share
              </button>
            </div>
            
            <a 
              href={`https://explorer.network.io/tx/${thread.transaction_hash}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
              </svg>
              View on Blockchain
            </a>
          </div>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-4">Replies ({replies.length})</h3>
      
      {replies.map((reply) => (
        <div key={reply.id} className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-indigo-900 flex items-center justify-center text-white mr-3">
                {reply.author.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-indigo-400">{reply.author}</div>
                <div className="text-xs text-gray-500">{formatTimeAgo(reply.created_at)}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <button className="text-gray-400 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                </button>
                <span className="text-gray-400">{reply.upvotes}</span>
              </div>
              
              {reply.blockchain_verified && (
                <div className="text-xs text-indigo-400 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Verified</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="prose prose-dark prose-invert max-w-none text-gray-300">
            <p>{reply.content}</p>
          </div>
          
          <div className="mt-4 flex space-x-3 text-sm">
            <button className="text-gray-400 hover:text-white">Reply</button>
            <button className="text-gray-400 hover:text-white">Quote</button>
          </div>
        </div>
      ))}
      
      <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 mt-8">
        <h4 className="text-lg font-semibold text-white mb-4">Post a Reply</h4>
        
        <form onSubmit={handleSubmitReply}>
          <div className="mb-4">
            <textarea
              className="w-full px-4 py-2 rounded-lg border bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              placeholder="Write your reply..."
              rows="5"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              required
            ></textarea>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-400">
              All replies are verified and stored on the blockchain
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={submitting || !replyText.trim()}
            >
              {submitting ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForumThread;