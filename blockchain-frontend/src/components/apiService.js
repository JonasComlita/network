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
  },

  // Email verification methods
  verifyEmail: async (token) => {
    try {
      const response = await api.get(`/verify-email/${token}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Password reset methods
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/password-reset/request/', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  confirmPasswordReset: async (token, newPassword) => {
    try {
      const response = await api.post(`/password-reset/confirm/${token}/`, { 
        new_password: newPassword 
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// User profile methods
const profileService = {
  // Get user profile information
  getProfile: () => fetchWithRetry(() => api.get('/user/profile/')),
  
  // Update user profile
  updateProfile: (data) => fetchWithRetry(() => api.patch('/user/profile/', data)),
  
  // Get user preferences
  getPreferences: () => fetchWithRetry(() => api.get('/user/preferences/')),
  
  // Update user preferences
  updatePreferences: (data) => fetchWithRetry(() => api.patch('/user/preferences/', data)),
  
  // Change password
  changePassword: (currentPassword, newPassword) => fetchWithRetry(() => 
    api.post('/user/change-password/', { 
      current_password: currentPassword, 
      new_password: newPassword 
    })
  ),
  
  // 2FA setup methods
  setup2FA: () => fetchWithRetry(() => api.post('/user/2fa/setup/')),
  
  verify2FASetup: (code) => fetchWithRetry(() => 
    api.post('/user/2fa/verify-setup/', { code })
  ),
  
  disable2FA: (code) => fetchWithRetry(() => 
    api.post('/user/2fa/disable/', { code })
  )
};

// API service methods
const apiService = {
  // Auth methods
  auth: authService,

  // Profile methods
  profile: profileService,
  
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
  
  // Dashboard data
  getDashboard: () => fetchWithRetry(() => api.get('/dashboard/')),
  
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
  },
  
  // Wallet methods
  wallet: {
    // Get wallet info with passphrase support
    getInfo: (walletPassphrase = null) => {
      let url = '/wallet/info/';
      if (walletPassphrase) {
        url += `?wallet_passphrase=${encodeURIComponent(walletPassphrase)}`;
      }
      return fetchWithRetry(() => api.get(url));
    },
    
    // Get wallet history
    getHistory: () => 
      fetchWithRetry(() => api.get('/wallet/history/')),
    
    // Create wallet with passphrase
    create: (walletPassphrase = null) => {
      const data = walletPassphrase ? { wallet_passphrase: walletPassphrase } : {};
      return fetchWithRetry(() => api.post('/wallet/create/', data));
    },
    
    // Send transaction
    send: (recipient, amount, memo = '', walletPassphrase = null, fee = null) => {
      const data = { recipient, amount, memo };
      
      if (walletPassphrase) {
        data.wallet_passphrase = walletPassphrase;
      }
      
      if (fee !== null) {
        data.fee = fee;
      }
      
      return fetchWithRetry(() => api.post('/wallet/send/', data));
    },
    
    // Get wallet balance
    getBalance: () => 
      fetchWithRetry(() => api.get('/wallet/balance/')),
    
    // Get all wallets for the current user
    getWallets: () => 
      fetchWithRetry(() => api.get('/wallets/')),
    
    // Get a specific wallet
    getWallet: (walletAddress) => 
      fetchWithRetry(() => api.get(`/wallets/${walletAddress}/`)),
    
    // Set a wallet as primary
    setPrimary: (walletAddress) => 
      fetchWithRetry(() => api.patch(`/wallets/${walletAddress}/`, { is_primary: true })),
    
    // Get transaction history for a specific wallet
    getWalletTransactions: (walletAddress, limit = 50) => 
      fetchWithRetry(() => api.get(`/wallets/${walletAddress}/transactions/?limit=${limit}`)),
    
    // Create a new named wallet
    createNamed: (walletName, walletPassphrase) => 
      fetchWithRetry(() => api.post('/wallets/', { 
        wallet_name: walletName, 
        wallet_passphrase: walletPassphrase 
      })),
    
    // Send transaction from a specific wallet
    sendFromWallet: (walletAddress, recipient, amount, memo = '', walletPassphrase, fee = null) => {
      const data = { 
        recipient, 
        amount, 
        memo, 
        wallet_passphrase: walletPassphrase 
      };
      
      if (fee !== null) {
        data.fee = fee;
      }
      
      return fetchWithRetry(() => api.post(`/wallets/${walletAddress}/send/`, data));
    },
    
    // Backup a wallet
    backupWallet: (walletAddress, walletPassphrase) => 
      fetchWithRetry(() => api.post(`/wallets/${walletAddress}/backup/`, {
        wallet_passphrase: walletPassphrase
      }))
  }
};

// Blockchain analytics methods
apiService.blockchain = {
  // Get blockchain overview stats
  getOverview: () => 
    fetchWithRetry(() => api.get('/blockchain/overview/')),
  
  // Get detailed block information
  getBlock: (blockId) => 
    fetchWithRetry(() => api.get(`/blockchain/block/${blockId}/`)),
  
  // Get transactions for a specific block
  getBlockTransactions: (blockId) => 
    fetchWithRetry(() => api.get(`/blockchain/block/${blockId}/transactions/`)),
  
  // Get mining statistics
  getMiningStats: () => 
    fetchWithRetry(() => api.get('/blockchain/mining/stats/')),
  
  // Get blockchain transaction volume over time
  getTransactionVolume: (timeframe = 'week') => 
    fetchWithRetry(() => api.get(`/blockchain/analytics/volume/?timeframe=${timeframe}`)),
  
  // Get blockchain health metrics
  getHealthMetrics: () => 
    fetchWithRetry(() => api.get('/blockchain/health/')),
  
  // Get node info
  getNodeInfo: () => 
    fetchWithRetry(() => api.get('/blockchain/node/')),
  
  // Search the blockchain (blocks, transactions, addresses)
  search: (query) => 
    fetchWithRetry(() => api.get(`/blockchain/search/?q=${encodeURIComponent(query)}`))
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

apiService.forum = {
  // Connect to forum updates
  connectToForumUpdates: (options = {}) => {
    return apiService.createWebSocketWithReconnect('forum', options);
  },
  
  // Connect to specific thread updates
  connectToThreadUpdates: (threadId, options = {}) => {
    return apiService.createWebSocketWithReconnect(`forum/thread/${threadId}`, options);
  },
  
  // Connect to specific category updates
  connectToCategoryUpdates: (categorySlug, options = {}) => {
    return apiService.createWebSocketWithReconnect(`forum/category/${categorySlug}`, options);
  },
  
  // Get forum categories
  getCategories: () => 
    fetchWithRetry(() => api.get('/forum/categories/')),
  
  // Get threads (with optional category filter)
  getThreads: (categorySlug = null) => {
    const url = categorySlug 
      ? `/forum/threads/?category_slug=${encodeURIComponent(categorySlug)}`
      : '/forum/threads/';
    return fetchWithRetry(() => api.get(url));
  },
  
  // Get thread details
  getThread: (slug) => 
    fetchWithRetry(() => api.get(`/forum/threads/${slug}/`)),
  
  // Create a new thread
  createThread: (title, body, categoryId) => 
    fetchWithRetry(() => api.post('/forum/threads/create/', {
      title,
      body,
      category: categoryId
    })),
  
  // Create a reply
  createReply: (threadId, body) => 
    fetchWithRetry(() => api.post('/forum/replies/create/', {
      thread: threadId,
      body
    })),
  
  // Get popular threads
  getPopularThreads: () => 
    fetchWithRetry(() => api.get('/forum/popular-threads/')),
  
  // Search forum content
  search: (query) => 
    fetchWithRetry(() => api.get(`/forum/search/?q=${encodeURIComponent(query)}`)),
  
  // Get user's threads
  getUserThreads: () => 
    fetchWithRetry(() => api.get('/forum/my-threads/')),
  
  // Get user's replies
  getUserReplies: () => 
    fetchWithRetry(() => api.get('/forum/my-replies/'))
};

// Gaming WebSocket methods
apiService.gaming = {
  // Connect to gaming updates
  connectToGamingUpdates: (options = {}) => {
    return apiService.createWebSocketWithReconnect('gaming', options);
  },
  
  // Connect to specific game updates
  connectToGameUpdates: (gameId, options = {}) => {
    return apiService.createWebSocketWithReconnect(`gaming/games/${gameId}`, options);
  },
  
  // Connect to leaderboard updates
  connectToLeaderboardUpdates: (gameId, options = {}) => {
    return apiService.createWebSocketWithReconnect(`gaming/leaderboards/${gameId}`, options);
  },
  
  // Connect to NFT updates
  connectToNFTUpdates: (options = {}) => {
    return apiService.createWebSocketWithReconnect('gaming/nfts', options);
  },
  
  // Get game categories
  getCategories: () => 
    fetchWithRetry(() => api.get('/gaming/categories/')),
  
  // Get games (with optional category filter)
  getGames: (categorySlug = null) => {
    const url = categorySlug 
      ? `/gaming/games/?category=${encodeURIComponent(categorySlug)}`
      : '/gaming/games/';
    return fetchWithRetry(() => api.get(url));
  },
  
  // Get game details
  getGame: (slug) => 
    fetchWithRetry(() => api.get(`/gaming/games/${slug}/`)),
  
  // Get user's NFT inventory
  getNFTs: (filters = {}) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      queryParams.append(key, value);
    });
    
    const queryString = queryParams.toString();
    const url = queryString ? `/gaming/nfts/?${queryString}` : '/gaming/nfts/';
    
    return fetchWithRetry(() => api.get(url));
  },
  
  // Get game wallet info
  getWallet: () => 
    fetchWithRetry(() => api.get('/gaming/wallet/')),
  
  // Get game transactions
  getTransactions: () => 
    fetchWithRetry(() => api.get('/gaming/transactions/')),
  
  // Start a game session
  startGame: (gameSlug) => 
    fetchWithRetry(() => api.post('/gaming/play/start/', { game_slug: gameSlug })),
  
  // End a game session and record results
  endGame: (sessionId, score, completedObjectives = 0, achievements = []) => 
    fetchWithRetry(() => api.post('/gaming/play/end/', {
      session_id: sessionId,
      score,
      completed_objectives: completedObjectives,
      achievements
    })),
  
  // Get game leaderboard
  getLeaderboard: (gameSlug, period = 'weekly') => 
    fetchWithRetry(() => api.get(`/gaming/leaderboard/${gameSlug}/?period=${period}`)),
  
  // Get game launch info
  getLaunchInfo: (gameSlug) => 
    fetchWithRetry(() => api.get(`/gaming/launch/${gameSlug}/`)),
  
  // Get gaming dashboard
  getDashboard: () => 
    fetchWithRetry(() => api.get('/gaming/dashboard/')),
  
  // Search games
  search: (query) => 
    fetchWithRetry(() => api.get(`/gaming/search/?q=${encodeURIComponent(query)}`))
};

export default apiService;