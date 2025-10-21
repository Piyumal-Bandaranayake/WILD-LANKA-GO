import React from 'react';

/**
 * Standardized tab navigation component
 * Provides consistent tab interface across all dashboards
 */
const TabNavigation = ({ 
  tabs, 
  activeTab, 
  onTabChange, 
  variant = "default", // default, pills, underline
  className = ""
}) => {
  const getTabClasses = (tabKey, isActive) => {
    const baseClasses = "px-4 py-2 text-sm font-medium transition-colors";
    
    switch (variant) {
      case "pills":
        return `${baseClasses} rounded-lg ${
          isActive 
            ? 'bg-indigo-600 text-white' 
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        }`;
      
      case "underline":
        return `${baseClasses} border-b-2 ${
          isActive 
            ? 'border-indigo-500 text-indigo-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;
      
      default:
        return `${baseClasses} rounded-lg ${
          isActive 
            ? 'bg-indigo-600 text-white' 
            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
        }`;
    }
  };

  return (
    <div className={`flex flex-wrap gap-2 mb-4 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onTabChange(tab.key)}
          className={getTabClasses(tab.key, activeTab === tab.key)}
        >
          {tab.icon && <span className="mr-2">{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              activeTab === tab.key 
                ? 'bg-white/20 text-white' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;