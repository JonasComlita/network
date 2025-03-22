// src/components/UserWallet.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import apiService from './apiService'; // Update path as needed

const UserWallet = ({ token }) => {
    // All state declarations
    const [walletInfo, setWalletInfo] = useState(null);
    const [transactionHistory, setTransactionHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [memo, setMemo] = useState('');
    const [isCreatingWallet, setIsCreatingWallet] = useState(false);
    const [isSendingTransaction, setIsSendingTransaction] = useState(false);
    const [socketStatus, setSocketStatus] = useState('disconnected');
    const [transactionStatus, setTransactionStatus] = useState(null);
    const [walletPassphrase, setWalletPassphrase] = useState('');
    
    // WebSocket reference
    const socketRef = useRef(null);
    
    // Helper function for custom fetch with error handling
    apiService.fetch = async (url, options = {}) => {
        try {
            const method = options.method || 'GET';
            const headers = options.headers || {};
            const body = options.body;
            
            const response = await fetch(`http://localhost:8000${url}`, {
                method,
                headers,
                body
            });
            
            const contentType = response.headers.get('content-type');
            const isJson = contentType && contentType.includes('application/json');
            const data = isJson ? await response.json() : await response.text();
            
            return {
                status: response.status,
                ok: response.ok,
                data,
                response
            };
        } catch (err) {
            console.error(`Fetch error for ${url}:`, err);
            err.response = {
                status: 0,
                data: { message: 'Network error' }
            };
            throw err;
        }
    };
    
    // Fetch wallet info with wallet_passphrase
    const fetchWalletInfo = useCallback(async () => {
        if (!token || !walletPassphrase) {
            setError('Please enter your wallet passphrase');
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await apiService.fetch(`/api/wallet/info/?wallet_passphrase=${encodeURIComponent(walletPassphrase)}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                setWalletInfo(response.data);
                setError(null);
            } else {
                // Log detailed error information to help with debugging
                console.error('API Error Details:', {
                    status: response.status,
                    statusText: response.statusText,
                    responseData: response.data
                });
                throw new Error(response.data.error || response.data.message || 'Failed to fetch wallet info');
            }
        } catch (err) {
            console.error('Error fetching wallet info:', err);
            console.error('Error response:', err.response);
            
            if (err.response && err.response.status === 404) {
                setWalletInfo({ has_wallet: false });
            } else if (err.response && err.response.status === 400) {
                setError('Incorrect wallet passphrase. Please try again.');
            } else if (err.response && err.response.status === 500) {
                setError('Server error: The backend is using async handlers incorrectly. Please contact the developer with this message: "Use database_sync_to_async for database operations in async views".');
                // The backend needs to be fixed - see the recommended fix in console
            } else {
                setError(err.message || 'Failed to load wallet information. Please try again later.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [token, walletPassphrase]);

    // Function to fetch transaction history
    const fetchTransactionHistory = useCallback(async () => {
        if (!token || !walletInfo?.has_wallet) return;
        
        try {
            const response = await apiService.fetch(`/api/wallet/history/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setTransactionHistory(response.data);
        } catch (err) {
            console.error('Error fetching transaction history:', err);
            // Don't set an error state here as it's not critical
        }
    }, [token, walletInfo]);
    
    // Function to connect to WebSocket
    const connectWebSocket = useCallback(() => {
        if (!token || !walletInfo?.has_wallet) return;
        
        // Close existing connection if it exists
        if (socketRef.current) {
            socketRef.current.close();
        }
        
        // Create new WebSocket connection
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = "8000"; // Backend port
        const timestamp = new Date().getTime();
        
        const ws = new WebSocket(`${protocol}//${host}:${port}/ws/wallet/?token=${token}&t=${timestamp}`);
        
        ws.onopen = () => {
            setSocketStatus('connected');
            console.log('Wallet WebSocket connected');
            
            // Send authentication message
            ws.send(JSON.stringify({ token }));
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('Wallet WebSocket received:', data);
                
                if (data.type === 'balance_update') {
                    // Update wallet balance
                    setWalletInfo(prev => ({
                        ...prev,
                        balance: data.balance
                    }));
                } 
                else if (data.type === 'wallet_status') {
                    // Update wallet info
                    setWalletInfo(prev => ({
                        ...prev,
                        has_wallet: data.has_wallet,
                        wallet_address: data.wallet_address,
                        balance: data.balance,
                        is_active: data.status === 'active'
                    }));
                }
                else if (data.type === 'transaction_update') {
                    // Add new transaction to history
                    setTransactionHistory(prev => [data.transaction, ...prev]);
                } 
                else if (data.type === 'error') {
                    console.error('WebSocket error message:', data.message);
                }
            } catch (err) {
                console.error('Error parsing WebSocket message:', err);
            }
        };
        
        ws.onerror = (error) => {
            console.error('Wallet WebSocket error:', error);
            setSocketStatus('error');
        };
        
        ws.onclose = () => {
            console.log('Wallet WebSocket closed');
            setSocketStatus('disconnected');
            
            // Attempt to reconnect after a delay
            setTimeout(() => {
                if (document.visibilityState !== 'hidden') {
                    connectWebSocket();
                }
            }, 5000);
        };
        
        socketRef.current = ws;
        
    }, [token, walletInfo]);

    // Initial fetch with dependency on walletPassphrase
    useEffect(() => {
        if (token && walletPassphrase) {
            fetchWalletInfo();
        }
    }, [token, walletPassphrase, fetchWalletInfo]);
    
    // Fetch transaction history when wallet info is available
    useEffect(() => {
        if (walletInfo?.has_wallet) {
            fetchTransactionHistory();
        }
    }, [walletInfo, fetchTransactionHistory]);
    
    // Connect to WebSocket when wallet info is available
    useEffect(() => {
        if (walletInfo?.has_wallet) {
            connectWebSocket();
        }
        
        // Cleanup function
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, [walletInfo, connectWebSocket]);
    
    // Handle page visibility changes to reconnect WebSocket
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && 
                socketStatus === 'disconnected' &&
                walletInfo?.has_wallet) {
                connectWebSocket();
            }
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [socketStatus, walletInfo, connectWebSocket]);
    
    // Function to create a new wallet
    const createWallet = async () => {
        if (!token) return;
        
        try {
            setIsCreatingWallet(true);
            setTransactionStatus(null);
            
            const response = await apiService.fetch(`/api/wallet/create/`, {
                method: 'POST',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            console.log('Create wallet response:', response);
            
            if (response.status >= 200 && response.status < 300) {
                // Success - update wallet info
                setWalletInfo({
                    has_wallet: true,
                    wallet_address: response.data.wallet_address,
                    balance: 0,
                    is_active: true,
                    created_at: new Date().toISOString()
                });
                
                setTransactionStatus({
                    type: 'success',
                    message: response.data.message || 'Wallet created successfully!'
                });
                
                // Reconnect WebSocket with the new wallet
                connectWebSocket();
            } else {
                throw new Error(response.data?.message || 'Failed to create wallet');
            }
            
        } catch (err) {
            console.error('Error creating wallet:', err);
            console.error('Error details:', err.response?.data);
            
            setTransactionStatus({
                type: 'error',
                message: err.response?.data?.message || err.message || 'Failed to create wallet'
            });
        } finally {
            setIsCreatingWallet(false);
        }
    };
    
    // Function to send a transaction
    const sendTransaction = async (e) => {
        e.preventDefault();
        if (!token || !walletInfo?.has_wallet) return;
        
        if (!recipient || !amount) {
            setTransactionStatus({
                type: 'error',
                message: 'Recipient address and amount are required'
            });
            return;
        }
        
        try {
            setIsSendingTransaction(true);
            setTransactionStatus(null);
            
            const response = await apiService.fetch(`/api/wallet/send/`, {
                method: 'POST',
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ recipient, amount, memo })
            });
            
            if (response.status >= 200 && response.status < 300) {
                setTransactionStatus({
                    type: 'success',
                    message: response.data.message || 'Transaction sent successfully!'
                });
                
                // Clear form
                setRecipient('');
                setAmount('');
                setMemo('');
                
                // Request updated balance and history
                fetchWalletInfo();
                fetchTransactionHistory();
            } else {
                throw new Error(response.data?.message || 'Failed to send transaction');
            }
            
        } catch (err) {
            console.error('Error sending transaction:', err);
            
            setTransactionStatus({
                type: 'error',
                message: err.response?.data?.message || err.message || 'Failed to send transaction'
            });
        } finally {
            setIsSendingTransaction(false);
        }
    };

    // Render passphrase input if not set
    if (!walletPassphrase) {
        return (
            <div className="p-6 border rounded shadow">
                <h2 className="text-xl font-bold mb-4">Enter Wallet Passphrase</h2>
                <p className="text-gray-600 mb-4">
                    Please enter the wallet passphrase you set during registration to access your wallet.
                </p>
                {error && (
                    <div className="p-3 mb-4 bg-red-50 text-red-700 border border-red-200 rounded">
                        {error}
                    </div>
                )}
                <input
                    type="password"
                    value={walletPassphrase}
                    onChange={(e) => setWalletPassphrase(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                    placeholder="Enter your wallet passphrase"
                />
                <button
                    onClick={fetchWalletInfo}
                    disabled={!walletPassphrase || isLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                    {isLoading ? 'Loading...' : 'Submit'}
                </button>
            </div>
        );
    }
    
    // Render loading state
    if (isLoading) {
        return (
            <div className="p-4 border rounded shadow animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
        );
    }
    
    // Render error state
    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded">
                <h2 className="text-lg font-bold text-red-700 mb-2">Error</h2>
                <p className="text-red-600">{error}</p>
                <button 
                    onClick={fetchWalletInfo}
                    className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }
    
    // Render "create wallet" view if user doesn't have a wallet
    if (!walletInfo?.has_wallet) {
        return (
            <div className="p-6 border rounded shadow">
                <h2 className="text-xl font-bold mb-4">Create Your Wallet</h2>
                <p className="text-gray-600 mb-4">
                    You don't have a blockchain wallet yet. Create one to start sending and receiving transactions.
                </p>
                
                {transactionStatus && (
                    <div className={`p-3 mb-4 rounded ${
                        transactionStatus.type === 'success' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {transactionStatus.message}
                    </div>
                )}
                
                <button 
                    onClick={createWallet}
                    disabled={isCreatingWallet}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                >
                    {isCreatingWallet ? 'Creating Wallet...' : 'Create Wallet'}
                </button>
            </div>
        );
    }
    
    // Render main wallet view
    return (
        <div className="p-6 border rounded shadow">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Your Wallet</h2>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    socketStatus === 'connected' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }`}>
                    {socketStatus === 'connected' ? 'Live Updates' : 'Offline'}
                </div>
            </div>
            
            <div className="mb-6">
                <div className="mb-2 text-sm text-gray-500">Wallet Address</div>
                <div className="flex items-center">
                    <div className="font-mono bg-gray-50 p-2 rounded border break-all">
                        {walletInfo.wallet_address}
                    </div>
                    <button 
                        onClick={() => navigator.clipboard.writeText(walletInfo.wallet_address)}
                        className="ml-2 p-2 text-blue-600 hover:bg-blue-50 rounded"
                        title="Copy to clipboard"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                        </svg>
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="bg-blue-50 p-4 rounded">
                    <div className="text-sm text-blue-600 mb-1">Balance</div>
                    <div className="text-2xl font-bold">{(walletInfo.balance || 0).toFixed(8)} ORIG</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded">
                    <div className="text-sm text-green-600 mb-1">Status</div>
                    <div className="font-bold">
                        {walletInfo.is_active ? 'Active' : 'Inactive'}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        Created {new Date(walletInfo.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>
            
            {transactionStatus && (
                <div className={`p-3 mb-4 rounded ${
                    transactionStatus.type === 'success' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {transactionStatus.message}
                </div>
            )}
            
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Send Transaction</h3>
                <form onSubmit={sendTransaction}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Recipient Address
                        </label>
                        <input
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="Enter recipient's wallet address"
                            required
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount (ORIG)
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            step="0.00000001"
                            min="0.00000001"
                            className="w-full p-2 border rounded"
                            placeholder="Enter amount to send"
                            required
                        />
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Memo (Optional)
                        </label>
                        <input
                            type="text"
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            className="w-full p-2 border rounded"
                            placeholder="Add an optional message"
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={isSendingTransaction}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {isSendingTransaction ? 'Sending...' : 'Send Transaction'}
                    </button>
                </form>
            </div>
            
            <div>
                <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
                
                {transactionHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        No transactions yet
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Address
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {transactionHistory.map((tx, index) => (
                                    <tr key={tx.tx_id || index}>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                tx.is_outgoing 
                                                    ? 'bg-red-100 text-red-800' 
                                                    : 'bg-green-100 text-green-800'
                                            }`}>
                                                {tx.is_outgoing ? 'Sent' : 'Received'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={tx.is_outgoing ? 'text-red-600' : 'text-green-600'}>
                                                {tx.is_outgoing ? '-' : '+'}{tx.amount.toFixed(8)} ORIG
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap font-mono text-sm">
                                            {tx.is_outgoing 
                                                ? `To: ${tx.recipient.substring(0, 8)}...` 
                                                : `From: ${tx.sender.substring(0, 8)}...`}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(tx.timestamp).toLocaleString()}
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