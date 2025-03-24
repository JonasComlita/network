import React, { useState, useEffect } from 'react';

const BlockchainStats = () => {
  // Initial values
  const [chainLength, setChainLength] = useState(12567);
  const [transactionCount, setTransactionCount] = useState(1289465);
  const [userCount, setUserCount] = useState(89456);
  const [miningPower, setMiningPower] = useState(45698);
  
  // Animation helper function
  const animateCounter = (setter, start, end, duration = 1000) => {
    const startTime = performance.now();
    
    const updateCounter = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);
      
      const value = Math.floor(start + progress * (end - start));
      setter(value);
      
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };
    
    requestAnimationFrame(updateCounter);
  };
  
  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setChainLength(prevValue => {
        const newValue = prevValue + Math.floor(Math.random() * 5) + 1;
        animateCounter(setChainLength, prevValue, newValue);
        return newValue;
      });
      
      setTransactionCount(prevValue => {
        const newValue = prevValue + Math.floor(Math.random() * 100) + 50;
        animateCounter(setTransactionCount, prevValue, newValue);
        return newValue;
      });
      
      setUserCount(prevValue => {
        const newValue = prevValue + Math.floor(Math.random() * 3);
        animateCounter(setUserCount, prevValue, newValue);
        return newValue;
      });
      
      setMiningPower(prevValue => {
        const newValue = prevValue + Math.floor(Math.random() * 1000) - 400;
        animateCounter(setMiningPower, prevValue, newValue);
        return newValue;
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-indigo-500 transition-colors duration-300">
        <div className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-indigo-300 bg-clip-text text-transparent mb-2">
          {chainLength.toLocaleString()}
        </div>
        <div className="text-gray-400 text-sm font-medium">Chain Length</div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-indigo-500 transition-colors duration-300">
        <div className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-indigo-300 bg-clip-text text-transparent mb-2">
          {transactionCount.toLocaleString()}
        </div>
        <div className="text-gray-400 text-sm font-medium">Transactions</div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-indigo-500 transition-colors duration-300">
        <div className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-indigo-300 bg-clip-text text-transparent mb-2">
          {userCount.toLocaleString()}
        </div>
        <div className="text-gray-400 text-sm font-medium">Active Users</div>
      </div>
      
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-indigo-500 transition-colors duration-300">
        <div className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-indigo-300 bg-clip-text text-transparent mb-2">
          {miningPower.toLocaleString()}
        </div>
        <div className="text-gray-400 text-sm font-medium">Mining Power (H/s)</div>
      </div>
    </div>
  );
};

export default BlockchainStats;
