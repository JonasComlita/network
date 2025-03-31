// components/forum/ForumSearch.js
import React, { useState } from 'react';

const ForumSearch = ({ onSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setSearchResults(null);
    
    // Simulate API call for search
    setTimeout(() => {
      // In a real app, you would fetch search results from your API
      const results = [
        {
          id: 101,
          title: 'Advanced Blockchain Scalability Solutions',
          category: 'Technical',
          author: 'blockchain_expert',
          created_at: '2025-03-25T14:22:00Z',
          replies: 18,
          views: 342,
          relevance: 0.95
        },
        {
          id: 102,
          title: 'Comparing Sharding Solutions for Network',
          category: 'Technical',
          author: 'distributed_systems',
          created_at: '2025-03-20T09:15:00Z',
          replies: 24,
          views: 418,
          relevance: 0.85
        },
        {
          id: 103,
          title: 'Best Practices for Scalable Smart Contracts',
          category: 'Development',
          author: 'smart_contract_dev',
          created_at: '2025-03-18T16:40:00Z',
          replies: 12,
          views: 276,
          relevance: 0.78
        }
      ];
      
      setSearchResults(results);
      setLoading(false);
      
      // Call the onSearch callback if provided
      if (onSearch) {
        onSearch(results);
      }
    }, 1000);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Toggle search results visibility
  const clearSearch = () => {
    setSearchResults(null);
    setSearchTerm('');
    
    if (onSearch) {
      onSearch(null);
    }
  };

  return (
    <div className="mb-6">
      <form onSubmit={handleSearch} className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2 rounded-lg border bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="Search the forum..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="md:w-48">
            <select
              className="w-full px-4 py-2 rounded-lg border bg-gray-900 border-gray-700 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="technical">Technical</option>
              <option value="development">Development</option>
              <option value="defi">DeFi</option>
              <option value="gaming">Gaming</option>
              <option value="security">Security</option>
              <option value="governance">Governance</option>
            </select>
          </div>
          
          <div className="md:w-24">
            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
              disabled={loading || !searchTerm.trim()}
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : 'Search'}
            </button>
          </div>
        </div>
      </form>
      
      {searchResults && (
        <div className="mt-6 bg-gray-800/30 border border-gray-700 rounded-lg overflow-hidden">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-white font-medium">Search Results ({searchResults.length})</h3>
            <button 
              onClick={clearSearch}
              className="text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="divide-y divide-gray-700">
            {searchResults.map((result) => (
              <div 
                key={result.id}
                className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => onSearch && onSearch(result.id)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-white font-medium">{result.title}</h4>
                  <span className="bg-gray-800 text-xs px-2 py-1 rounded text-gray-400">{result.category}</span>
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <span className="mr-3">By {result.author}</span>
                  <span className="mr-3">{formatDate(result.created_at)}</span>
                  <span className="mr-3">{result.replies} replies</span>
                  <span>{result.views} views</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumSearch;