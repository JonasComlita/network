import React, { useEffect, useState, useRef } from 'react';
import apiService from './apiService';

const NotificationList = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0);
    const socketRef = useRef(null);
    const reconnectTimerRef = useRef(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const response = await apiService.getNotifications();
                setNotifications(response.data);
                setNotificationCount(response.data.filter(n => !n.is_read).length);
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
                setError('Unable to load notifications. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchNotifications();
        
        // Set up auto-refresh interval
        const intervalId = setInterval(fetchNotifications, 60000); // Refresh every minute
        
        // Attempt to set up WebSocket for real-time updates
        const connectWebSocket = () => {
            try {
                // Close existing connection if any
                if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
                    socketRef.current.close();
                }
                
                // Create new WebSocket connection
                socketRef.current = apiService.createWebSocketConnection('notifications');
                
                socketRef.current.onopen = () => {
                    console.log('Notifications WebSocket connection established');
                };
                
                socketRef.current.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        console.log('Notification received:', data);
                        
                        if (data.type === 'new_notification') {
                            // Add new notification to the list
                            setNotifications(prevNotifications => [data.notification, ...prevNotifications]);
                            setNotificationCount(count => count + 1);
                            
                            // Show browser notification if supported
                            if ('Notification' in window && Notification.permission === 'granted') {
                                new Notification('New Blockchain Notification', {
                                    body: data.notification.message
                                });
                            }
                        } else if (data.type === 'read_notification') {
                            // Update notification read status
                            setNotifications(prevNotifications => 
                                prevNotifications.map(notification => 
                                    notification.id === data.notification_id 
                                        ? { ...notification, is_read: true } 
                                        : notification
                                )
                            );
                            setNotificationCount(count => Math.max(0, count - 1));
                        }
                    } catch (error) {
                        console.error('Error processing notification WebSocket message:', error);
                    }
                };
                
                socketRef.current.onerror = (error) => {
                    console.error('Notifications WebSocket error:', error);
                };
                
                socketRef.current.onclose = (event) => {
                    console.log('Notifications WebSocket connection closed:', event);
                    
                    // Attempt to reconnect with exponential backoff
                    const reconnectDelay = Math.min(30000, 1000 * Math.pow(2, Math.floor(Math.random() * 5)));
                    console.log(`Attempting to reconnect notifications socket in ${reconnectDelay}ms`);
                    
                    reconnectTimerRef.current = setTimeout(connectWebSocket, reconnectDelay);
                };
            } catch (error) {
                console.error('Error creating notifications WebSocket:', error);
            }
        };
        
        // Request notification permissions
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        
        // Connect to WebSocket
        connectWebSocket();
        
        // Cleanup function
        return () => {
            clearInterval(intervalId);
            
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
            
            if (socketRef.current) {
                socketRef.current.close();
            }
        };
    }, []);

    const markAsRead = async (id) => {
        try {
            await apiService.markNotificationAsRead(id);
            
            // Update local state
            setNotifications(notifications.map(notification => 
                notification.id === id 
                    ? { ...notification, is_read: true } 
                    : notification
            ));
            
            // Update unread count
            setNotificationCount(prevCount => Math.max(0, prevCount - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (notifications.length === 0 || notifications.every(n => n.is_read)) return;
        
        try {
            // This assumes your API supports a bulk update endpoint
            // If not, you would need to loop through and mark each one
            await Promise.all(
                notifications
                    .filter(n => !n.is_read)
                    .map(n => apiService.markNotificationAsRead(n.id))
            );
            
            // Update local state
            setNotifications(notifications.map(notification => ({ ...notification, is_read: true })));
            setNotificationCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Get notification severity class
    const getNotificationClass = (notification) => {
        if (notification.type === 'alert' || notification.priority === 'high') {
            return 'border-red-300 bg-red-50';
        } else if (notification.type === 'warning' || notification.priority === 'medium') {
            return 'border-yellow-300 bg-yellow-50';
        } else {
            return 'border-blue-300 bg-blue-50';
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="p-4 border rounded shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Notifications</h2>
                </div>
                <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex space-x-4 border-b pb-4">
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 border rounded shadow-sm">
                <h2 className="text-xl font-bold mb-4">Notifications</h2>
                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                    <p className="text-red-700">{error}</p>
                    <button 
                        onClick={() => {
                            setLoading(true);
                            setError(null);
                            apiService.getNotifications()
                                .then(res => {
                                    setNotifications(res.data);
                                    setNotificationCount(res.data.filter(n => !n.is_read).length);
                                    setLoading(false);
                                })
                                .catch(err => {
                                    setError(err.message);
                                    setLoading(false);
                                });
                        }}
                        className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 border rounded shadow-sm">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                    <h2 className="text-xl font-bold">Notifications</h2>
                    {notificationCount > 0 && (
                        <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                            {notificationCount}
                        </span>
                    )}
                </div>
                
                {notifications.some(n => !n.is_read) && (
                    <button 
                        onClick={markAllAsRead}
                        className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
                    >
                        Mark all as read
                    </button>
                )}
            </div>
            
            {notifications.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded">
                    <p className="text-gray-500">No notifications</p>
                </div>
            ) : (
                <ul className="space-y-2">
                    {notifications.map(notification => (
                        <li 
                            key={notification.id} 
                            className={`border p-3 rounded-lg ${getNotificationClass(notification)} ${notification.is_read ? 'opacity-60' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className={`${notification.is_read ? 'font-normal' : 'font-semibold'}`}>
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(notification.timestamp).toLocaleString()}
                                    </p>
                                </div>
                                {!notification.is_read && (
                                    <button 
                                        onClick={() => markAsRead(notification.id)}
                                        className="px-2 py-1 text-xs bg-white hover:bg-gray-100 rounded border"
                                    >
                                        Mark read
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            
            <div className="text-right mt-4">
                <span className="text-xs text-gray-500">
                    {loading ? 'Refreshing...' : `Last updated: ${new Date().toLocaleTimeString()}`}
                </span>
            </div>
        </div>
    );
};

export default NotificationList;