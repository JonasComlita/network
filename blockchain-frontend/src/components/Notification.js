import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, DollarSign, Shield, X, ChevronDown, ChevronUp } from 'lucide-react';
import apiService from './apiService';
import useWebSocketEnhanced from '../hooks/useWebSocketEnhanced';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, transaction, security, etc.
  
  // WebSocket for real-time notifications
  const { lastMessage } = useWebSocketEnhanced('notifications/', {
    onMessage: (message) => {
      if (message.type === 'new_notification') {
        // Add new notification to the top of the list
        setNotifications(prev => [message.notification, ...prev]);
        
        // Increment unread count
        setUnreadCount(prev => prev + 1);
        
        // Show notification center if it's not already open
        if (!isOpen) {
          // Optional: Show a brief popup notification
          showPopupNotification(message.notification);
        }
      } else if (message.type === 'mark_read') {
        // Update notifications to mark the specified one as read
        const notificationId = message.notification_id;
        
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true } 
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  });
  
  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  // Update unread count whenever notifications change
  useEffect(() => {
    const count = notifications.filter(notification => !notification.is_read).length;
    setUnreadCount(count);
  }, [notifications]);
  
  // Show temporary popup notification
  const showPopupNotification = (notification) => {
    // Create and show a popup notification using browser's Notification API if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('New Notification', {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
    
    // Alternative: Show a custom popup element
    // Implementation depends on the design system
  };
  
  // Fetch notifications from API
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Apply filter if not "all"
      const filterParam = filter !== 'all' ? `?type=${filter}` : '';
      
      const response = await apiService.getNotifications(
        `${filterParam}&page=${page}&per_page=10`
      );
      
      if (response.data) {
        if (page === 1) {
          // Replace all notifications
          setNotifications(response.data.results || []);
        } else {
          // Append to existing notifications
          setNotifications(prev => [...prev, ...(response.data.results || [])]);
        }
        
        // Update pagination status
        setHasMore(!!response.data.next);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.formattedMessage || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load more notifications
  const loadMore = () => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
      fetchNotifications();
    }
  };
  
  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    try {
      await apiService.markNotificationAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true } 
            : notification
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      
      // Update unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };
  
  // Filter notifications
  const handleFilterChange = (newFilter) => {
    if (filter !== newFilter) {
      setFilter(newFilter);
      setPage(1);
      // Fetch with new filter on next render
      setTimeout(() => fetchNotifications(), 0);
    }
  };
  
  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'transaction':
        return <DollarSign className="h-5 w-5 text-blue-500" />;
      case 'security':
        return <Shield className="h-5 w-5 text-purple-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };
  
  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
      >
        <Bell className="h-6 w-6" />
        
        {/* Unread count badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white shadow-lg rounded-lg overflow-hidden z-50" style={{ maxHeight: '80vh' }}>
          {/* Header */}
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* Filter tabs */}
          <div className="px-1 py-2 border-b border-gray-200 flex items-center space-x-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1 text-xs rounded-full ${
                filter === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange('unread')}
              className={`px-3 py-1 text-xs rounded-full ${
                filter === 'unread' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Unread
            </button>
            <button
              onClick={() => handleFilterChange('transaction')}
              className={`px-3 py-1 text-xs rounded-full ${
                filter === 'transaction' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => handleFilterChange('security')}
              className={`px-3 py-1 text-xs rounded-full ${
                filter === 'security' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Security
            </button>
          </div>
          
          {/* Notification List */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(80vh - 110px)' }}>
            {isLoading && page === 1 ? (
              <div className="flex justify-center items-center h-24">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <Bell className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500">No notifications</p>
                {filter !== 'all' && (
                  <button
                    onClick={() => handleFilterChange('all')}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    View all notifications
                  </button>
                )}
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 ${notification.is_read ? 'bg-white' : 'bg-blue-50'}`}
                    onClick={() => !notification.is_read && markAsRead(notification.id)}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0 mr-3">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
                
                {/* Load more indicator */}
                {isLoading && page > 1 && (
                  <li className="px-4 py-3 text-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mx-auto"></div>
                  </li>
                )}
                
                {/* Load more button */}
                {!isLoading && hasMore && (
                  <li className="px-4 py-3 text-center">
                    <button
                      onClick={loadMore}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Load more
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Notification Alert Component for displaying important notifications
export const NotificationAlert = ({ notification, onDismiss, autoHideDuration = 5000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  
  // Auto-hide notification after duration
  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) onDismiss();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [autoHideDuration, onDismiss]);
  
  // Get background color based on notification type
  const getBackgroundColor = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'security':
        return 'bg-purple-50 border-purple-200';
      case 'transaction':
        return 'bg-blue-50 border-blue-200';
      case 'info':
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };
  
  // Get icon color based on notification type
  const getIconColor = (type) => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      case 'security':
        return 'text-purple-500';
      case 'transaction':
        return 'text-blue-500';
      case 'info':
      default:
        return 'text-gray-500';
    }
  };
  
  // Get icon component based on notification type
  const getIcon = (type) => {
    const iconClass = `h-5 w-5 ${getIconColor(type)}`;
    
    switch (type) {
      case 'success':
        return <CheckCircle className={iconClass} />;
      case 'warning':
      case 'error':
        return <AlertTriangle className={iconClass} />;
      case 'security':
        return <Shield className={iconClass} />;
      case 'transaction':
        return <DollarSign className={iconClass} />;
      case 'info':
      default:
        return <Info className={iconClass} />;
    }
  };
  
  if (!isVisible || !notification) return null;
  
  return (
    <div className={`rounded-md p-4 border ${getBackgroundColor(notification.type)}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {getIcon(notification.type)}
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900">
            {notification.message}
          </p>
          {notification.details && (
            <p className="mt-1 text-sm text-gray-600">
              {notification.details}
            </p>
          )}
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={() => {
                setIsVisible(false);
                if (onDismiss) onDismiss();
              }}
              className="inline-flex rounded-md p-1.5 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Mini Notification Badge for navigation bars
export const NotificationBadge = ({ count = 0, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative p-1 rounded-full text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <Bell className="h-6 w-6" />
      {count > 0 && (
        <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
};

export default NotificationCenter;