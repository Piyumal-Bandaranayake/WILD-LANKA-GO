import React, { useState } from 'react';
import { useNotificationContext } from '../contexts/NotificationContext';
import NotificationCenter from './NotificationCenter';

/**
 * Notification Bell Component
 * Shows notification count and opens notification center
 */
const NotificationBell = ({ driverId, className = '' }) => {
  const { unreadCount, isConnected } = useNotificationContext();
  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notification) => {
    // Handle notification click - could navigate to relevant page
    console.log('Notification clicked:', notification);
    
    // If it's a tour assignment, could navigate to tours page
    if (notification.source === 'tour_assignment' && notification.tourId) {
      // Navigate to tour details or tours list
      console.log('Navigate to tour:', notification.tourId);
    }
  };

  const handleRefresh = () => {
    // Refresh is handled by the context
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full ${className}`}
        disabled={!isConnected}
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" 
          />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        
        {!isConnected && (
          <div className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full"></div>
          </div>
        )}
      </button>

      <NotificationCenter
        driverId={driverId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onNotificationClick={handleNotificationClick}
        refreshTrigger={unreadCount}
      />
    </>
  );
};

export default NotificationBell;
