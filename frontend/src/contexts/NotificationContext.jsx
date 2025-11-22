import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { notificationService } from '../services/notificationService';

const NotificationContext = createContext();

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Get driver ID for notifications
  const driverId = user?.id || user?._id;
  const isDriver = user?.role === 'safariDriver';

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!driverId || !isDriver) return;

    try {
      const response = await notificationService.getNotifications(driverId);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [driverId, isDriver]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!driverId) return;

    try {
      await notificationService.markAsRead(driverId, notificationId);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [driverId]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!driverId) return;

    try {
      await notificationService.markAllAsRead(driverId);
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [driverId]);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => {
      // Check if notification already exists
      const exists = prev.some(n => n.id === notification.id);
      if (exists) return prev;
      
      return [notification, ...prev];
    });
    
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Real-time polling setup
  useEffect(() => {
    if (!driverId || !isDriver) return;

    // Initial fetch
    fetchNotifications();
    setIsConnected(true);

    // Set up polling for new notifications
    const pollInterval = setInterval(async () => {
      try {
        const response = await notificationService.getNotifications(driverId, {
          status: 'unread',
          limit: 1
        });
        
        // Check if unread count changed
        if (response.unreadCount !== unreadCount) {
          // Fetch all notifications to get the latest
          await fetchNotifications();
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
        setIsConnected(false);
      }
    }, 30000); // Poll every 30 seconds

    return () => {
      clearInterval(pollInterval);
      setIsConnected(false);
    };
  }, [driverId, isDriver, fetchNotifications, unreadCount]);

  // Browser notification permission
  useEffect(() => {
    if (isDriver && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, [isDriver]);

  // Show browser notification for new unread notifications
  useEffect(() => {
    if (isDriver && unreadCount > 0 && 'Notification' in window && Notification.permission === 'granted') {
      const latestUnread = notifications.find(n => !n.isRead);
      if (latestUnread) {
        new Notification(latestUnread.title, {
          body: latestUnread.message,
          icon: '/favicon.ico',
          tag: 'wild-lanka-notification'
        });
      }
    }
  }, [unreadCount, notifications, isDriver]);

  const value = {
    notifications,
    unreadCount,
    isConnected,
    lastUpdate,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
