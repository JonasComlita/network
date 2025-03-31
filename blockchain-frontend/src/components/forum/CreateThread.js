// components/forum/CreateThread.js
import React, { useState, useEffect } from 'react';

const CreateThread = ({ token, onSuccess, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [pinThread, setPinThread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Simulate API fetch for categories
    setTimeout(() => {
      setCategories([
        { id: 'technical', name: 'Technical' },
        { id: 'defi', name: 'DeFi' },
        { id: 'gaming', name: 'Gaming' },
        { id: 'security', name: 'Security' },
        { id: 'governance', name: 'Governance' },
        { id: 'staking', name: 'Staking' },
        { id: 'community', name: 'Community' }
      ]);
      setCategory('technical'); // Set default category
      setLoading(false);
    }, 500);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    if (!content.trim()) {
      setError('Please enter content for your thread');
      return;
    }

    if (!category) {
      setError('Please select a category');
      return;
    }

    setSubmitting(true);

    // Simulate API call to create thread
    setTimeout(() => {
      // In a real app, you would post the thread data to your API
      const newThread = {
        id: Date.now(),
        title,
        content,
        category,
        pinned: pinThread,
        author: 'current_user', // In a real app, this would be the authenticated user
        created_at: new Date().toISOString(),
        blockchain_verified: true,
        transaction_hash: `0x${Math.random().toString(16).substring(2, 64)}`
      };

      console.log('Thread created:', newThread);
      setSubmitting(false);
      
      // Call success callback
      if (onSuccess) {
        onSuccess(newThread);
      }
    }, 1500);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-3/4 mb-6"></div>
        <div className="h-4 bg-gray-700 rounded w-full mb-4"></div>
        <div className="h-64 bg-gray-700 rounded w-full mb-4"></div>
        <div className="h-10 bg-gray-700 rounded w-full mb-4"></div>
        <div className="h-10 bg-gray-700 rounded w-32 ml-auto"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Create New Thread</h2>
      
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        <div className="mb-6">
          <label className="block text-gray-400 mb-2">Title</label>
          <input
            type="text"
            className="w-full px-4 py-2 rounded-lg border bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors"
            placeholder="Enter a descriptive title for your thread"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-400 mb-2">Category</label>
          <select
            className="w-full px-4 py-2 rounded-lg border bg-gray-900 border-gray-700 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="" disabled>Select a category</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-400 mb-2">Content</label>
          <textarea
            className="w-full px-4 py-2 rounded-lg border bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            placeholder="Write your thread content here..."
            rows="8"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          ></textarea>
          <div className="mt-2 text-xs text-gray-500">
            You can use Markdown formatting in your content
          </div>
        </div>
        
        <div className="mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded bg-gray-900 border-gray-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900"
              checked={pinThread}
              onChange={(e) => setPinThread(e.target.checked)}
            />
            <span className="ml-2 text-gray-400">Pin this thread (administrators only)</span>
          </label>
        </div>
        
        <div className="flex justify-between items-center mt-8">
          <div className="text-xs text-gray-400 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Your thread will be stored on the blockchain
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Thread'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateThread;