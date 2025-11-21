import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * User Status Indicator Component
 * Shows the current user's availability status
 */
const UserStatusIndicator = ({ className = "" }) => {
  const { user, backendUser } = useAuth();
  
  // Use user if backendUser is not available
  const currentUser = backendUser || user;
  
  // Only show for system users (not tourists)
  if (!currentUser || currentUser.role === 'tourist') {
    return null;
  }

  const isAvailable = currentUser.isAvailable;
  const statusText = isAvailable ? 'Available' : 'Unavailable';
  const statusColor = isAvailable ? 'green' : 'red';
  const statusIcon = isAvailable ? '🟢' : '🔴';

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span className="text-sm">{statusIcon}</span>
      <span className={`text-sm font-medium ${
        statusColor === 'green' ? 'text-green-600' : 'text-red-600'
      }`}>
        {statusText}
      </span>
    </div>
  );
};

export default UserStatusIndicator;
