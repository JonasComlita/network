// apiService.js - Enhanced API handling for blockchain dashboard
import axios from 'axios';

// Configurable base URL - this allows easy switching between environments
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Create a configurable axios instance with improved defaults
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000, // 15 second timeout - increased for blockchain operations
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to add auth token with better error handling
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add debugging info in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`, config);
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced error handling and token refresh
api.interceptors.response.use(
  (response) => {
    // Add debugging info in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    // Enhanced error logging
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // Handle token expiration (401)
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          // Refreshing token logic
          const refreshResponse = await axios.post(`${BASE_URL}/token/refresh/`, {
            refresh: refreshToken
          });
          
          if (refreshResponse.data.access) {
            // Update tokens
            localStorage.setItem('token', refreshResponse.data.access);
            
            // Retry original request
            error.config.headers['Authorization'] = `Bearer ${refreshResponse.data.access}`;
            return api(error.config);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Clear tokens on refresh failure
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          
          // Redirect to login
          window.location.href = '/login';
          return Promise.reject(new Error('Session expired. Please log in again.'));
        }
      } else {
        // No refresh token, clear tokens
        localStorage.removeItem('token');
        console.log('Authentication error: You may need to log in again');
        
        // Redirect to login if appropriate
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }

    // Format error message for UI
    const errorMessage = error.response?.data?.detail || 
                        error.response?.data?.message ||
                        error.message || 
                        'An unknown error occurred';
                        
    // Attach formatted message to error
    error.formattedMessage = errorMessage;

    return Promise.reject(error);
  }
);

// Fetch with retry functionality
const fetchWithRetry = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check if token exists before making the request
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        throw new Error('Authentication token is missing');
      }
      
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Handle 401 errors with token refresh
      if (error.response && error.response.status === 401) {
        try {
          // Try to refresh the token
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const refreshResponse = await axios.post(`${BASE_URL}/token/refresh/`, {
              refresh: refreshToken
            });
            
            if (refreshResponse.data.access) {
              // Update token
              localStorage.setItem('token', refreshResponse.data.access);
              console.log('Token refreshed successfully');
              
              // Try the request again with the new token
              continue;
            }
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // Clear tokens on refresh failure
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          
          // Redirect to login
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }
      }
      
      // Don't retry on client errors (4xx) except for 401 (already handled), 429 (rate limiting) and 408 (timeout)
      if (error.response && 
          error.response.status >= 400 && 
          error.response.status < 500 && 
          error.response.status !== 429 && 
          error.response.status !== 408) {
        break;
      }
      
      // If we've reached max retries, throw the error
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate backoff delay with jitter for distributed systems
      const jitter = Math.random() * 0.3 + 0.85; // between 0.85 and 1.15
      const retryDelay = delay * Math.pow(2, attempt) * jitter;
      console.log(`Retrying API call in ${Math.round(retryDelay)}ms... (Attempt ${attempt + 1}/${maxRetries})`);
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw lastError;
};

// Authentication methods
const authService = {
  login: async (username, password) => {
    try {
      const response = await api.post('/token/', { username, password });
      
      if (response.data.access) {
        localStorage.setItem('token', response.data.access);
        if (response.data.refresh) {
          localStorage.setItem('refresh_token', response.data.refresh);
        }
      }
      
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      // Ensure we're sending the right format
      const formattedData = {
        username: userData.username,
        email: userData.email,
        password: userData.password,
        wallet_passphrase: userData.wallet_passphrase
      };
      
      // Only add these fields if they exist and are boolean
      if (typeof userData.is_admin === 'boolean') {
        formattedData.is_admin = userData.is_admin;
      }
      
      if (typeof userData.is_miner === 'boolean') {
        formattedData.is_miner = userData.is_miner;
      }
      
      const response = await api.post('/register/', formattedData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

// API service methods
const apiService = {
  // Auth methods
  auth: authService,
  
  // Blocks endpoints
  getBlocks: () => fetchWithRetry(() => api.get('/blocks/')),
  getBlockById: (id) => fetchWithRetry(() => api.get(`/blocks/${id}/`)),
  
  // Transactions endpoints
  getTransactionsByBlockId: (blockId) => fetchWithRetry(() => api.get(`/transactions/?block_id=${blockId}`)),
  getTransactionById: (id) => fetchWithRetry(() => api.get(`/transactions/${id}/`)),
  
  // Analytics endpoints
  getAnalytics: () => fetchWithRetry(() => api.get('/analytics/')),
  getSentimentData: () => fetchWithRetry(() => api.get('/sentiment/')),
  getPriceData: () => fetchWithRetry(() => api.get('/price/')),
  
  // Notifications endpoints
  getNotifications: () => fetchWithRetry(() => api.get('/notifications/')),
  markNotificationAsRead: (id) => fetchWithRetry(() => api.patch(`/notifications/${id}/`, { is_read: true })),
  
  // Health check
  healthCheck: () => fetchWithRetry(() => api.get('/health-check/')),
  
  // User profile and preferences
  getUserProfile: () => fetchWithRetry(() => api.get('/user_profile/')),
  updateUserProfile: (data) => fetchWithRetry(() => api.patch('/user_profile/', data)),
  getUserPreferences: () => fetchWithRetry(() => api.get('/user_preferences/')),
  updateUserPreferences: (data) => fetchWithRetry(() => api.patch('/user_preferences/', data)),
  
  // Dashboard data
  getDashboard: () => fetchWithRetry(() => api.get('/dashboard/')),
  
  // Wallet methods
  wallet: {
    getInfo: () => fetchWithRetry(() => api.get('/wallet/info/')),
    getHistory: () => fetchWithRetry(() => api.get('/wallet/history/')),
    create: () => fetchWithRetry(() => api.post('/wallet/create/')),
    send: (recipient, amount, memo = '') => 
      fetchWithRetry(() => api.post('/wallet/send/', { recipient, amount, memo }))
  },
  
  // WebSocket helper with improved token handling
  createWebSocketConnection: (endpoint) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = process.env.REACT_APP_WS_PORT || "8000"; // Backend port
    const timestamp = new Date().getTime();
    const token = localStorage.getItem('token');
    
     // Clean the endpoint to avoid double slashes
  const cleanEndpoint = endpoint.replace(/^\/|\/$/g, '');
  
  // Ensure endpoints match the routes defined in routing.py
  return new WebSocket(`${protocol}//${host}:${port}/ws/${cleanEndpoint}/?token=${token}&t=${timestamp}`);
  }
};

