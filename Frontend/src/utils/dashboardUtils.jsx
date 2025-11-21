import { DASHBOARD_COLORS, DASHBOARD_NAVIGATION, DASHBOARD_TITLES } from '../config/dashboardConfig.jsx';

/**
 * Utility functions for dashboard standardization
 */

/**
 * Get dashboard configuration for a specific role
 */
export const getDashboardConfig = (role) => {
  return {
    colors: DASHBOARD_COLORS[role] || DASHBOARD_COLORS.tourist,
    navigation: DASHBOARD_NAVIGATION[role] || [],
    title: DASHBOARD_TITLES[role] || 'Dashboard'
  };
};

/**
 * Generate consistent greeting message
 */
export const getGreetingMessage = (userName, role, stats = {}) => {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
  const name = userName?.split(' ')[0] || role;
  
  const roleMessages = {
    admin: `You have ${stats.pendingApplications || 0} new applications. It's a lot of work for today!`,
    vet: `You have ${stats.activeCases || 0} active cases and ${stats.lowStockMedications || 0} low stock alerts.`,
    tourist: `You have ${stats.activeBookings || 0} active bookings and ${stats.eventRegistrations || 0} event registrations.`,
    callOperator: `You have ${stats.activeEmergencies || 0} active emergencies and ${stats.pendingComplaints || 0} pending complaints requiring attention.`,
    emergencyOfficer: `You have ${stats.pendingEmergencies || 0} pending emergencies and ${stats.inProgressEmergencies || 0} in progress.`,
    safariDriver: `You have ${stats.pendingTours || 0} pending tour assignments.`,
    tourGuide: `You have ${stats.pendingTours || 0} pending tour assignments.`,
    wildlifeOfficer: `You have ${stats.todayBookings || 0} bookings today and ${stats.pendingComplaints || 0} pending complaints.`
  };

  return {
    greeting: `Good ${timeGreeting}, ${name}`,
    subtitle: roleMessages[role] || 'Welcome to your dashboard!'
  };
};

/**
 * Format numbers for display in stat cards
 */
export const formatStatValue = (value, type = 'number') => {
  if (value === null || value === undefined) return '0';
  
  switch (type) {
    case 'currency':
      return `LKR ${Number(value).toLocaleString()}`;
    case 'percentage':
      return `${Number(value).toFixed(1)}%`;
    case 'decimal':
      return Number(value).toFixed(1);
    default:
      return Number(value).toLocaleString();
  }
};

/**
 * Get status badge color classes
 */
export const getStatusColor = (status) => {
  const statusColors = {
    // General statuses
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    
    // Emergency statuses
    'in-progress': 'bg-blue-100 text-blue-800',
    resolved: 'bg-green-100 text-green-800',
    critical: 'bg-red-200 text-red-900',
    
    // Priority levels
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
    
    // Animal case statuses
    unassigned: 'bg-gray-100 text-gray-800',
    assigned: 'bg-blue-100 text-blue-800'
  };
  
  return statusColors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
};

/**
 * Get priority color classes
 */
export const getPriorityColor = (priority) => {
  return getStatusColor(priority);
};

/**
 * Format date for display
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return 'N/A';
  
  const dateObj = new Date(date);
  
  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString();
    case 'long':
      return dateObj.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    case 'time':
      return dateObj.toLocaleTimeString();
    case 'datetime':
      return dateObj.toLocaleString();
    case 'relative':
      return getTimeAgo(dateObj);
    default:
      return dateObj.toLocaleDateString();
  }
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getTimeAgo = (date) => {
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  return date.toLocaleDateString();
};

/**
 * Generate avatar initials from name
 */
export const getAvatarInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase())
    .join('') || 'U';
};

/**
 * Create avatar component
 */
export const createAvatar = (user, size = 'w-10 h-10') => {
  const src = user?.avatar || user?.photo || user?.profileImageUrl;
  const name = user?.name || user?.fullName || 'User';
  
  if (src) {
    return (
      <img 
        src={src} 
        alt={name} 
        className={`${size} rounded-full object-cover`} 
      />
    );
  }
  
  const initials = getAvatarInitials(name);
  return (
    <div className={`${size} rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold`}>
      {initials}
    </div>
  );
};

/**
 * Validate required dashboard props
 */
export const validateDashboardProps = (props, requiredProps = []) => {
  const missing = requiredProps.filter(prop => !props[prop]);
  if (missing.length > 0) {
    console.warn(`Missing required dashboard props: ${missing.join(', ')}`);
  }
  return missing.length === 0;
};

/**
 * Generate consistent error messages
 */
export const getDashboardErrorMessage = (error, context = 'dashboard') => {
  const defaultMessages = {
    network: `Failed to load ${context} data. Please check your connection.`,
    permission: `You don't have permission to access this ${context}.`,
    notFound: `${context} not found.`,
    server: `Server error occurred while loading ${context}.`,
    unknown: `An unexpected error occurred in ${context}.`
  };
  
  if (typeof error === 'string') return error;
  
  if (error?.response?.status === 403) return defaultMessages.permission;
  if (error?.response?.status === 404) return defaultMessages.notFound;
  if (error?.response?.status >= 500) return defaultMessages.server;
  if (error?.code === 'NETWORK_ERROR') return defaultMessages.network;
  
  return defaultMessages.unknown;
};
