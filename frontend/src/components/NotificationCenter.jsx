import React, { useState, useEffect } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';

// Helper function to format relative time
const formatDistanceToNow = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 2592000) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffInSeconds / 31536000);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
};

/**
 * Notification Center Component
 * Displays notifications for drivers with read/unread functionality
 */
const NotificationCenter = ({ 
  driverId, 
  isOpen, 
  onClose, 
  onNotificationClick
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isConnected } = useNotificationContext();
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter notifications based on selected filter
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'read') return notification.isRead;
    return true; // 'all'
  });

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId);
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
  };

  const getNotificationIcon = (type, source) => {
    if (source === 'tour_assignment') {
      return (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex-shrink-0">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    );
  };

  const getNotificationBadge = (type) => {
    const badges = {
      'ASSIGNED_TOUR': { text: 'Tour Assignment', color: 'bg-blue-100 text-blue-800' },
      'Tour Assignment': { text: 'Assignment', color: 'bg-green-100 text-green-800' },
      'Fuel Claim Update': { text: 'Fuel', color: 'bg-yellow-100 text-yellow-800' },
      'Maintenance Alert': { text: 'Maintenance', color: 'bg-red-100 text-red-800' },
      'System Alert': { text: 'System', color: 'bg-gray-100 text-gray-800' }
    };
    
    const badge = badges[type] || { text: type, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      <div className="relative max-w-md mx-auto mt-16 bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {notifications.filter(n => !n.isRead).length}
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
            
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Actions */}
        {unreadCount > 0 && (
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {!isConnected ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Connecting to notifications...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Try again
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="p-4 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
              </svg>
              <p className="text-sm text-gray-500">No notifications found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type, notification.source)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h4>
                          {getNotificationBadge(notification.type)}
                        </div>
                        
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="mt-1 text-sm text-gray-600">
                        {notification.message}
                      </p>
                      
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </p>
                        
                        {notification.meta && notification.meta.tourDate && (
                          <span className="text-xs text-blue-600">
                            {new Date(notification.meta.tourDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;