apiService.wallet = {
  ...apiService.wallet, // Keep existing methods
  
  // Enhanced wallet info method with passphrase support
  getInfo: (walletPassphrase = null) => {
    let url = '/wallet/info/';
    if (walletPassphrase) {
      url += `?wallet_passphrase=${encodeURIComponent(walletPassphrase)}`;
    }
    return apiService.fetchWithRetry(() => apiService.api.get(url));
  },
  
  // Enhanced wallet creation with passphrase support
  create: (walletPassphrase = null) => {
    const data = walletPassphrase ? { wallet_passphrase: walletPassphrase } : {};
    return apiService.fetchWithRetry(() => apiService.api.post('/wallet/create/', data));
  },
  
  // Enhanced send transaction with passphrase and optional fee
  send: (recipient, amount, memo = '', walletPassphrase = null, fee = null) => {
    const data = { recipient, amount, memo };
    
    if (walletPassphrase) {
      data.wallet_passphrase = walletPassphrase;
    }
    
    if (fee !== null) {
      data.fee = fee;
    }
    
    return apiService.fetchWithRetry(() => apiService.api.post('/wallet/send/', data));
  },
  
  // Add backup wallet method
  backup: (walletPassphrase) => {
    return apiService.fetchWithRetry(() => 
      apiService.api.post('/wallet/backup/', { wallet_passphrase: walletPassphrase }));
  },
  
  // Add restore wallet method
  restore: (backupData, walletPassphrase) => {
    return apiService.fetchWithRetry(() => 
      apiService.api.post('/wallet/restore/', { 
        backup_data: backupData, 
        wallet_passphrase: walletPassphrase 
      }));
  },
  
  // Get transaction status
  getTransactionStatus: (txId) => {
    return apiService.fetchWithRetry(() => 
      apiService.api.get(`/wallet/transaction/${txId}/status/`));
  }
};

