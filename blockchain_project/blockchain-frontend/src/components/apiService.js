// apiService.js - Centralized API handling for blockchain dashboard
import axios from 'axios';

const BASE_URL = 'http://localhost:8000/api';

// Create a configurable axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the error for debugging
    console.error('API Error:', error);

    // Handle token expiration or authentication issues
    if (error.response && error.response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      // You might want to redirect to login page here
      console.log('Authentication error: You may need to log in again');
    }

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
      
      // Don't retry on client errors (4xx) except for 429 (rate limiting)
      if (error.response && error.response.status >= 400 && error.response.status < 500 && error.response.status !== 429) {
        break;
      }
      
      // If we've reached max retries, throw the error
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate backoff delay
      const retryDelay = delay * Math.pow(2, attempt);
      console.log(`Retrying API call in ${retryDelay}ms... (Attempt ${attempt + 1}/${maxRetries})`);
      
      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw lastError;
};

// API service methods
const apiService = {
  // Blocks endpoints
  getBlocks: () => fetchWithRetry(() => api.get('/blocks/')),
  getBlockById: (id) => fetchWithRetry(() => api.get(`/blocks/${id}/`)),
  
  // Transactions endpoints
  getTransactionsByBlockId: (blockId) => fetchWithRetry(() => api.get(`/transactions/?block_id=${blockId}`)),
  getTransactionById: (id) => fetchWithRetry(() => api.get(`/transactions/${id}/`)),
  
  // Analytics endpoints
  getAnalytics: () => fetchWithRetry(() => api.get('/analytics/')),
  
  // Sentiment data endpoint
  getSentimentData: () => fetchWithRetry(() => api.get('/sentiment/')),
  
  // Price data endpoint
  getPriceData: () => fetchWithRetry(() => api.get('/price/')),
  
  // Notifications endpoints
  getNotifications: () => fetchWithRetry(() => api.get('/notifications/')),
  markNotificationAsRead: (id) => fetchWithRetry(() => api.patch(`/notifications/${id}/`, { is_read: true })),
  
  // WebSocket helper
  createWebSocketConnection: (endpoint) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = "8000"; // Backend port
    const timestamp = new Date().getTime();
    
    // Ensure endpoints match the routes defined in routing.py
    let wsEndpoint = endpoint;
    if (endpoint === 'price') {
      wsEndpoint = 'price'; // Changed from price_data to price
    } else if (endpoint === 'blocks') {
      wsEndpoint = 'blocks'; // Already correct
    } else if (endpoint === 'notifications') {
      wsEndpoint = 'notifications'; // Already correct
    }
    
    return new WebSocket(`${protocol}//${host}:${port}/ws/${wsEndpoint}/?t=${timestamp}`);
  }
};

export default apiService;
