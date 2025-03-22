// BlockchainDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, XAxis, YAxis, Tooltip, Line } from 'recharts';

const BlockchainDashboard = () => {
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [recentBlocks, setRecentBlocks] = useState([]);
  
  useEffect(() => {
    // Fetch blockchain data
    const fetchData = async () => {
      const infoResponse = await axios.get('/api/blockchain/info');
      setBlockchainInfo(infoResponse.data);
      
      const blocksResponse = await axios.get('/api/blockchain/blocks');
      setRecentBlocks(blocksResponse.data);
    };
    
    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="blockchain-dashboard">
      <h1>OriginalCoin Blockchain</h1>
      
      {blockchainInfo && (
        <div className="blockchain-stats">
          <div className="stat-card">
            <h3>Chain Length</h3>
            <p>{blockchainInfo.chain_length}</p>
          </div>
          <div className="stat-card">
            <h3>Mining Difficulty</h3>
            <p>{blockchainInfo.difficulty}</p>
          </div>
          <div className="stat-card">
            <h3>Block Reward</h3>
            <p>{blockchainInfo.current_reward} ORIG</p>
          </div>
          <div className="stat-card">
            <h3>Pending Transactions</h3>
            <p>{blockchainInfo.mempool_size}</p>
          </div>
        </div>
      )}
      
      <h2>Recent Blocks</h2>
      <div className="recent-blocks">
        {recentBlocks.map(block => (
          <div key={block.hash} className="block-card">
            <h3>Block #{block.index}</h3>
            <p>Hash: {block.hash.substring(0, 15)}...</p>
            <p>Transactions: {block.transactions.length}</p>
            <p>Time: {new Date(block.timestamp).toLocaleString()}</p>
          </div>
        ))}
      </div>
      
      {/* Block creation chart */}
      <h2>Block Creation Rate</h2>
      <LineChart width={600} height={300} data={recentBlocks.map(block => ({
        index: block.index,
        time: new Date(block.timestamp).getTime()
      }))}>
        <XAxis dataKey="index" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="time" stroke="#8884d8" />
      </LineChart>
    </div>
  );
};

export default BlockchainDashboard;