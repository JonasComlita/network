import React, { useState } from 'react';
import BlockchainChart from './BlockchainChart';
import SentimentData from './SentimentData';
import PriceData from './PriceData';
import TransactionAnalytics from './TransactionAnalytics';
import NotificationList from './NotificationList';

const Dashboard = () => {
    const [connectionStatus, setConnectionStatus] = useState({
        api: 'checking',
        websocket: 'checking'
    });

    // Check API and WebSocket server status on component mount
    React.useEffect(() => {
        // Check API status
        fetch('http://localhost:8000/api/health-check/')
            .then(response => {
                if (response.ok) {
                    setConnectionStatus(prev => ({ ...prev, api: 'connected' }));
                } else {
                    setConnectionStatus(prev => ({ ...prev, api: 'error' }));
                }
            })
            .catch(() => {
                setConnectionStatus(prev => ({ ...prev, api: 'error' }));
            });

        // Check WebSocket status
        const socket = new WebSocket('ws://localhost:8000/ws/health-check/');
        
        socket.onopen = () => {
            setConnectionStatus(prev => ({ ...prev, websocket: 'connected' }));
            socket.close();
        };
        
        socket.onerror = () => {
            setConnectionStatus(prev => ({ ...prev, websocket: 'error' }));
        };

        return () => {
            if (socket.readyState === WebSocket.CONNECTING || socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        };
    }, []);

    return (
        <div className="container mx-auto px-4 py-8">
            <header className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Blockchain Dashboard</h1>
                
                {/* Connection status indicators */}
                <div className="flex space-x-4 mb-4">
                    <div className="flex items-center">
                        <span className="text-sm font-medium mr-2">API:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            connectionStatus.api === 'connected' 
                                ? 'bg-green-100 text-green-800' 
                                : connectionStatus.api === 'checking'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                        }`}>
                            {connectionStatus.api === 'connected' 
                                ? 'Connected' 
                                : connectionStatus.api === 'checking'
                                    ? 'Checking...'
                                    : 'Disconnected'}
                        </span>
                    </div>
                    
                    <div className="flex items-center">
                        <span className="text-sm font-medium mr-2">WebSocket:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            connectionStatus.websocket === 'connected' 
                                ? 'bg-green-100 text-green-800' 
                                : connectionStatus.websocket === 'checking'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-red-100 text-red-800'
                        }`}>
                            {connectionStatus.websocket === 'connected' 
                                ? 'Connected' 
                                : connectionStatus.websocket === 'checking'
                                    ? 'Checking...'
                                    : 'Disconnected'}
                        </span>
                    </div>
                </div>
                
                {(connectionStatus.api === 'error' || connectionStatus.websocket === 'error') && (
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                        <div className="flex">
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    {connectionStatus.api === 'error' && connectionStatus.websocket === 'error'
                                        ? 'Connection issues detected with both API and WebSocket server.'
                                        : connectionStatus.api === 'error'
                                            ? 'Connection issues detected with API server.'
                                            : 'Connection issues detected with WebSocket server.'
                                    }
                                </p>
                                <p className="text-sm text-yellow-700 mt-2">
                                    Some features may not work properly. The dashboard will attempt to use fallback mechanisms.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Top row - Price and Notifications */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-1">
                    <PriceData />
                </div>
                <div className="lg:col-span-2">
                    <NotificationList />
                </div>
            </div>

            {/* Main content - Blockchain Chart and Transaction Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <div className="lg:col-span-2">
                    <BlockchainChart />
                </div>
                <div className="lg:col-span-1">
                    <SentimentData />
                </div>
            </div>

            {/* Bottom row - Transaction Analytics */}
            <div className="mb-6">
                <TransactionAnalytics />
            </div>

            <footer className="text-center text-gray-500 text-sm mt-8">
                <p>© 2025 Blockchain Dashboard. All data refreshes automatically.</p>
            </footer>
        </div>
    );
};

export default Dashboard;