import React, { useState, useEffect } from 'react';
import BlockchainChart from './components/BlockchainChart';
import Register from './components/Register';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import TransactionAnalytics from './components/TransactionAnalytics';
import PriceData from './components/PriceData';
import NotificationList from './components/NotificationList';
import UserPreferences from './components/UserPreferences';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import UserDashboard from './components/UserDashboard';
import HistoricalTransactionData from './components/HistoricalTransactionData';
import SentimentData from './components/SentimentData';
import TokenDebug from './components/TokenDebug'; // Import the debug component
import './App.css';

function App() {
  // Initialize token from localStorage
  const [token, setToken] = useState(localStorage.getItem('token'));

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

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="text-3xl font-bold">Blockchain Visualization</h1>
        {token && (
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        )}
      </header>
      <main>
        {!token ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Login setToken={setToken} />
            <Register />
          </div>
        ) : (
          <>
            {/* Temporarily add TokenDebug for troubleshooting */}
            <div className="mb-8">
              <TokenDebug />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <UserProfile token={token} />
              <UserPreferences token={token} />
            </div>
            
            <div className="mb-6">
              <UserDashboard token={token} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <TransactionAnalytics />
              <PriceData />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <NotificationList token={token} />
              <SentimentData />
            </div>
            
            <div className="mb-6">
              <AdvancedAnalytics token={token} />
            </div>
            
            <div className="mb-6">
              <HistoricalTransactionData token={token} />
            </div>
            
            <div className="mb-6">
              <BlockchainChart />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;