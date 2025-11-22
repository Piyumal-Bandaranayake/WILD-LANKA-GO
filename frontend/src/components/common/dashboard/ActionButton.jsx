import React from 'react';

/**
 * Standardized action button component
 * Provides consistent button styling across all dashboards
 */
const ActionButton = ({ 
  children, 
  onClick, 
  variant = "primary", // primary, secondary, success, danger, warning, info
  size = "md", // sm, md, lg
  icon,
  loading = false,
  disabled = false,
  className = "",
  ...props
}) => {
  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white border-transparent',
    secondary: 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300',
    success: 'bg-green-600 hover:bg-green-700 text-white border-transparent',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
    warning: 'bg-yellow-600 hover:bg-yellow-700 text-white border-transparent',
    info: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500";
  
  const disabledClasses = disabled || loading ? "opacity-50 cursor-not-allowed" : "";

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default ActionButton;
