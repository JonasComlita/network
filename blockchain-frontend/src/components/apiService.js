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
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) except for 429 (rate limiting) and 408 (timeout)
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
    
    // Ensure endpoints match the routes defined in routing.py
    let wsEndpoint = endpoint;
    
    // Add token to WebSocket connection for authentication
    return new WebSocket(`${protocol}//${host}:${port}/ws/${wsEndpoint}/?token=${token}&t=${timestamp}`);
  }
};

export default apiService;