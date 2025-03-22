import React, { useState, useEffect } from 'react';
import BlockchainChart from './components/BlockchainChart';
import Register from './components/Register';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import UserWallet from './components/UserWallet'; // Import the new wallet component
import TransactionAnalytics from './components/TransactionAnalytics';
import PriceData from './components/PriceData';
import NotificationList from './components/NotificationList';
import UserPreferences from './components/UserPreferences';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import UserDashboard from './components/UserDashboard';
import HistoricalTransactionData from './components/HistoricalTransactionData';
import SentimentData from './components/SentimentData';
import TokenDebug from './components/TokenDebug';
import './App.css';

function App() {
  // Initialize token from localStorage
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('wallet'); // Set wallet as the default tab

  // Effect to update localStorage when token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      console.log('Token stored in localStorage');
    } else {
      localStorage.removeItem('token');
      console.log('Token removed from localStorage');
    }
  }, [token]);

  // Function to handle logout
  const handleLogout = () => {
    setToken(null);
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
    <div className="App">
      <header className="App-header bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-bold">OriginalCoin</h1>
          {token && (
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      <main className="container mx-auto p-4">
        {!token ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 my-8">
            <Login setToken={setToken} />
            <Register />
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="border-b border-gray-200 mb-8">
              <nav className="flex space-x-8">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 font-medium text-sm border-b-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="mb-8">
              {activeTab === 'wallet' && (
                <UserWallet token={token} />
              )}
              
              {activeTab === 'dashboard' && (
                <UserDashboard token={token} />
              )}
              
              {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <UserProfile token={token} />
                  <UserPreferences token={token} />
                </div>
              )}
              
              {activeTab === 'analytics' && (
                <>
                  <div className="mb-6">
                    <TransactionAnalytics token={token} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <PriceData />
                    <SentimentData />
                  </div>
                  <div className="mb-6">
                    <AdvancedAnalytics token={token} />
                  </div>
                  <div className="mb-6">
                    <HistoricalTransactionData token={token} />
                  </div>
                </>
              )}
              
              {activeTab === 'blockchain' && (
                <>
                  <BlockchainChart />
                  <div className="mt-6">
                    <NotificationList token={token} />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>
      
      <footer className="bg-gray-800 text-white p-4 mt-12">
        <div className="container mx-auto text-center">
          <p>&copy; {new Date().getFullYear()} OriginalCoin Blockchain. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;