// Enhanced App.js with integrated futuristic styling
import React, { useState, useEffect } from 'react';
import BlockchainChart from './components/BlockchainChart';
import Register from './components/Register';
import RegistrationSuccess from './components/RegistrationSuccess';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import UserWallet from './components/UserWallet';
import TransactionAnalytics from './components/TransactionAnalytics';
import PriceData from './components/PriceData';
import NotificationList from './components/NotificationList';
import UserPreferences from './components/UserPreferences';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import UserDashboard from './components/UserDashboard';
import HistoricalTransactionData from './components/HistoricalTransactionData';
import SentimentData from './components/SentimentData';
import BlockchainDashboardIntegration from './components/BlockchainDashboardIntegration';

// New futuristic components
import BackgroundEffect from './components/BackgroundEffect';
import BlockchainVisualization from './components/BlockchainVisualization';
import BlockchainStats from './components/BlockchainStats';
import ActivityFeed from './components/ActivityFeed';
import FeatureCards from './components/FeatureCards';

import { useBlockchain } from './hooks/useBlockchain';
import './App.css';
import './futuristic.css'; // New futuristic styling

function App() {
  // Initialize token from localStorage
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('wallet'); // Set wallet as the default tab
  // State for toggling between standard and dashboard views
  const [useDashboardView, setUseDashboardView] = useState(false);
  // Registration success state
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);

  // Fetch blockchain data with the custom hook (will be available in components)
  const blockchainData = useBlockchain();

  // Effect to create floating particles
  useEffect(() => {
    // Create particles
    const createParticles = () => {
      const container = document.querySelector('.App');
      if (!container) return;
      
      const particleCount = 15;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random positioning
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        // Random size
        const size = (Math.random() * 4) + 2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        // Random opacity
        particle.style.opacity = Math.random() * 0.5 + 0.1;
        
        // Animation
        particle.style.animation = `float ${Math.random() * 10 + 10}s linear infinite`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        
        container.appendChild(particle);
      }
    };
    
    createParticles();
    
    // Cleanup function
    return () => {
      const particles = document.querySelectorAll('.particle');
      particles.forEach(particle => particle.remove());
    };
  }, []);

  // Effect to update localStorage when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      console.log('Token stored in localStorage');
    } else {
      localStorage.removeItem('token');
      console.log('Token removed from localStorage');
      // Reset registration success state when logging out
      setRegistrationSuccess(false);
    }
  }, [token]);

  // Function to handle logout
  const handleLogout = () => {
    setToken(null);
  };

  // Function to handle successful registration
  const handleRegistrationSuccess = (data) => {
    setRegistrationSuccess(true);
    setRegistrationData(data);
  };

  // Functions for registration success navigation
  const handleGoToLogin = () => {
    setRegistrationSuccess(false);
  };

  const handleGoToWallet = () => {
    setRegistrationSuccess(false);
    setToken(localStorage.getItem('token')); // In case token was set externally
    setActiveTab('wallet');
  };

  const handleGoToProfile = () => {
    setRegistrationSuccess(false);
    setToken(localStorage.getItem('token')); // In case token was set externally
    setActiveTab('profile');
  };

  // Navigation tabs
  const tabs = [
    { id: 'wallet', label: 'Wallet' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'profile', label: 'Profile' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'blockchain', label: 'Blockchain' }
  ];

  return (
    <div className="App bg-gray-900 min-h-screen text-white">
      {/* Add the Three.js background for the futuristic effect */}
      <BackgroundEffect />

      <header className="bg-gray-800/70 text-white p-4 relative z-10 border-b border-gray-700">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-indigo-400 rounded-md mr-3 relative overflow-hidden">
              <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-gray-800 rotate-45"></div>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">OriginalCoin</h1>
          </div>
          
          {token && (
            <div className="flex items-center space-x-4">
              {/* Toggle for Dashboard View */}
              <div className="flex items-center">
                <label className="mr-2 text-sm">Dashboard View:</label>
                <div 
                  className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in cursor-pointer"
                  onClick={() => setUseDashboardView(!useDashboardView)}
                >
                  <input 
                    type="checkbox" 
                    name="toggle-dashboard" 
                    id="toggle-dashboard" 
                    checked={useDashboardView}
                    onChange={() => {}}
                    className="sr-only"
                  />
                  <div className={`block w-10 h-6 rounded-full ${useDashboardView ? 'bg-indigo-500' : 'bg-gray-600'}`}></div>
                  <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition ${useDashboardView ? 'transform translate-x-4' : ''}`}></div>
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded hover:from-red-500 hover:to-red-400 transition-colors shadow-lg shadow-red-900/30 relative overflow-hidden group"
              >
                <span className="relative z-10">Logout</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4 relative z-10">
        {!token ? (
          registrationSuccess ? (
            // Show registration success message with futuristic styling
            <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 max-w-2xl mx-auto my-8 holographic-card">
              <RegistrationSuccess 
                registrationData={registrationData} 
                onLogin={handleGoToLogin}
                onViewWallet={handleGoToWallet}
                onViewProfile={handleGoToProfile}
              />
            </div>
          ) : (
            // Show login and registration forms with futuristic styling
            <>
              {/* Hero section above login/register */}
              <section className="relative py-12 text-center mb-8">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-indigo-200 bg-clip-text text-transparent">
                  Next Generation Blockchain Platform
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-4">
                  A secure, transparent, and scalable blockchain solution for developers, businesses, and individuals.
                </p>
              </section>
              
              {/* Blockchain visualization */}
              <div className="mb-12">
                <BlockchainVisualization />
              </div>
              
              {/* Stats section */}
              <div className="mb-12">
                <BlockchainStats />
              </div>
              
              {/* Login and registration forms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-12">
                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
                  <h2 className="text-xl font-bold mb-4 text-center">Login to Your Account</h2>
                  <Login setToken={setToken} />
                </div>
                
                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
                  <h2 className="text-xl font-bold mb-4 text-center">Create New Account</h2>
                  <Register onSuccess={handleRegistrationSuccess} />
                </div>
              </div>
              
              {/* Features section */}
              <div className="mb-12">
                <FeatureCards />
              </div>
              
              {/* Activity feed */}
              <div className="mb-12 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold text-white mb-4 text-center">Network Activity</h2>
                <ActivityFeed />
              </div>
            </>
          )
        ) : useDashboardView ? (
          // Integrated Dashboard View with futuristic styling
          <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
            <BlockchainDashboardIntegration blockchainData={blockchainData} token={token} />
          </div>
        ) : (
          <>
            {/* Enhanced Tab Navigation */}
            <div className="border-b border-gray-700 mb-8">
              <nav className="flex space-x-6">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-3 font-medium text-sm border-b-2 transition-all duration-300 ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-indigo-400 active-glow'
                        : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content with futuristic styling */}
            <div className="mb-8">
              {activeTab === 'wallet' && (
                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
                  <UserWallet token={token} />
                </div>
              )}
              
              {activeTab === 'dashboard' && (
                <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
                  <UserDashboard token={token} />
                </div>
              )}
              
              {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
                    <UserProfile token={token} />
                  </div>
                  <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
                    <UserPreferences token={token} />
                  </div>
                </div>
              )}
              
              {activeTab === 'analytics' && (
                <>
                  <div className="mb-6 bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
                    <TransactionAnalytics token={token} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
                      <PriceData />
                    </div>
                    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
                      <SentimentData />
                    </div>
                  </div>
                  <div className="mb-6 bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
                    <AdvancedAnalytics token={token} />
                  </div>
                  <div className="mb-6 bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
                    <HistoricalTransactionData token={token} />
                  </div>
                </>
              )}
              
              {activeTab === 'blockchain' && (
                <>
                  <div className="mb-6">
                    <BlockchainVisualization />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="col-span-2 bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
                      <BlockchainChart blockchainData={blockchainData} />
                    </div>
                    <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
                      <ActivityFeed />
                    </div>
                  </div>
                  <div className="mb-6 bg-gray-800/30 border border-gray-700 rounded-lg p-6 holographic-card">
                    <NotificationList token={token} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>
      
      <footer className="bg-gray-800/70 text-white p-4 mt-12 border-t border-gray-700 relative z-10">
        <div className="container mx-auto text-center">
          <p className="text-gray-400">&copy; {new Date().getFullYear()} OriginalCoin Blockchain. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
