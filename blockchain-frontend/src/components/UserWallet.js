// src/components/UserWallet.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiService from './apiService';
import useWebSocketEnhanced from '../hooks/useWebSocketEnhanced';

const UserWallet = ({ token }) => {
  // Wallet state
  const [walletInfo, setWalletInfo] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [walletPassphrase, setWalletPassphrase] = useState('');
  const [passphraseSubmitted, setPassphraseSubmitted] = useState(false);
  
  // Transaction form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [fee, setFee] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(null);
  
  // Refs to prevent infinite updates
  const isFirstConnection = useRef(true);
  const walletInfoRef = useRef(null);
  
  // WebSocket for real-time updates
  const { 
    status: socketStatus, 
    sendMessage,
    lastMessage 
  } = useWebSocketEnhanced('wallet/', {
    onOpen: () => {
      // Only send authentication once on first connection
      if (isFirstConnection.current && token) {
        sendMessage({ token });
        isFirstConnection.current = false;
      }
    },
    debug: process.env.NODE_ENV === 'development'
  });
  
  // Update wallet info ref when the state changes
  useEffect(() => {
    walletInfoRef.current = walletInfo;
  }, [walletInfo]);
  
  // Process messages from WebSocket
  useEffect(() => {
    if (lastMessage) {
      console.log('WebSocket message:', lastMessage);
      
      if (lastMessage.type === 'balance_update') {
        // Update wallet balance only if wallet info exists
        setWalletInfo(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            balance: lastMessage.balance
          };
        });
      } else if (lastMessage.type === 'transaction_update') {
        // Add new transaction to history
        setTransactions(prev => [lastMessage.transaction, ...prev]);
      } else if (lastMessage.type === 'wallet_status') {
        // Update full wallet info
        setWalletInfo({
          has_wallet: lastMessage.has_wallet,
          wallet_address: lastMessage.wallet_address,
          balance: lastMessage.balance,
          is_active: lastMessage.status === 'active'
        });
      }
    }
  }, [lastMessage]);
  
  // Fetch wallet info
  const fetchWalletInfo = useCallback(async () => {
    if (!passphraseSubmitted) return;
    
    try {
      setIsLoading(true);
      const response = await apiService.wallet.getInfo(walletPassphrase);
      
      if (response.data) {
        setWalletInfo(response.data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching wallet info:', err);
      setError(err.formattedMessage || 'Failed to load wallet information');
      
      // If wallet doesn't exist, set walletInfo with has_wallet: false
      if (err.response && err.response.status === 404) {
        setWalletInfo({ has_wallet: false });
      }
    } finally {
      setIsLoading(false);
    }
  }, [walletPassphrase, passphraseSubmitted]);
  
  // Fetch transaction history
  const fetchTransactionHistory = useCallback(async () => {
    // Use the ref to avoid dependency on walletInfo which could cause frequent re-renders
    const currentWalletInfo = walletInfoRef.current;
    if (!currentWalletInfo || !currentWalletInfo.has_wallet) return;
    
    try {
      const response = await apiService.wallet.getHistory();
      
      if (response.data) {
        setTransactions(response.data);
      }
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      // Don't set error state here as it's not critical
    }
  }, []);
  
  // Initialize wallet data
  useEffect(() => {
    if (passphraseSubmitted) {
      fetchWalletInfo();
    }
  }, [passphraseSubmitted, fetchWalletInfo]);
  
  // Fetch transaction history when wallet info changes
  useEffect(() => {
    if (walletInfo && walletInfo.has_wallet) {
      fetchTransactionHistory();
    }
  }, [walletInfo, fetchTransactionHistory]);
  
  // Handle passphrase submission
  const handlePassphraseSubmit = (e) => {
    e.preventDefault();
    if (!walletPassphrase) {
      setError('Please enter your wallet passphrase');
      return;
    }
    
    setPassphraseSubmitted(true);
  };
  
  // Create wallet
  const handleCreateWallet = async () => {
    try {
      setIsLoading(true);
      setTransactionStatus(null);
      
      const response = await apiService.wallet.create(walletPassphrase);
      
      if (response.data) {
        setWalletInfo({
          has_wallet: true,
          wallet_address: response.data.wallet_address,
          balance: 0,
          is_active: true
        });
        
        setTransactionStatus({
          type: 'success',
          message: 'Wallet created successfully!'
        });
      }
    } catch (err) {
      console.error('Error creating wallet:', err);
      setTransactionStatus({
        type: 'error',
        message: err.formattedMessage || 'Failed to create wallet'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Send transaction
  const handleSendTransaction = async (e) => {
    e.preventDefault();
    
    if (!recipient) {
      setTransactionStatus({
        type: 'error',
        message: 'Please enter a recipient address'
      });
      return;
    }
    
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setTransactionStatus({
        type: 'error',
        message: 'Please enter a valid amount'
      });
      return;
    }
    
    try {
      setIsSending(true);
      setTransactionStatus({
        type: 'info',
        message: 'Sending transaction...'
      });
      
      // Use optional fee if provided
      const feeValue = fee && !isNaN(parseFloat(fee)) ? parseFloat(fee) : null;
      
      const response = await apiService.wallet.send(
        recipient,
        parseFloat(amount),
        memo,
        walletPassphrase,
        feeValue
      );
      
      if (response.data) {
        setTransactionStatus({
          type: 'success',
          message: 'Transaction sent successfully!'
        });
        
        // Clear form
        setRecipient('');
        setAmount('');
        setMemo('');
        setFee('');
        
        // Refresh data
        fetchWalletInfo();
        
        // Wait before fetching transaction history to allow backend to process
        setTimeout(() => {
          fetchTransactionHistory();
        }, 1000);
      }
    } catch (err) {
      console.error('Error sending transaction:', err);
      setTransactionStatus({
        type: 'error',
        message: err.formattedMessage || 'Failed to send transaction'
      });
    } finally {
      setIsSending(false);
    }
  };
  
  // Format status class based on type
  const getStatusClass = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 text-green-800 border border-green-200';
      case 'error':
        return 'bg-red-50 text-red-800 border border-red-200';
      case 'info':
      default:
        return 'bg-blue-50 text-blue-800 border border-blue-200';
    }
  };
  
  // Render passphrase form
  if (!passphraseSubmitted) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Access Your Wallet</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handlePassphraseSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wallet Passphrase
            </label>
            <input
              type="password"
              value={walletPassphrase}
              onChange={(e) => setWalletPassphrase(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your wallet passphrase"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Access Wallet
          </button>
        </form>
      </div>
    );
  }
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  // Show wallet creation form if no wallet exists
  if (walletInfo && !walletInfo.has_wallet) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Create a Wallet</h2>
        <p className="text-gray-600 mb-6">
          You don't have a blockchain wallet yet. Create one to start sending and receiving transactions.
        </p>
        
        {transactionStatus && (
          <div className={`mb-4 px-4 py-3 rounded ${getStatusClass(transactionStatus.type)}`}>
            {transactionStatus.message}
          </div>
        )}
        
        <button
          onClick={handleCreateWallet}
          disabled={isLoading}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
        >
          {isLoading ? 'Creating...' : 'Create Wallet'}
        </button>
      </div>
    );
  }
  
  // Show wallet dashboard
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Wallet Dashboard</h2>
        
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
          socketStatus === 'connected' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          <span className={`inline-block w-2 h-2 rounded-full mr-1 ${
            socketStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          {socketStatus === 'connected' ? 'Live Updates' : 'Offline'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-blue-600 mb-1">Balance</div>
          <div className="text-2xl font-bold">
            {walletInfo.balance ? parseFloat(walletInfo.balance).toFixed(8) : '0.00000000'} ORIG
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-sm text-green-600 mb-1">Status</div>
          <div className="font-bold">
            {walletInfo.is_active ? 'Active' : 'Inactive'}
          </div>
        </div>
        
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-sm text-purple-600 mb-1">Transaction Count</div>
          <div className="text-2xl font-bold">
            {transactions.length}
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <div className="font-medium text-gray-900 mb-2">Wallet Address</div>
        <div className="flex items-center">
          <div className="bg-gray-50 p-3 rounded font-mono text-sm break-all flex-grow">
            {walletInfo.wallet_address}
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(walletInfo.wallet_address);
              alert('Wallet address copied to clipboard');
            }}
            className="ml-2 p-2 text-blue-600 hover:text-blue-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
      
      {transactionStatus && (
        <div className={`mb-6 px-4 py-3 rounded ${getStatusClass(transactionStatus.type)}`}>
          {transactionStatus.message}
        </div>
      )}
      
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Send Transaction</h3>
        
        <form onSubmit={handleSendTransaction}>
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter recipient wallet address"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (ORIG)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00000000"
                step="0.00000001"
                min="0.00000001"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Fee (Optional)
              </label>
              <input
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Leave empty for default fee"
                step="0.00000001"
                min="0.00000001"
              />
              <p className="mt-1 text-xs text-gray-500">
                Higher fees may result in faster transaction confirmation.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Memo (Optional)
              </label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add an optional message"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
              >
                {isSending ? 'Sending...' : 'Send Transaction'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction History</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((tx) => (
                  <tr key={tx.id || tx.tx_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.is_outgoing 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {tx.is_outgoing ? 'Sent' : 'Received'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-mono text-gray-500">
                        {tx.is_outgoing
                          ? `To: ${tx.recipient ? tx.recipient.substring(0, 8) + '...' : 'N/A'}`
                          : `From: ${tx.sender ? tx.sender.substring(0, 8) + '...' : 'N/A'}`
                        }
                      </div>
                      {tx.memo && (
                        <div className="text-xs text-gray-400 mt-1">
                          Memo: {tx.memo.length > 20 ? tx.memo.substring(0, 20) + '...' : tx.memo}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${tx.is_outgoing ? 'text-red-600' : 'text-green-600'}`}>
                        {tx.is_outgoing ? '-' : '+'}{parseFloat(tx.amount).toFixed(8)} ORIG
                      </div>
                      {tx.fee && (
                        <div className="text-xs text-gray-400 mt-1">
                          Fee: {parseFloat(tx.fee).toFixed(8)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        tx.confirmed 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {tx.confirmed 
                          ? tx.block_index 
                            ? `Confirmed (Block ${tx.block_index})` 
                            : 'Confirmed' 
                          : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserWallet;