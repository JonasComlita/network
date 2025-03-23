// src/hooks/useBlockchain.js
import { useState, useEffect, useCallback, useRef } from 'react';
import useWebSocketEnhanced from './useWebSocketEnhanced';
import apiService from '../components/apiService';

/**
 * Hook for managing blockchain data and WebSocket connections
 */
export function useBlockchain() {
  // State for blockchain data
  const [blocks, setBlocks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  
  // Refs to prevent circular updates
  const blocksRef = useRef([]);
  const transactionsRef = useRef([]);
  
  // WebSocket for block updates
  const { 
    status: blockSocketStatus, 
    lastMessage: blockMessage,
    reconnect: reconnectBlockSocket
  } = useWebSocketEnhanced('blocks/', {});
  
  // WebSocket for transaction updates
  const { 
    status: txSocketStatus, 
    lastMessage: txMessage,
    reconnect: reconnectTxSocket
  } = useWebSocketEnhanced('transactions/', {});

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

  // Process WebSocket messages from blocks
  useEffect(() => {
    if (blockMessage && blockMessage.type === 'new_block') {
      // Update blocks with new data
      setBlocks(prevBlocks => {
        // Add new block at the beginning of the array
        const updatedBlocks = [blockMessage.block, ...prevBlocks];
        // Update ref
        blocksRef.current = updatedBlocks.slice(0, 20);
        // Return only the first 20 blocks to avoid performance issues
        return updatedBlocks.slice(0, 20);
      });
    }
  }, [blockMessage]);
  
  // Process WebSocket messages from transactions
  useEffect(() => {
    if (txMessage && (txMessage.type === 'transaction_update' || txMessage.type === 'new_transaction')) {
      // Add new transaction to history
      setTransactions(prevTxs => {
        // Add new transaction at the beginning
        const updatedTxs = [txMessage.transaction, ...prevTxs];
        // Update ref
        transactionsRef.current = updatedTxs.slice(0, 50);
        // Return only the first 50 transactions to avoid performance issues
        return updatedTxs.slice(0, 50);
      });
    }
  }, [txMessage]);

  // Fetch blocks with direct API calls (not using fetchWithRetry)
  const fetchBlocks = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Skip fetch if not authenticated
      if (!isAuthenticated) {
        setError('Authentication required to load blockchain data');
        setIsLoading(false);
        return;
      }
      
      let blocksData = [];
      let analyticsData = null;
      
      // Use blockchain-specific endpoint if available
      if (apiService.blockchain && typeof apiService.blockchain.getOverview === 'function') {
        try {
          // Direct API calls instead of using fetchWithRetry
          const blocksResponse = await apiService.api.get('/blocks/');
          
          if (blocksResponse && blocksResponse.data) {
            blocksData = Array.isArray(blocksResponse.data) 
              ? blocksResponse.data
              : (blocksResponse.data.results || []);
          }
          
          try {
            // Separate try-catch for analytics to continue even if this fails
            const analyticsResponse = await apiService.api.get('/blockchain/overview/');
            if (analyticsResponse && analyticsResponse.data) {
              analyticsData = analyticsResponse.data;
            }
          } catch (analyticsError) {
            console.log('Analytics data not available:', analyticsError);
          }
        } catch (err) {
          console.error('Error fetching blockchain data:', err);
          setError('Failed to load blockchain data. Please try again.');
          setIsLoading(false);
          return;
        }
      } else {
        // Fall back to standard endpoint
        try {
          const blocksResponse = await apiService.api.get('/blocks/');
          
          if (blocksResponse && blocksResponse.data) {
            blocksData = Array.isArray(blocksResponse.data) 
              ? blocksResponse.data
              : (blocksResponse.data.results || []);
          }
          
          // Try to get analytics if available
          try {
            const analyticsResponse = await apiService.api.get('/analytics/');
            if (analyticsResponse && analyticsResponse.data) {
              analyticsData = analyticsResponse.data;
            }
          } catch (analyticsError) {
            console.log('Analytics not available, skipping');
          }
        } catch (err) {
          console.error('Error fetching blocks data:', err);
          setError('Failed to load blockchain data. Please try again.');
          setIsLoading(false);
          return;
        }
      }
      
      // Update state with fetched data
      setBlocks(blocksData);
      blocksRef.current = blocksData;
      
      if (analyticsData) {
        setAnalytics(analyticsData);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error in fetchBlocks:', err);
      setError('An unexpected error occurred fetching blockchain data.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);
  
  // Fetch transactions with direct API calls
  const fetchTransactions = useCallback(async () => {
    // Skip if not authenticated
    if (!isAuthenticated) return;
    
    try {
      // Use blockchain-specific endpoint if available
      if (apiService.blockchain && typeof apiService.blockchain.getTransactionVolume === 'function') {
        try {
          // Direct API call instead of using fetchWithRetry
          const response = await apiService.api.get('/blockchain/analytics/volume/?timeframe=week');
          
          if (response && response.data && response.data.transactions) {
            setTransactions(response.data.transactions);
            transactionsRef.current = response.data.transactions;
          }
        } catch (err) {
          console.error('Error fetching transaction volume:', err);
        }
      } else {
        // Try to get transactions from a block if available
        // Use the ref to avoid dependency on blocks state
        const currentBlocks = blocksRef.current;
        if (currentBlocks.length > 0 && currentBlocks[0].id) {
          try {
            const response = await apiService.api.get(`/transactions/?block_id=${currentBlocks[0].id}`);
            
            if (response && response.data) {
              setTransactions(response.data);
              transactionsRef.current = response.data;
            }
          } catch (err) {
            console.error('Error fetching block transactions:', err);
          }
        }
      }
    } catch (err) {
      console.error('Error in fetchTransactions:', err);
      // Don't set error state for transactions as it's not critical
    }
  }, [isAuthenticated]); // Only depends on authentication status
  
  // Initial data fetching
  useEffect(() => {
    if (isAuthenticated) {
      fetchBlocks();
    }
    
    // Set up polling interval as fallback, only if authenticated
    let intervalId = null;
    if (isAuthenticated) {
      intervalId = setInterval(fetchBlocks, 30000); // every 30 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchBlocks, isAuthenticated]);
  
  // Fetch transactions when blocks change
  useEffect(() => {
    if (isAuthenticated && blocks.length > 0) {
      fetchTransactions();
    }
  }, [blocks, fetchTransactions, isAuthenticated]);
  
  // General reconnect function for both sockets
  const reconnectSockets = useCallback(() => {
    reconnectBlockSocket();
    reconnectTxSocket();
  }, [reconnectBlockSocket, reconnectTxSocket]);
  
  return {
    blocks,
    transactions,
    analytics,
    isLoading,
    error,
    isAuthenticated,
    socketStatus: {
      blocks: blockSocketStatus,
      transactions: txSocketStatus
    },
    lastMessages: {
      blockMessage,
      txMessage
    },
    fetchBlocks,
    fetchTransactions,
    reconnectSockets
  };
}

export default useBlockchain;