import React from 'react';
import UserStatusIndicator from '../UserStatusIndicator';

/**
 * Standardized dashboard header component
 * Provides consistent greeting banner across all dashboards
 */
const DashboardHeader = ({ 
  userName, 
  userRole, 
  greeting, 
  subtitle, 
  actionText = "Get Started", 
  onActionClick,
  bgColor = "bg-blue-600",
  stats = null,
  children 
}) => {
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 18) return 'Afternoon';
    return 'Evening';
  };

  const defaultGreeting = `Good ${getTimeBasedGreeting()}, ${userName?.split(' ')[0] || userRole}`;

  return (
    <div className="mb-6">
      <div className={`${bgColor} text-white rounded-2xl p-5 flex items-center justify-between shadow-sm`}>
        <div className="flex-1">
          <h2 className="text-lg md:text-xl font-semibold">
            {greeting || defaultGreeting}
          </h2>
          <p className="text-sm opacity-90 mt-1">
            {subtitle}
          </p>
          <div className="mt-2">
            <UserStatusIndicator />
          </div>
          {onActionClick && (
            <button
              onClick={onActionClick}
              className="mt-3 bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-sm transition-colors"
            >
              {actionText}
            </button>
          )}
          {stats && (
            <div className="mt-3 flex items-center space-x-4 text-sm">
              {stats}
            </div>
          )}
        </div>
        <div className="hidden md:block">
          {children || (
            <div className="w-28 h-20 rounded-xl bg-white/10 backdrop-blur-sm" />
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
