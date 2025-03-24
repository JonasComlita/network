import React, { useState, useEffect } from 'react';

const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);
  
  useEffect(() => {
    // Generate initial activities
    const initialActivities = [
      { id: 1, type: 'transaction', from: '0x8F3...', to: '0x4A2...', amount: 0.35, time: 'just now' },
      { id: 2, type: 'block', number: 12568, miner: '0xB7C...', transactions: 12, time: '1m ago' },
      { id: 3, type: 'contract', creator: '0x9E1...', name: 'NFTMarket', time: '3m ago' },
      { id: 4, type: 'transaction', from: '0x2D5...', to: '0xF19...', amount: 1.2, time: '5m ago' },
      { id: 5, type: 'staking', address: '0x6B3...', amount: 10, time: '7m ago' },
      { id: 6, type: 'block', number: 12569, miner: '0x3A8...', transactions: 8, time: '8m ago' }
    ];
    
    setActivities(initialActivities);
    
    // Add new activities periodically
    const interval = setInterval(() => {
      const newActivity = generateRandomActivity();
      
      setActivities(prev => {
        // Add new activity at the beginning and limit to 8 items
        return [newActivity, ...prev].slice(0, 8);
      });
    }, 6000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Generate a random activity
  const generateRandomActivity = () => {
    const types = ['transaction', 'block', 'contract', 'staking'];
    const type = types[Math.floor(Math.random() * types.length)];
    const id = Date.now();
    
    const randomAddress = () => {
      const chars = '0123456789ABCDEF';
      let addr = '0x';
      for (let i = 0; i < 3; i++) {
        addr += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return addr + '...';
    };
    
    switch (type) {
      case 'transaction':
        return {
          id,
          type,
          from: randomAddress(),
          to: randomAddress(),
          amount: (Math.random() * 5).toFixed(2),
          time: 'just now'
        };
        
      case 'block':
        return {
          id,
          type,
          number: 12570 + Math.floor(Math.random() * 10),
          miner: randomAddress(),
          transactions: Math.floor(Math.random() * 20) + 1,
          time: 'just now'
        };
        
      case 'contract':
        const contractNames = ['TokenSwap', 'NFTMarket', 'DeFiVault', 'DAO', 'StakingPool'];
        return {
          id,
          type,
          creator: randomAddress(),
          name: contractNames[Math.floor(Math.random() * contractNames.length)],
          time: 'just now'
        };
        
      case 'staking':
        return {
          id,
          type,
          address: randomAddress(),
          amount: Math.floor(Math.random() * 50) + 1,
          time: 'just now'
        };
        
      default:
        return {
          id,
          type: 'transaction',
          from: randomAddress(),
          to: randomAddress(),
          amount: (Math.random() * 5).toFixed(2),
          time: 'just now'
        };
    }
  };
  
  // Determine icon based on activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'transaction':
        return (
          <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12L21 12M21 12L14 5M21 12L14 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'block':
        return (
          <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 8H19M5 8C3.89543 8 3 7.10457 3 6C3 4.89543 3.89543 4 5 4H19C20.1046 4 21 4.89543 21 6C21 7.10457 20.1046 8 19 8M5 8L5 18C5 19.1046 5.89543 20 7 20H17C18.1046 20 19 19.1046 19 18V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'contract':
        return (
          <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 16H6C4.89543 16 4 15.1046 4 14V6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V14C20 15.1046 19.1046 16 18 16H16M8 16V17C8 18.1046 8.89543 19 10 19H14C15.1046 19 16 18.1046 16 17V16M8 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'staking':
        return (
          <svg className="w-4 h-4 text-indigo-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 6V18M12 18L7 13M12 18L17 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return null;
    }
  };
  
  // Render activity content based on type
  const getActivityContent = (activity) => {
    switch (activity.type) {
      case 'transaction':
        return (
          <>
            <div className="font-medium text-white">New Transaction</div>
            <div className="text-sm text-gray-400">
              <span className="text-indigo-400">{activity.from}</span> sent 
              <span className="text-white font-medium ml-1 mr-1">{activity.amount} ETH</span> to 
              <span className="text-indigo-400 ml-1">{activity.to}</span>
            </div>
          </>
        );
        
      case 'block':
        return (
          <>
            <div className="font-medium text-white">New Block Mined</div>
            <div className="text-sm text-gray-400">
              Block <span className="text-white font-medium">#{activity.number}</span> mined by 
              <span className="text-indigo-400 ml-1">{activity.miner}</span> with 
              <span className="text-white font-medium ml-1">{activity.transactions}</span> transactions
            </div>
          </>
        );
        
      case 'contract':
        return (
          <>
            <div className="font-medium text-white">Smart Contract Deployed</div>
            <div className="text-sm text-gray-400">
              <span className="text-indigo-400">{activity.creator}</span> deployed 
              contract <span className="text-white font-medium ml-1">{activity.name}</span>
            </div>
          </>
        );
        
      case 'staking':
        return (
          <>
            <div className="font-medium text-white">Staking Event</div>
            <div className="text-sm text-gray-400">
              <span className="text-indigo-400">{activity.address}</span> staked 
              <span className="text-white font-medium ml-1">{activity.amount} ETH</span>
            </div>
          </>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">Live Network Activity</h2>
      </div>
      
      <div className="divide-y divide-gray-700">
        {activities.map(activity => (
          <div 
            key={activity.id} 
            className="p-4 flex items-start hover:bg-gray-700/30 transition-colors duration-150"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center mr-3 flex-shrink-0">
              {getActivityIcon(activity.type)}
            </div>
            
            <div className="flex-1">
              {getActivityContent(activity)}
            </div>
            
            <div className="text-xs text-gray-500 ml-2 flex-shrink-0">
              {activity.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;
