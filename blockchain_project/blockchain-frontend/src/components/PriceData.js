import React, { useEffect, useState, useRef } from 'react';
import apiService from './apiService';

const PriceData = () => {
    const [price, setPrice] = useState(null);
    const [previousPrice, setPreviousPrice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);
    const socketRef = useRef(null);
    const retryTimeoutRef = useRef(null);

    useEffect(() => {
        // Initial price fetch
        const fetchPrice = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const response = await apiService.getPriceData();
                // Save previous price to show price movement
                if (price !== null) {
                    setPreviousPrice(price);
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
              
              // Create new WebSocket connection
              socketRef.current = apiService.createWebSocketConnection('price');
              
              socketRef.current.onopen = () => {
                console.log('Price WebSocket connection established');
              };
              
              // Rest of the code remains the same...
            } catch (error) {
              console.error('Error creating price WebSocket:', error);
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
    }, []);

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
            <div className="text-right mt-2">
                <span className="text-xs text-gray-500">
                    {loading ? 'Updating...' : `Last updated: ${lastUpdated?.toLocaleTimeString() || 'Unknown'}`}
                </span>
            </div>
        </div>
    );
};

export default PriceData;