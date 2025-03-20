import React, { useEffect, useState, useRef } from 'react';
import apiService from './apiService';

const PriceData = () => {
    const [price, setPrice] = useState(null);
    const [previousPrice, setPreviousPrice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const [wsStatus, setWsStatus] = useState('disconnected');
    const socketRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const priceRef = useRef(null); // Add a ref to track the latest price value

    // Update the ref whenever price changes
    useEffect(() => {
        priceRef.current = price;
    }, [price]);

    useEffect(() => {
        // Initial price fetch
        const fetchPrice = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const response = await apiService.getPriceData();
                // Save previous price to show price movement
                if (priceRef.current !== null) {
                    setPreviousPrice(priceRef.current);
                }
                setPrice(response.data.bitcoin.usd);
                setLastUpdated(new Date());
            } catch (error) {
                console.error('Failed to fetch price data:', error);
                setError('Unable to load current price. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchPrice();
        
        // Set up auto-refresh as fallback
        const intervalId = setInterval(fetchPrice, 30000); // Refresh every 30 seconds
        
        // Try to set up WebSocket for real-time updates
        const connectWebSocket = () => {
            try {
                // Close existing connection if any
                if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
                    socketRef.current.close();
                }
                
                // Get the JWT token from localStorage
                const token = localStorage.getItem('token');
                if (!token) {
                    console.warn('No authentication token available for WebSocket');
                    setWsStatus('auth_error');
                    return;
                }
                
                // Create new WebSocket connection with the token
                const wsUrl = `ws://localhost:8000/ws/price/?token=${token}&t=${new Date().getTime()}`;
                console.log(`Attempting to connect to WebSocket: ${wsUrl}`);
                
                setWsStatus('connecting');
                socketRef.current = new WebSocket(wsUrl);
                
                socketRef.current.onopen = () => {
                    console.log('Price WebSocket connection established');
                    setWsStatus('connected');
                };
                
                socketRef.current.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('Price WebSocket message received:', data);
                        
                        // If it's just a connection confirmation, don't update the price
                        if (data.type === 'connection_established') {
                            console.log('WebSocket connection confirmed');
                            return;
                        }
                        
                        if (data && data.bitcoin && data.bitcoin.usd) {
                            setPreviousPrice(priceRef.current); // Use the ref
                            setPrice(data.bitcoin.usd);
                            setLastUpdated(new Date());
                        }
                    } catch (error) {
                        console.error('Error processing price WebSocket message:', error);
                    }
                };
                
                socketRef.current.onerror = (error) => {
                    console.error('Price WebSocket error:', error);
                    setWsStatus('error');
                };
                
                socketRef.current.onclose = (event) => {
                    console.log(`Price WebSocket connection closed: Code ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
                    setWsStatus('disconnected');
                    
                    // Try to reconnect after a delay
                    if (retryTimeoutRef.current) {
                        clearTimeout(retryTimeoutRef.current);
                    }
                    
                    retryTimeoutRef.current = setTimeout(() => {
                        console.log('Attempting to reconnect price WebSocket...');
                        connectWebSocket();
                    }, 5000); // Retry after 5 seconds
                };
            } catch (error) {
                console.error('Error creating price WebSocket:', error);
                setWsStatus('error');
            }
        };
        
        // Connect to WebSocket
        connectWebSocket();
        
        // Cleanup function
        return () => {
            clearInterval(intervalId);
            
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
            
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []); // Empty dependency array to run only once

    // Format price with thousands separator
    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(price);
    };

    // Determine price change indicator
    const getPriceChange = () => {
        if (previousPrice === null || price === previousPrice) return null;
        
        const change = ((price - previousPrice) / previousPrice) * 100;
        const isUp = price > previousPrice;
        
        return {
            direction: isUp ? 'up' : 'down',
            percentage: Math.abs(change).toFixed(2),
            color: isUp ? 'text-green-600' : 'text-red-600',
            arrow: isUp ? '↑' : '↓'
        };
    };

    const priceChange = getPriceChange();

    if (loading && price === null) {
        return (
            <div className="p-4 border rounded shadow-sm bg-white">
                <h2 className="text-xl font-bold mb-4">Current Bitcoin Price</h2>
                <div className="animate-pulse flex space-x-4">
                    <div className="h-6 bg-gray-200 rounded w-32"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 border rounded shadow-sm bg-white">
                <h2 className="text-xl font-bold mb-4">Current Bitcoin Price</h2>
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-red-700">{error}</p>
                    <button 
                        onClick={() => apiService.getPriceData().then(res => {
                            setPrice(res.data.bitcoin.usd);
                            setLastUpdated(new Date());
                            setError(null);
                        }).catch(err => setError(err.message))}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border rounded shadow-sm bg-white">
            <h2 className="text-xl font-bold mb-2">Current Bitcoin Price</h2>
            <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold">{formatPrice(price)}</span>
                {priceChange && (
                    <span className={`${priceChange.color} font-medium flex items-center`}>
                        {priceChange.arrow} {priceChange.percentage}%
                    </span>
                )}
            </div>
            <div className="flex justify-between mt-2">
                <span className={`text-xs px-2 py-1 rounded ${
                    wsStatus === 'connected' 
                        ? 'bg-green-100 text-green-800' 
                        : wsStatus === 'connecting' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                }`}>
                    {wsStatus === 'connected' ? 'Live' : wsStatus === 'connecting' ? 'Connecting...' : 'Polling'}
                </span>
                <span className="text-xs text-gray-500">
                    {loading ? 'Updating...' : `Last updated: ${lastUpdated?.toLocaleTimeString() || 'Unknown'}`}
                </span>
            </div>
        </div>
    );
};

export default PriceData;