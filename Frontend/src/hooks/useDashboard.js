import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for standardized dashboard state management
 * Provides consistent loading, error, and data management patterns
 */
export const useDashboard = (initialTab = 'overview') => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({});

  const handleError = useCallback((error, message = 'An error occurred') => {
    console.error('Dashboard error:', error);
    setError(message);
    setLoading(false);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateData = useCallback((key, value) => {
    setData(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const setLoadingState = useCallback((isLoading) => {
    setLoading(isLoading);
    if (isLoading) {
      setError(null);
    }
  }, []);

  return {
    activeTab,
    setActiveTab,
    loading,
    setLoading: setLoadingState,
    error,
    setError,
    handleError,
    clearError,
    data,
    setData,
    updateData
  };
};

/**
 * Hook for managing dashboard stats with automatic refresh
 */
export const useDashboardStats = (fetchFunction, refreshInterval = 30000) => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchFunction();
      setStats(result);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    fetchStats();
    
    if (refreshInterval > 0) {
      const interval = setInterval(fetchStats, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchStats, refreshInterval]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats
  };
};

/**
 * Hook for managing dashboard notifications and alerts
 */
export const useDashboardNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now();
    const newNotification = {
      id,
      timestamp: new Date(),
      ...notification
    };
    
    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove after 5 seconds for success/info notifications
    if (notification.type === 'success' || notification.type === 'info') {
      setTimeout(() => {
        removeNotification(id);
      }, 5000);
    }
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications
  };
};