// components/forum/ForumDashboard.js
import React from 'react';
import ForumTopicList from './ForumTopicList';
import PopularThreads from './PopularThreads';

const ForumDashboard = ({ onSelectThread, token }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Blockchain Forum</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Popular Topics</h3>
            <ForumTopicList onSelectThread={onSelectThread} token={token} />
          </div>
        </div>
        
        <div>
          <div className="mb-6 bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Popular Threads</h3>
            <PopularThreads onSelectThread={onSelectThread} token={token} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForumDashboard;