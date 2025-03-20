import React, { useState } from 'react';
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
import './App.css';

function App() {
  const [token, setToken] = useState(null);

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="text-3xl font-bold">Blockchain Visualization</h1>
      </header>
      <main>
        {!token ? (
          <>
            <Login setToken={setToken} />
            <Register />
          </>
        ) : (
          <>
            <UserProfile token={token} />
            <UserPreferences token={token} />
            <UserDashboard token={token} />
            <TransactionAnalytics />
            <HistoricalTransactionData token={token} />
            <PriceData />
            <NotificationList token={token} />
            <AdvancedAnalytics token={token} />
            <SentimentData />
            <BlockchainChart />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
