import React from 'react';

/**
 * Standardized dashboard sidebar component
 * Provides consistent navigation across all dashboards
 */
const DashboardSidebar = ({ 
  title, 
  icon, 
  activeTab, 
  onTabChange, 
  menuItems = [], 
  actions = null,
  className = "col-span-12 md:col-span-2" 
}) => {
  return (
    <aside className={className}>
      <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-24">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
            {icon}
          </div>
          <div className="font-semibold">{title}</div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onTabChange(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition-all ${
                activeTab === item.key 
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className={`p-2 rounded-lg ${
                activeTab === item.key 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
              {item.count !== undefined && (
                <span className={`ml-auto px-2 py-1 rounded-full text-xs font-medium ${
                  activeTab === item.key 
                    ? 'bg-indigo-200 text-indigo-800' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Actions */}
        {actions && (
          <div className="mt-4 border-t pt-3">
            {actions}
          </div>
        )}
      </div>
    </aside>
  );
};

export default DashboardSidebar;