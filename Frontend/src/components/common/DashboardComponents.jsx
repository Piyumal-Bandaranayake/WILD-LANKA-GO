import React from 'react';

/**
 * Reusable Dashboard UI Components
 */

// Modal Component
export const Modal = ({ children, onClose, title, size = 'md' }) => {
  const width = size === 'lg' ? 'max-w-2xl' : size === 'md' ? 'max-w-md' : 'max-w-sm';
  
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3">
      <div className={`bg-white rounded-2xl p-6 w-full ${width} max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Field Component
export const Field = ({ label, children, required = false }) => (
  <label className="block">
    <span className="block text-sm font-medium mb-1">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </span>
    {children}
  </label>
);

// Input Component
export const Input = ({ className = "", ...props }) => (
  <input 
    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 ${className}`}
    {...props}
  />
);

// Button Components
export const Button = ({ variant = "primary", size = "md", className = "", children, ...props }) => {
  const baseClasses = "rounded-lg font-medium transition-colors";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700",
    secondary: "bg-gray-500 text-white hover:bg-gray-600",
    success: "bg-green-600 text-white hover:bg-green-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    warning: "bg-yellow-600 text-white hover:bg-yellow-700",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Status Badge Component
export const StatusBadge = ({ status, variant = "default" }) => {
  const getStatusStyles = (status) => {
    const statusMap = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      active: "bg-green-100 text-green-800",
      inactive: "bg-gray-100 text-gray-800",
      completed: "bg-blue-100 text-blue-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      cancelled: "bg-red-100 text-red-800",
      confirmed: "bg-green-100 text-green-800",
      critical: "bg-red-100 text-red-800",
      high: "bg-orange-100 text-orange-800",
      medium: "bg-yellow-100 text-yellow-800",
      low: "bg-green-100 text-green-800"
    };
    
    return statusMap[status?.toLowerCase()] || "bg-gray-100 text-gray-800";
  };
  
  return (
    <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusStyles(status)}`}>
      {status?.toUpperCase() || 'UNKNOWN'}
    </span>
  );
};

// Avatar Component
export const Avatar = ({ user, size = "md", className = "" }) => {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };
  
  const src = user?.avatar || user?.photo || user?.profileImageUrl || user?.picture;
  const name = user?.name || user?.fullName || user?.displayName || 'U N';
  const initials = name.split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'U';
  
  if (src) {
    return (
      <img 
        src={src} 
        alt={name} 
        className={`${sizes[size]} rounded-full object-cover ${className}`} 
      />
    );
  }
  
  return (
    <div className={`${sizes[size]} rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold ${className}`}>
      {initials}
    </div>
  );
};

// Data Table Component
export const DataTable = ({ headers, data, renderRow, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm overflow-hidden ${className}`}>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((header, index) => (
              <th 
                key={index} 
                className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((item, index) => renderRow(item, index))}
        </tbody>
      </table>
    </div>
  </div>
);

// Card Component
export const Card = ({ children, className = "", title, actions }) => (
  <div className={`bg-white rounded-2xl shadow-sm p-6 ${className}`}>
    {title && (
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        {actions && <div className="flex space-x-2">{actions}</div>}
      </div>
    )}
    {children}
  </div>
);

// Loading Spinner Component
export const LoadingSpinner = ({ size = "md", className = "" }) => {
  const sizes = {
    sm: "h-6 w-6",
    md: "h-12 w-12",
    lg: "h-16 w-16"
  };
  
  return (
    <div className={`animate-spin rounded-full border-b-2 border-indigo-600 ${sizes[size]} ${className}`}></div>
  );
};

// Empty State Component
export const EmptyState = ({ 
  icon, 
  title, 
  description, 
  action, 
  className = "" 
}) => (
  <div className={`text-center py-12 ${className}`}>
    {icon && <div className="text-6xl mb-4">{icon}</div>}
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6">{description}</p>
    {action && action}
  </div>
);

// KPI Component
export const KPI = ({ label, value, accent = "text-indigo-600", className = "" }) => (
  <div className={`text-center ${className}`}>
    <div className={`text-3xl font-bold ${accent}`}>{value}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

// Item Component for displaying key-value pairs
export const Item = ({ label, value, className = "" }) => (
  <div className={className}>
    <div className="text-gray-500 text-xs">{label}</div>
    <div className="text-sm font-medium text-gray-800">{value || '-'}</div>
  </div>
);

// Calendar Component (mini week view)
export const MiniCalendar = ({ className = "" }) => {
  const week = React.useMemo(() => {
    const base = new Date();
    const day = base.getDay();
    const mondayOffset = ((day + 6) % 7);
    const monday = new Date(base);
    monday.setDate(base.getDate() - mondayOffset);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, []);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800">Schedule Calendar</h4>
        <div className="text-xs text-gray-400">
          {new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {week.map((d, idx) => {
          const isToday = new Date().toDateString() === d.toDateString();
          return (
            <div 
              key={idx} 
              className={`rounded-xl text-center py-2 ${
                isToday ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-700'
              }`}
            >
              <div className="text-[10px] uppercase">
                {d.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div className="text-sm font-semibold">{d.getDate()}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