// Extended blockchain analytics methods
apiService.blockchain = {
  // Get blockchain overview stats
  getOverview: () => 
    apiService.fetchWithRetry(() => apiService.api.get('/blockchain/overview/')),
  
  // Get detailed block information
  getBlock: (blockId) => 
    apiService.fetchWithRetry(() => apiService.api.get(`/blockchain/block/${blockId}/`)),
  
  // Get transactions for a specific block
  getBlockTransactions: (blockId) => 
    apiService.fetchWithRetry(() => apiService.api.get(`/blockchain/block/${blockId}/transactions/`)),
  
  // Get mining statistics
  getMiningStats: () => 
    apiService.fetchWithRetry(() => apiService.api.get('/blockchain/mining/stats/')),
  
  // Get blockchain transaction volume over time
  getTransactionVolume: (timeframe = 'week') => 
    apiService.fetchWithRetry(() => apiService.api.get(`/blockchain/analytics/volume/?timeframe=${timeframe}`)),
  
  // Get blockchain health metrics
  getHealthMetrics: () => 
    apiService.fetchWithRetry(() => apiService.api.get('/blockchain/health/')),
  
  // Get node info
  getNodeInfo: () => 
    apiService.fetchWithRetry(() => apiService.api.get('/blockchain/node/')),
  
  // Search the blockchain (blocks, transactions, addresses)
  search: (query) => 
    apiService.fetchWithRetry(() => apiService.api.get(`/blockchain/search/?q=${encodeURIComponent(query)}`))
};

// Enhanced WebSocket manager with reconnection logic
apiService.createWebSocketWithReconnect = (endpoint, options = {}) => {
  const {
    onOpen,
    onMessage,
    onError,
    onClose,
    maxReconnectAttempts = 10,
    reconnectInterval = 1000,
    maxReconnectInterval = 30000,
    reconnectDecay = 1.5
  } = options;
  
  // Create standard WebSocket
  const ws = apiService.createWebSocketConnection(endpoint);
  
  let reconnectAttempts = 0;
  let reconnectTimer = null;
  let forceClosed = false;
  
  // Calculate reconnect delay with exponential backoff
  const getReconnectDelay = () => {
    return Math.min(
      reconnectInterval * Math.pow(reconnectDecay, reconnectAttempts),
      maxReconnectInterval
    );
  };
  
  // Function to reconnect
  const reconnect = () => {
    if (forceClosed || reconnectAttempts >= maxReconnectAttempts) {
      console.log(
        forceClosed 
          ? 'WebSocket was manually closed, not reconnecting' 
          : 'Maximum reconnect attempts reached'
      );
      return;
    }
    
    reconnectAttempts++;
    const delay = getReconnectDelay();
    
    console.log(`WebSocket reconnecting in ${Math.round(delay / 1000)}s... (Attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
    
    reconnectTimer = setTimeout(() => {
      const newWs = apiService.createWebSocketConnection(endpoint);
      
      // Copy event handlers to new WebSocket
      if (onOpen) newWs.onopen = onOpen;
      if (onMessage) newWs.onmessage = onMessage;
      if (onError) newWs.onerror = onError;
      if (onClose) newWs.onclose = handleClose;
      
      Object.assign(ws, newWs);
    }, delay);
  };
  
  // Handle close event and reconnect if needed
  const handleClose = (event) => {
    if (onClose) onClose(event);
    
    // Only reconnect for abnormal closures
    const shouldReconnect = !forceClosed && 
                           event.code !== 1000 && // Normal closure
                           event.code !== 1001;   // Going away
    
    if (shouldReconnect) {
      reconnect();
    }
  };
  
  // Set up event handlers
  if (onOpen) ws.onopen = onOpen;
  if (onMessage) ws.onmessage = onMessage;
  if (onError) ws.onerror = onError;
  ws.onclose = handleClose;
  
  // Add custom methods to WebSocket
  ws.forceClose = () => {
    forceClosed = true;
    clearTimeout(reconnectTimer);
    ws.close();
  };
  
  return ws;
};

export default apiService;