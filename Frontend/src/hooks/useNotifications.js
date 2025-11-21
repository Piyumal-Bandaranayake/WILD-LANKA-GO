import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notificationService';

/**
 * Hook for managing driver notifications
 */
export const useNotifications = (driverId) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async (options = {}) => {
    if (!driverId) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await notificationService.getNotifications(driverId, options);
      
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
      
      return response;
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err.message || 'Failed to fetch notifications');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [driverId]);

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
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, [driverId]);

  const markAllAsRead = useCallback(async () => {
    if (!driverId) return;

    try {
      await notificationService.markAllAsRead(driverId);
      
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, [driverId]);

  const refreshNotifications = useCallback(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh notifications
  useEffect(() => {
    if (driverId) {
      fetchNotifications();
      
      // Set up polling for new notifications
      const interval = setInterval(() => {
        fetchNotifications({ status: 'unread', limit: 1 });
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [driverId, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  };
};

export default useNotifications;
