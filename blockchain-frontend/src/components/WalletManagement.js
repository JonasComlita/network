import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, Clock, Copy, Wallet, CheckCircle, XCircle, Shield, Plus } from 'lucide-react';
import apiService from './apiService';

const WalletManager = () => {
  // State for wallets and transactions
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('wallets');
  
  // Dialog states
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [createWalletDialogOpen, setCreateWalletDialogOpen] = useState(false);
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  
  // Form states
  const [sendForm, setSendForm] = useState({
    recipient: '',
    amount: '',
    memo: '',
    wallet_passphrase: ''
  });
  
  const [createWalletForm, setCreateWalletForm] = useState({
    wallet_name: '',
    wallet_passphrase: '',
    confirm_passphrase: ''
  });
  
  const [backupForm, setBackupForm] = useState({
    wallet_passphrase: ''
  });
  
  // Status messages
  const [statusMessage, setStatusMessage] = useState(null);
  
  // Fetch wallets on component mount
  useEffect(() => {
    fetchWallets();
  }, []);
  
  // Fetch wallets from API
  const fetchWallets = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.wallet.getWallets();
      
      if (response.data && response.data.length > 0) {
        setWallets(response.data);
        
        // Set the primary wallet as selected
        const primaryWallet = response.data.find(w => w.is_primary) || response.data[0];
        setSelectedWallet(primaryWallet);
        
        // Load transactions for the selected wallet
        if (primaryWallet) {
          await fetchTransactionsForWallet(primaryWallet.wallet_address);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching wallets:', err);
      setError(err.formattedMessage || 'Failed to load wallet information');
      setWallets([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch transactions for a specific wallet
  const fetchTransactionsForWallet = async (walletAddress) => {
    try {
      const response = await apiService.wallet.getWalletTransactions(walletAddress);
      if (response.data) {
        setTransactions(response.data);
      } else {
        setTransactions([]);
      }
    } catch (err) {
      console.error(`Error fetching transactions for wallet ${walletAddress}:`, err);
      setTransactions([]);
    }
  };
  
  // Update transactions when selected wallet changes
  useEffect(() => {
    if (selectedWallet) {
      fetchTransactionsForWallet(selectedWallet.wallet_address);
    }
  }, [selectedWallet]);
  
  // Handle wallet selection
  const handleWalletSelect = (wallet) => {
    setSelectedWallet(wallet);
  };
  
  // Handle send transaction form submit
  const handleSendTransaction = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!sendForm.recipient || !sendForm.amount || !sendForm.wallet_passphrase) {
      setStatusMessage({
        type: 'error',
        message: 'Recipient address, amount, and wallet passphrase are required.'
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Send transaction using the API
      const response = await apiService.wallet.sendFromWallet(
        selectedWallet.wallet_address,
        sendForm.recipient,
        parseFloat(sendForm.amount),
        sendForm.memo,
        sendForm.wallet_passphrase
      );
      
      setStatusMessage({
        type: 'success',
        message: 'Transaction sent successfully!'
      });
      
      // Clear form
      setSendForm({
        recipient: '',
        amount: '',
        memo: '',
        wallet_passphrase: ''
      });
      
      // Close dialog
      setSendDialogOpen(false);
      
      // Refresh wallet and transactions
      await fetchWallets();
      await fetchTransactionsForWallet(selectedWallet.wallet_address);
      
    } catch (err) {
      console.error('Error sending transaction:', err);
      setStatusMessage({
        type: 'error',
        message: err.formattedMessage || 'Failed to send transaction'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle create wallet form submit
  const handleCreateWallet = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!createWalletForm.wallet_name || !createWalletForm.wallet_passphrase) {
      setStatusMessage({
        type: 'error',
        message: 'Wallet name and passphrase are required.'
      });
      return;
    }
    
    if (createWalletForm.wallet_passphrase !== createWalletForm.confirm_passphrase) {
      setStatusMessage({
        type: 'error',
        message: 'Passphrases do not match.'
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Create wallet using the API
      const response = await apiService.wallet.createNamed(
        createWalletForm.wallet_name,
        createWalletForm.wallet_passphrase
      );
      
      setStatusMessage({
        type: 'success',
        message: 'Wallet created successfully!'
      });
      
      // Clear form
      setCreateWalletForm({
        wallet_name: '',
        wallet_passphrase: '',
        confirm_passphrase: ''
      });
      
      // Close dialog
      setCreateWalletDialogOpen(false);
      
      // Refresh wallets
      await fetchWallets();
      
    } catch (err) {
      console.error('Error creating wallet:', err);
      setStatusMessage({
        type: 'error',
        message: err.formattedMessage || 'Failed to create wallet'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle wallet backup
  const handleBackupWallet = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!backupForm.wallet_passphrase) {
      setStatusMessage({
        type: 'error',
        message: 'Wallet passphrase is required.'
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Backup wallet using the API
      const response = await apiService.wallet.backupWallet(
        selectedWallet.wallet_address,
        backupForm.wallet_passphrase
      );
      
      setStatusMessage({
        type: 'success',
        message: 'Wallet backed up successfully!'
      });
      
      // Clear form
      setBackupForm({
        wallet_passphrase: ''
      });
      
      // Close dialog
      setBackupDialogOpen(false);
      
    } catch (err) {
      console.error('Error backing up wallet:', err);
      setStatusMessage({
        type: 'error',
        message: err.formattedMessage || 'Failed to backup wallet'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Set primary wallet
  const handleSetPrimary = async (wallet) => {
    if (wallet.is_primary) return; // Already primary
    
    try {
      setIsLoading(true);
      const response = await apiService.wallet.setPrimary(wallet.wallet_address);
      
      setStatusMessage({
        type: 'success',
        message: `${wallet.wallet_name} set as primary wallet`
      });
      
      // Refresh wallets
      await fetchWallets();
      
    } catch (err) {
      console.error('Error setting primary wallet:', err);
      setStatusMessage({
        type: 'error',
        message: err.formattedMessage || 'Failed to set primary wallet'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };
  
  // Format amount for display with + or - prefix
  const formatAmount = (amount, isOutgoing) => {
    return `${isOutgoing ? '-' : '+'} ${parseFloat(amount).toFixed(8)}`;
  };
  
  // Render loading state
  if (isLoading && !wallets.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Render error state
  if (error && !wallets.length) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded p-4">
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-500 mr-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Status message */}
      {statusMessage && (
        <div className={`${
          statusMessage.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        } border rounded p-4 mb-4`}>
          <div className="flex">
            {statusMessage.type === 'success' 
              ? <CheckCircle className="h-5 w-5 text-green-500 mr-2" /> 
              : <XCircle className="h-5 w-5 text-red-500 mr-2" />}
            <p>{statusMessage.message}</p>
          </div>
        </div>
      )}
      
      {/* Wallet navigation tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('wallets')}
            className={`${
              activeTab === 'wallets'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
          >
            Wallets
          </button>
          
          {selectedWallet && (
            <button
              onClick={() => setActiveTab('transactions')}
              className={`${
                activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm`}
            >
              Transactions
            </button>
          )}
        </nav>
      </div>
      
      {/* Tab content */}
      <div className="p-6">
        {/* Wallets Tab */}
        {activeTab === 'wallets' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-800">Your Wallets</h2>
              
              <button
                onClick={() => setCreateWalletDialogOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Wallet
              </button>
            </div>
            
            {wallets.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Wallet className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No wallets</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new wallet.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setCreateWalletDialogOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Wallet
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {wallets.map((wallet) => (
                  <div 
                    key={wallet.wallet_address}
                    className={`${
                      selectedWallet?.wallet_address === wallet.wallet_address
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    } border rounded-lg p-4 cursor-pointer transition-colors`}
                    onClick={() => handleWalletSelect(wallet)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">{wallet.wallet_name}</h3>
                          {wallet.is_primary && (
                            <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Primary
                            </span>
                          )}
                          {!wallet.is_primary && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetPrimary(wallet);
                              }}
                              className="ml-2 text-xs text-blue-500 hover:underline"
                            >
                              Set as primary
                            </button>
                          )}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500">
                          <span className="font-mono">{wallet.display_address}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(wallet.wallet_address);
                              // Show temporary success message
                              setStatusMessage({
                                type: 'success',
                                message: 'Wallet address copied to clipboard'
                              });
                              setTimeout(() => setStatusMessage(null), 2000);
                            }}
                            className="ml-2 text-gray-400 hover:text-gray-500"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-2 text-sm text-gray-500">
                          Created {formatDate(wallet.created_at)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {parseFloat(wallet.balance).toFixed(8)}
                        </div>
                        <div className="text-sm text-gray-500">Current balance</div>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWallet(wallet);
                          setSendDialogOpen(true);
                        }}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Send
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWallet(wallet);
                          setBackupDialogOpen(true);
                        }}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Backup
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Transactions Tab */}
        {activeTab === 'transactions' && selectedWallet && (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Transaction History: {selectedWallet.wallet_name}
            </h2>
            
            {transactions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This wallet has no transaction history yet.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map((tx) => (
                      <tr key={tx.tx_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            tx.is_outgoing 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {tx.is_outgoing ? (
                              <>
                                <ArrowUpRight className="h-3 w-3 mr-1" />
                                Sent
                              </>
                            ) : (
                              <>
                                <ArrowDownLeft className="h-3 w-3 mr-1" />
                                Received
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-mono text-gray-500">
                            {tx.is_outgoing
                              ? `To: ${tx.display_recipient || tx.recipient?.substring(0, 8) + '...'}`
                              : `From: ${tx.display_sender || tx.sender?.substring(0, 8) + '...'}`
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
                            {formatAmount(tx.amount, tx.is_outgoing)}
                          </div>
                          {tx.fee > 0 && (
                            <div className="text-xs text-gray-400 mt-1">
                              Fee: {parseFloat(tx.fee).toFixed(8)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {formatDate(tx.timestamp)}
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
        )}
      </div>
      
      {/* Send Transaction Dialog */}
      {sendDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Send Transaction</h3>
              
              <form onSubmit={handleSendTransaction}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="recipient" className="block text-sm font-medium text-gray-700 mb-1">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      id="recipient"
                      value={sendForm.recipient}
                      onChange={(e) => setSendForm({...sendForm, recipient: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter recipient wallet address"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      id="amount"
                      value={sendForm.amount}
                      onChange={(e) => setSendForm({...sendForm, amount: e.target.value})}
                      step="0.00000001"
                      min="0.00000001"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00000000"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">
                      Memo (Optional)
                    </label>
                    <input
                      type="text"
                      id="memo"
                      value={sendForm.memo}
                      onChange={(e) => setSendForm({...sendForm, memo: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a memo for this transaction"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="wallet_passphrase" className="block text-sm font-medium text-gray-700 mb-1">
                      Wallet Passphrase
                    </label>
                    <input
                      type="password"
                      id="wallet_passphrase"
                      value={sendForm.wallet_passphrase}
                      onChange={(e) => setSendForm({...sendForm, wallet_passphrase: e.target.value})}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter your wallet passphrase"
                      required
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setSendDialogOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Send Transaction
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletManager;