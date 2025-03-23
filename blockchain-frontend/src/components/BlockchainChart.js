// src/components/BlockchainChart.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chart, registerables } from 'chart.js';
import apiService from './apiService';
import useWebSocketEnhanced from '../hooks/useWebSocketEnhanced';

// Register Chart.js components
Chart.register(...registerables);

const BlockchainChart = ({ token, blockchainData }) => {
  // If blockchainData is provided from useBlockchain hook, use that instead
  const isUsingProvidedData = !!blockchainData;
  
  // State for blockchain data when not using provided data
  const [blocks, setBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [blockTransactions, setBlockTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('chart');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  
  // Chart references
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  
  // Analytics data
  const [analytics, setAnalytics] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  
  // Reference for blocks to avoid unnecessary renders
  const blocksRef = useRef([]);
  
  // Track authentication status changes
  useEffect(() => {
    const checkAuth = () => {
      const hasToken = !!localStorage.getItem('token');
      setIsAuthenticated(hasToken);
    };

    // Initial check
    checkAuth();

    // Set up an event listener for storage changes (in case token is added/removed)
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);
  
  // WebSocket connection
  const { 
    status: socketStatus, 
    lastMessage,
    reconnect
  } = useWebSocketEnhanced('blocks/', {
    formatMessage: true,
  });
  
  // Process WebSocket messages
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'new_block' && !isUsingProvidedData) {
      // Update blocks with new data
      setBlocks(prevBlocks => {
        // Add new block at the beginning of the array
        const updatedBlocks = [lastMessage.block, ...prevBlocks];
        // Return only the first 20 blocks to avoid performance issues
        return updatedBlocks.slice(0, 20);
      });
    }
  }, [lastMessage, isUsingProvidedData]);
  
  // Fetch blocks data
  const fetchBlocks = useCallback(async () => {
    // Skip if using provided data or not authenticated
    if (isUsingProvidedData || !isAuthenticated) {
      if (!isAuthenticated && !isUsingProvidedData) {
        setError('Authentication required to load blockchain data');
      }
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Direct API call
      const response = await apiService.api.get('/blocks/');
      
      if (response && response.data) {
        // Handle both array and object with results property
        const blockData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.results || []);
        
        setBlocks(blockData);
        blocksRef.current = blockData;
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching blocks:', err);
      setError('Failed to load blockchain data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isUsingProvidedData, isAuthenticated]);
  
  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    // Skip if using provided data or not authenticated
    if (isUsingProvidedData || !isAuthenticated) {
      setIsLoadingAnalytics(false);
      return;
    }
    
    try {
      setIsLoadingAnalytics(true);
      
      // If blockchain object is available in apiService, use it
      if (apiService.blockchain) {
        try {
          const response = await apiService.api.get('/blockchain/overview/');
          if (response && response.data) {
            setAnalytics(response.data);
          }
        } catch (analyticsErr) {
          console.log('Blockchain overview not available');
          
          // Fall back to general analytics endpoint
          try {
            const response = await apiService.api.get('/analytics/');
            if (response && response.data) {
              setAnalytics(response.data);
            }
          } catch (err) {
            console.error('Analytics not available:', err);
          }
        }
      } else {
        // Direct API call to analytics endpoint
        try {
          const response = await apiService.api.get('/analytics/');
          if (response && response.data) {
            setAnalytics(response.data);
          }
        } catch (err) {
          console.error('Error fetching analytics:', err);
        }
      }
    } catch (err) {
      console.error('Error in analytics fetch:', err);
      // Don't set error state for analytics as it's not critical
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [isUsingProvidedData, isAuthenticated]);
  
  // Fetch block details
  const fetchBlockDetails = useCallback(async (blockId) => {
    if (!blockId || !isAuthenticated) return;
    
    try {
      // Direct API call
      let response;
      try {
        response = await apiService.api.get(`/blockchain/block/${blockId}/transactions/`);
      } catch (err) {
        // Fall back to regular transactions endpoint
        response = await apiService.api.get(`/transactions/?block_id=${blockId}`);
      }
      
      if (response && response.data) {
        setBlockTransactions(response.data);
      }
    } catch (err) {
      console.error('Error fetching block transactions:', err);
      setBlockTransactions([]);
    }
  }, [isAuthenticated]);
  
  // Initial data fetching
  useEffect(() => {
    if (!isUsingProvidedData && isAuthenticated) {
      fetchBlocks();
      fetchAnalytics();
      
      // Set up polling interval as fallback
      const blocksInterval = setInterval(fetchBlocks, 30000); // every 30 seconds
      const analyticsInterval = setInterval(fetchAnalytics, 60000); // every 60 seconds
      
      return () => {
        clearInterval(blocksInterval);
        clearInterval(analyticsInterval);
      };
    }
  }, [fetchBlocks, fetchAnalytics, isUsingProvidedData, isAuthenticated]);
  
  // Handle block selection
  const handleBlockSelect = useCallback((block) => {
    setSelectedBlock(block);
    fetchBlockDetails(block.id);
  }, [fetchBlockDetails]);
  
  // Get the blocks data to display
  const displayBlocks = isUsingProvidedData ? blockchainData?.blocks || [] : blocks;
  const displayAnalytics = isUsingProvidedData ? blockchainData?.analytics : analytics;
  const displayIsLoading = isUsingProvidedData ? blockchainData?.isLoading : isLoading;
  const displayError = isUsingProvidedData ? blockchainData?.error : error;
  const displaySocketStatus = isUsingProvidedData 
    ? (blockchainData?.socketStatus?.blocks || 'disconnected') 
    : socketStatus;
  
  // Create transaction chart when block data changes
  useEffect(() => {
    if (!chartRef.current || displayBlocks.length === 0 || activeTab !== 'chart') return;
    
    const ctx = chartRef.current.getContext('2d');
    
    // Destroy previous chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }
    
    // Prepare data - sort blocks by index for consistent display
    const sortedBlocks = [...displayBlocks].sort((a, b) => a.index - b.index);
    
    // Extract data for chart
    const labels = sortedBlocks.map(block => `Block ${block.index}`);
    const transactionCounts = sortedBlocks.map(block => {
      if (Array.isArray(block.transactions)) {
        return block.transactions.length;
      }
      // Handle case where transactions might be a count
      return typeof block.transaction_count === 'number' 
        ? block.transaction_count 
        : 0;
    });
    
    // Create chart
    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Transactions per Block',
          data: transactionCounts,
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              footer: (tooltipItems) => {
                const blockIndex = tooltipItems[0].dataIndex;
                const block = sortedBlocks[blockIndex];
                return `Block Hash: ${block.hash ? block.hash.substring(0, 12) + '...' : 'N/A'}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Transaction Count'
            }
          }
        },
        onClick: (event, elements) => {
          if (elements && elements.length > 0) {
            const index = elements[0].index;
            handleBlockSelect(sortedBlocks[index]);
          }
        }
      }
    });
  }, [displayBlocks, activeTab, handleBlockSelect]);
  
  // Filter blocks based on search term
  const filteredBlocks = displayBlocks.filter(block => {
    if (!searchTerm) return true;
    
    return (
      block.index.toString().includes(searchTerm) ||
      (block.hash && block.hash.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (block.timestamp && new Date(block.timestamp).toLocaleString().includes(searchTerm))
    );
  });
  
  // Show authentication prompt if not authenticated
  if (!isAuthenticated && !isUsingProvidedData) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Authentication Required</h2>
        <p className="text-gray-600 mb-4">Please log in to view blockchain data.</p>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-700">
            Blockchain data requires authentication to access. Please log in using the form above.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with blockchain stats */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Blockchain Explorer</h2>
          
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              displaySocketStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full mr-1 ${
                displaySocketStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              {displaySocketStatus === 'connected' ? 'Live Updates' : 'Offline'}
            </span>
            
            <button 
              onClick={isUsingProvidedData ? blockchainData?.reconnectSockets : reconnect}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              title="Reconnect WebSocket"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Blockchain stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-sm text-blue-600 mb-1">Total Blocks</div>
            <div className="text-xl font-bold">
              {(isUsingProvidedData ? blockchainData?.isLoading : isLoadingAnalytics)
                ? <div className="h-6 bg-blue-200 animate-pulse rounded"></div>
                : displayAnalytics?.total_blocks || displayBlocks.length || 0}
            </div>
          </div>
          
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-green-600 mb-1">Total Transactions</div>
            <div className="text-xl font-bold">
              {(isUsingProvidedData ? blockchainData?.isLoading : isLoadingAnalytics)
                ? <div className="h-6 bg-green-200 animate-pulse rounded"></div>
                : displayAnalytics?.total_transactions || 0}
            </div>
          </div>
          
          <div className="bg-purple-50 p-3 rounded">
            <div className="text-sm text-purple-600 mb-1">Avg. Block Time</div>
            <div className="text-xl font-bold">
              {(isUsingProvidedData ? blockchainData?.isLoading : isLoadingAnalytics)
                ? <div className="h-6 bg-purple-200 animate-pulse rounded"></div>
                : displayAnalytics?.avg_block_time 
                  ? `${parseFloat(displayAnalytics.avg_block_time).toFixed(2)}s`
                  : 'N/A'}
            </div>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded">
            <div className="text-sm text-yellow-600 mb-1">Mining Difficulty</div>
            <div className="text-xl font-bold">
              {(isUsingProvidedData ? blockchainData?.isLoading : isLoadingAnalytics)
                ? <div className="h-6 bg-yellow-200 animate-pulse rounded"></div>
                : displayAnalytics?.difficulty || 'N/A'}
            </div>
          </div>
        </div>
        
        {/* Search bar */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search by block index, hash, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        
        {/* Tab navigation */}
        <div className="border-b border-gray-200 mb-4">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('chart')}
              className={`${
                activeTab === 'chart'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Transaction Chart
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`${
                activeTab === 'list'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Block List
            </button>
            {selectedBlock && (
              <button
                onClick={() => setActiveTab('details')}
                className={`${
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Block Details
              </button>
            )}
          </nav>
        </div>
        
        {/* Loading state */}
        {displayIsLoading && !displayBlocks.length && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {/* Error state */}
        {displayError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
            {displayError}
          </div>
        )}
        
        {/* Transaction Chart tab */}
        {activeTab === 'chart' && displayBlocks.length > 0 && (
          <div className="h-72 md:h-96">
            <canvas ref={chartRef}></canvas>
          </div>
        )}
        
        {/* Block List tab */}
        {activeTab === 'list' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Index
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hash
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBlocks.map((block) => (
                  <tr key={block.id || block.hash || block.index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {block.index}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 font-mono">
                        {block.hash ? `${block.hash.substring(0, 8)}...` : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {Array.isArray(block.transactions) 
                          ? block.transactions.length 
                          : (block.transaction_count || 0)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {block.timestamp ? new Date(block.timestamp).toLocaleString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleBlockSelect(block)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredBlocks.length === 0 && !displayIsLoading && (
              <div className="text-center py-8 text-gray-500">
                No blocks match your search criteria
              </div>
            )}
          </div>
        )}
        
        {/* Block Details tab */}
        {activeTab === 'details' && selectedBlock && (
          <div>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Block Details</h3>
              
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
                <div className="col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Index</dt>
                  <dd className="mt-1 text-sm text-gray-900">{selectedBlock.index}</dd>
                </div>
                
                <div className="col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Timestamp</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {selectedBlock.timestamp ? new Date(selectedBlock.timestamp).toLocaleString() : 'N/A'}
                  </dd>
                </div>
                
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Hash</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono break-all">{selectedBlock.hash || 'N/A'}</dd>
                </div>
                
                <div className="col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Previous Hash</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono break-all">{selectedBlock.previous_hash || 'N/A'}</dd>
                </div>
                
                <div className="col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Transactions</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {Array.isArray(selectedBlock.transactions) 
                      ? selectedBlock.transactions.length 
                      : (selectedBlock.transaction_count || 0)}
                  </dd>
                </div>
              </dl>
            </div>
            
            <h3 className="text-lg font-medium text-gray-900 mb-4">Block Transactions</h3>
            
            {blockTransactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        From
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        To
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {blockTransactions.map((tx) => (
                      <tr key={tx.id || tx.tx_id || Math.random().toString()} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-500">
                            {tx.id || tx.tx_id 
                              ? `${(tx.id || tx.tx_id).substring(0, 8)}...` 
                              : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-500">
                            {tx.sender ? `${tx.sender.substring(0, 8)}...` : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-500">
                            {tx.recipient ? `${tx.recipient.substring(0, 8)}...` : 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {typeof tx.amount === 'number' || typeof tx.amount === 'string'
                              ? parseFloat(tx.amount).toFixed(8)
                              : '0.00000000'} ORIG
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No transactions in this block
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Latest block notification */}
      {lastMessage && lastMessage.type === 'new_block' && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-bounce-once">
          <span className="inline-block w-3 h-3 bg-green-500 rounded-full"></span>
          <div>
            <p className="font-medium">New Block Added</p>
            <p className="text-sm">Block #{lastMessage.block.index} with {
              Array.isArray(lastMessage.block.transactions) 
                ? lastMessage.block.transactions.length 
                : (lastMessage.block.transaction_count || 0)
            } transactions</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Define a custom animation for the notification
const customCss = `
@keyframes bounce-once {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
.animate-bounce-once {
  animation: bounce-once 1s ease;
}
`;

// Add the custom CSS to the document head
const style = document.createElement('style');
style.textContent = customCss;
document.head.appendChild(style);

export default BlockchainChart;