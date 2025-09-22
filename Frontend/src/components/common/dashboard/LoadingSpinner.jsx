import React from 'react';
import DashboardLayout from './DashboardLayout';

/**
 * Standardized loading spinner for dashboards
 * Provides consistent loading states across all dashboards
 */
const LoadingSpinner = ({ 
  message = "Loading dashboard...", 
  color = "border-blue-600",
  size = "h-12 w-12" 
}) => {
  return (
    <DashboardLayout>
      <div className="flex-1 flex items-center justify-center pt-32">
        <div className="text-center">
          <div className={`animate-spin rounded-full ${size} border-b-2 ${color} mx-auto`}></div>
          <p className="mt-4 text-gray-600">{message}</p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LoadingSpinner;