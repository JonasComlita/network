import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import TransactionList from './TransactionList';

// Register all components
Chart.register(...registerables);

const BlockchainChart = () => {
    const [blocks, setBlocks] = useState([]);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [socketStatus, setSocketStatus] = useState('disconnected');
    const chartRef = useRef(null);
    const chartInstanceRef = useRef(null);
    const socketRef = useRef(null);

    const token = localStorage.getItem('token');

    // Separate API fetch function for reusability
    const fetchBlocks = async () => {
        try {
            const response = await axios.get('http://localhost:8000/api/blocks/', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            setBlocks(response.data);
        } catch (error) {
            console.error('Error fetching blocks:', error);
        }
    };

    // Fetch blocks effect (separate from WebSocket)
    useEffect(() => {
        fetchBlocks();
        // Set up an interval to fetch blocks regularly as a fallback mechanism
        const intervalId = setInterval(fetchBlocks, 10000); // every 10 seconds
        
        return () => {
            clearInterval(intervalId);
        };
    }, [token]);

    // WebSocket connection setup with progressive backoff
    useEffect(() => {
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 10; // Increased max attempts
        let reconnectTimer = null;
        
        const getReconnectDelay = (attempt) => {
            // Progressive backoff: 1s, 2s, 4s, 8s, etc. (capped at 30s)
            return Math.min(1000 * Math.pow(2, attempt), 30000);
        };

        const connectWebSocket = () => {
            // Don't try to close an already closing or closed socket
            if (socketRef.current && 
                socketRef.current.readyState !== WebSocket.CLOSING && 
                socketRef.current.readyState !== WebSocket.CLOSED) {
                socketRef.current.close();
            }

            try {
                // Add a timestamp parameter to prevent caching issues
                const timestamp = new Date().getTime();
                // Make sure we're using the correct protocol (ws or wss)
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const host = window.location.hostname;
                const port = "8000"; // Your backend port
                const wsUrl = `${protocol}//${host}:${port}/ws/blocks/?t=${timestamp}`;
                
                console.log(`Attempting to connect to WebSocket: ${wsUrl}`);
                setSocketStatus('connecting');
                
                // Create new WebSocket with timeout handling
                socketRef.current = new WebSocket(wsUrl);
                
                // Set a connection timeout
                const connectionTimeout = setTimeout(() => {
                    if (socketRef.current && socketRef.current.readyState === WebSocket.CONNECTING) {
                        console.log('WebSocket connection timeout');
                        socketRef.current.close();
                    }
                }, 5000); // 5 second timeout
                
                socketRef.current.onopen = () => {
                    clearTimeout(connectionTimeout);
                    console.log('WebSocket connection established');
                    setSocketStatus('connected');
                    reconnectAttempts = 0; // Reset attempts on successful connection
                };

                socketRef.current.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('Received data:', data);
                        fetchBlocks(); // Re-fetch blocks when new data is received
                    } catch (error) {
                        console.error('Error processing WebSocket message:', error);
                    }
                };

                socketRef.current.onerror = (error) => {
                    clearTimeout(connectionTimeout);
                    console.error('WebSocket error:', error);
                    setSocketStatus('error');
                };

                socketRef.current.onclose = (event) => {
                    clearTimeout(connectionTimeout);
                    console.log(`WebSocket connection closed: Code ${event.code}, Reason: ${event.reason || 'No reason provided'}`);
                    setSocketStatus('disconnected');
                    
                    // Only attempt to reconnect for certain close codes
                    // 1000 (Normal Closure) and 1001 (Going Away) might not need reconnection
                    const shouldReconnect = event.code !== 1000 && event.code !== 1001;
                    
                    if (shouldReconnect && reconnectAttempts < maxReconnectAttempts) {
                        reconnectAttempts++;
                        const delay = getReconnectDelay(reconnectAttempts);
                        console.log(`Attempting to reconnect (${reconnectAttempts}/${maxReconnectAttempts}) in ${delay / 1000}s...`);
                        reconnectTimer = setTimeout(connectWebSocket, delay);
                    } else if (reconnectAttempts >= maxReconnectAttempts) {
                        console.log('Max reconnect attempts reached. Using polling fallback.');
                        // We're already polling with the interval in the other useEffect
                    }
                };
            } catch (error) {
                console.error('Error creating WebSocket:', error);
                setSocketStatus('error');
                
                // Try to reconnect after an error in creating the socket
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    const delay = getReconnectDelay(reconnectAttempts);
                    console.log(`Error creating socket. Retrying (${reconnectAttempts}/${maxReconnectAttempts}) in ${delay / 1000}s...`);
                    reconnectTimer = setTimeout(connectWebSocket, delay);
                }
            }
        };

        // Delay initial WebSocket connection slightly to allow component to fully mount
        const initialConnectionTimer = setTimeout(() => {
            connectWebSocket();
        }, 1000);

        // Cleanup function
        return () => {
            clearTimeout(initialConnectionTimer);
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
            }
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    // Chart creation effect
    useEffect(() => {
        if (chartRef.current && blocks.length > 0) {
            const ctx = chartRef.current.getContext('2d');
            
            // Clean up previous chart instance to prevent memory leaks
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            // Prepare data for chart
            const labels = blocks.map(block => `Block ${block.index}`);
            const transactionCounts = blocks.map(block => block.transactions?.length || 0);
            
            // Create new chart
            chartInstanceRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Transactions per Block',
                            data: transactionCounts,
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Number of Transactions'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Block'
                            }
                        }
                    }
                }
            });
        }
    }, [blocks]); // Depend on blocks data

    const filteredBlocks = blocks.filter(block => 
        block.index.toString().includes(searchTerm) || 
        new Date(block.timestamp).toLocaleString().includes(searchTerm)
    );

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Blockchain Data</h2>
            
            {/* Connection status indicator */}
            <div className="mb-2">
                <span className="mr-2">WebSocket Status:</span>
                <span className={`px-2 py-1 rounded text-sm ${
                    socketStatus === 'connected' 
                        ? 'bg-green-100 text-green-800' 
                        : socketStatus === 'connecting' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                }`}>
                    {socketStatus.charAt(0).toUpperCase() + socketStatus.slice(1)}
                </span>
                {socketStatus !== 'connected' && (
                    <button 
                        onClick={() => window.location.reload()} 
                        className="ml-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
                    >
                        Reload
                    </button>
                )}
                {socketStatus === 'disconnected' && (
                    <span className="ml-2 text-sm text-gray-500">
                        (Data will still update via polling)
                    </span>
                )}
            </div>
            
            <input
                type="text"
                placeholder="Search blocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border p-2 mb-4 w-full rounded"
            />
            
            {blocks.length > 0 ? (
                <div className="mb-6" style={{ height: '300px' }}>
                    <canvas ref={chartRef} />
                </div>
            ) : (
                <div className="flex justify-center items-center h-40 bg-gray-50 rounded">
                    <p className="text-gray-500">Loading blockchain data...</p>
                </div>
            )}
            
            <h3 className="text-lg font-semibold mt-6 mb-2">Blocks</h3>
            {filteredBlocks.length > 0 ? (
                <ul className="divide-y border rounded">
                    {filteredBlocks.map(block => (
                        <li 
                            key={block.id} 
                            className="p-3 hover:bg-gray-50 cursor-pointer transition-colors" 
                            onClick={() => setSelectedBlockId(block.id)}
                        >
                            <div className="flex justify-between">
                                <span className="font-medium">Block {block.index}</span>
                                <span className="text-gray-500 text-sm">
                                    {new Date(block.timestamp).toLocaleString()}
                                </span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 py-4">No blocks match your search criteria.</p>
            )}
            
            {selectedBlockId && <TransactionList blockId={selectedBlockId} />}
        </div>
    );
};

export default BlockchainChart;