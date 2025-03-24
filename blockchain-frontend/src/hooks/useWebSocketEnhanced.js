// src/hooks/useWebSocketEnhanced.js
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import apiService from '../components/apiService';

/**
 * Enhanced React hook for using WebSockets with automatic reconnection
 * Compatible with existing apiService WebSocket implementation
 * Now with support for multiple wallets, transactions and user profile updates
 */
const useWebSocketEnhanced = (endpoint, options = {}) => {
  // State for WebSocket status and data
  const [status, setStatus] = useState('disconnected');
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [messageHistory, setMessageHistory] = useState([]);
  
  // Reference to store WebSocket instance
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const forceClosedRef = useRef(false);
  
  // Extract options with defaults
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    onReconnect,
    autoReconnect = true,
    maxReconnectAttempts = 10,
    reconnectInterval = 1000,
    maxReconnectInterval = 30000,
    reconnectDecay = 1.5,
    formatMessage = true,
    debug = false,
    keepMessageHistory = false,
    historySize = 10
  } = options;
  
  // Debug logging function wrapped in useMemo to avoid dependency changes
  const log = useMemo(() => {
    return debug ? console.log : () => {};
  }, [debug]);
  
  // Cleanup function to close WebSocket
  const cleanup = useCallback(() => {
    if (wsRef.current) {
      log('Closing WebSocket connection');
      
      // Use the forceClose method if available, otherwise just close
      if (typeof wsRef.current.forceClose === 'function') {
        wsRef.current.forceClose();
      } else {
        wsRef.current.close();
      }
      
      wsRef.current = null;
    }
    
    // Clear any reconnect timers
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
  }, [log]);
  
  // Function to handle opening WebSocket
  const handleOpen = useCallback((event) => {
    log(`WebSocket connected to ${endpoint}`);
    setStatus('connected');
    setConnectionAttempts(0);
    
    // Call user-provided onOpen handler if present
    if (onOpen) {
      onOpen(event);
    }
  }, [endpoint, onOpen, log]);
  
  // Function to handle WebSocket messages
  const handleMessage = useCallback((event) => {
    log('WebSocket message received:', event.data);
    
    try {
      // Parse message if needed
      const parsedData = formatMessage ? JSON.parse(event.data) : event.data;
      setLastMessage(parsedData);
      
      // Add to message history if enabled
      if (keepMessageHistory) {
        setMessageHistory(prev => {
          const newHistory = [parsedData, ...prev];
          return newHistory.slice(0, historySize);
        });
      }
      
      // Call user-provided onMessage handler if present
      if (onMessage) {
        onMessage(parsedData, event);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
      
      // Still call onMessage with raw data if parsing fails
      if (onMessage) {
        onMessage(event.data, event);
      }
    }
  }, [onMessage, formatMessage, log, keepMessageHistory, historySize]);
  
  // Function to handle WebSocket errors
  const handleError = useCallback((event) => {
    console.error('WebSocket error:', event);
    setStatus('error');
    
    // Call user-provided onError handler if present
    if (onError) {
      onError(event);
    }
  }, [onError]);
  
  // Function to handle WebSocket close
  const handleClose = useCallback((event) => {
    log(`WebSocket closed: Code ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
    setStatus('disconnected');
    
    // Call user-provided onClose handler if present
    if (onClose) {
      onClose(event);
    }
    
    // Handle reconnection logic
    if (autoReconnect && 
        connectionAttempts < maxReconnectAttempts && 
        !forceClosedRef.current &&
        event.code !== 1000 && // Normal closure
        event.code !== 1001) { // Going away
      
      // Calculate backoff delay
      const newAttempts = connectionAttempts + 1;
      const delay = Math.min(
        reconnectInterval * Math.pow(reconnectDecay, newAttempts),
        maxReconnectInterval
      );
      
      log(`Scheduling reconnect in ${Math.round(delay / 1000)}s... (Attempt ${newAttempts}/${maxReconnectAttempts})`);
      
      if (onReconnect) {
        onReconnect(newAttempts);
      }
      
      // Update attempts count
      setConnectionAttempts(newAttempts);
      
      // Schedule reconnect
      reconnectTimerRef.current = setTimeout(() => {
        if (!forceClosedRef.current) {
          connectWebSocket();
        }
      }, delay);
    }
  }, [
    log,
    onClose,
    autoReconnect,
    connectionAttempts,
    maxReconnectAttempts,
    reconnectInterval,
    maxReconnectInterval,
    reconnectDecay,
    onReconnect
  ]);
  
  // Function to connect WebSocket
  const connectWebSocket = useCallback(() => {
    // Clean up existing connection
    cleanup();
    
    // Update state
    setStatus('connecting');
    
    try {
      log(`Connecting to WebSocket: ${endpoint}`);
      
      // Create WebSocket 
      wsRef.current = apiService.createWebSocketConnection(endpoint);
      
      // Set up event handlers
      wsRef.current.onopen = handleOpen;
      wsRef.current.onmessage = handleMessage;
      wsRef.current.onerror = handleError;
      wsRef.current.onclose = handleClose;
      
      // Add forceClose method
      wsRef.current.forceClose = () => {
        forceClosedRef.current = true;
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        wsRef.current.close();
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setStatus('error');
    }
  }, [
    endpoint, 
    cleanup,
    handleOpen,
    handleMessage,
    handleError,
    handleClose,
    log
  ]);
  
  // Initial connection
  useEffect(() => {
    forceClosedRef.current = false;
    
    if (endpoint) {
      connectWebSocket();
    }
    
    // Cleanup on unmount
    return () => {
      forceClosedRef.current = true;
      cleanup();
    };
  }, [endpoint, connectWebSocket, cleanup]);
  
  // Manual reconnect function
  const reconnect = useCallback(() => {
    log('Manual reconnect triggered');
    forceClosedRef.current = false;
    setConnectionAttempts(0);
    connectWebSocket();
  }, [connectWebSocket, log]);
  
  // Send message function
  const sendMessage = useCallback((data) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      log('Cannot send message: WebSocket not connected');
      return false;
    }
    
    try {
      const message = typeof data === 'string' ? data : JSON.stringify(data);
      wsRef.current.send(message);
      log('Sent message:', message);
      return true;
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
      return false;
    }
  }, [log]);
  
  // Function to clear message history
  const clearMessageHistory = useCallback(() => {
    setMessageHistory([]);
  }, []);
  
  // Return hook API
  return {
    status,
    lastMessage,
    messageHistory,
    clearMessageHistory,
    sendMessage,
    reconnect,
    isConnected: status === 'connected',
    connectionAttempts,
    websocket: wsRef.current // Exposing the WebSocket instance for advanced usage
  };
};

export default useWebSocketEnhanced;