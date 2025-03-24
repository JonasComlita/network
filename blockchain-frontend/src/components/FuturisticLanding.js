import React from 'react';
import BackgroundEffect from './BackgroundEffect';
import BlockchainVisualization from './BlockchainVisualization';
import BlockchainStats from './BlockchainStats';
import ActivityFeed from './ActivityFeed';
import FeatureCards from './FeatureCards';

const FuturisticLanding = ({ setToken }) => {
  const handleLoginClick = () => {
    // For demo purpose, let's assume we're showing a login modal
    // In a real app, you'd handle this differently
    document.getElementById('loginModal')?.classList.remove('hidden');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white relative">
      {/* Three.js Background */}
      <BackgroundEffect />
      
      {/* Header */}
      <header className="relative z-10 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded mr-3 relative overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-gray-900 rotate-45"></div>
              </div>
              <span className="text-xl font-bold">OriginalCoin</span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
              <a href="#visualization" className="text-gray-400 hover:text-white transition-colors">Blockchain</a>
              <a href="#activity" className="text-gray-400 hover:text-white transition-colors">Activity</a>
              <a href="#about" className="text-gray-400 hover:text-white transition-colors">About</a>
            </nav>
            
            <div className="flex space-x-4">
              <button 
                onClick={handleLoginClick}
                className="px-4 py-2 text-sm font-medium text-white border border-gray-700 rounded-md hover:border-indigo-500 transition-colors"
              >
                Login
              </button>
              <button 
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-md hover:from-indigo-500 hover:to-indigo-400 transition-colors shadow-md shadow-indigo-900/30"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative z-10 py-20 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
            Next Generation<br />Blockchain Platform
          </h1>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            A secure, transparent, and scalable blockchain solution for developers, businesses, and individuals. Experience the future of decentralized applications.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-md hover:from-indigo-500 hover:to-indigo-400 transition-colors shadow-lg shadow-indigo-900/30 relative overflow-hidden group">
              <span className="relative z-10 font-semibold">Start Building</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
            </button>
            <button className="px-6 py-3 border border-gray-700 rounded-md hover:border-indigo-500 transition-colors font-semibold">
              Explore Platform
            </button>
          </div>
          
          {/* Stats Section */}
          <BlockchainStats />
        </div>
      </section>
      
      {/* Blockchain Visualization */}
      <section id="visualization" className="relative z-10 py-12">
        <div className="container mx-auto px-4">
          <BlockchainVisualization />
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="relative z-10">
        <div className="container mx-auto px-4">
          <FeatureCards />
        </div>
      </section>
      
      {/* Activity Feed */}
      <section id="activity" className="relative z-10 py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center text-white mb-8">Network Activity</h2>
          <div className="max-w-3xl mx-auto">
            <ActivityFeed />
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="relative z-10 py-16 text-center bg-gradient-to-b from-transparent to-gray-800/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-8">Ready to Join the Blockchain Revolution?</h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-md hover:from-indigo-500 hover:to-indigo-400 transition-colors shadow-lg shadow-indigo-900/30">
              Create Account
            </button>
            <button className="px-6 py-3 border border-gray-700 rounded-md hover:border-indigo-500 transition-colors">
              Learn More
            </button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">GitHub</a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-gray-500">&copy; {new Date().getFullYear()} OriginalCoin Platform. All rights reserved.</p>
        </div>
      </footer>
      
      {/* Login Modal (simplified) */}
      <div id="loginModal" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 hidden">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Login to Your Account</h2>
            <button 
              onClick={() => document.getElementById('loginModal')?.classList.add('hidden')}
              className="text-gray-400 hover:text-white"
            >
              &times;
            </button>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            // For demo, let's just set a fake token
            setToken('demo-token');
            document.getElementById('loginModal')?.classList.add('hidden');
          }}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
              <input 
                type="email" 
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your email"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
              <input 
                type="password" 
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter your password"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-md hover:from-indigo-500 hover:to-indigo-400 transition-colors"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FuturisticLanding;
