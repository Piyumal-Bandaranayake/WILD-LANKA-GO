import React from 'react';

/**
 * Reusable Tabbed Content Component
 * Provides consistent tab navigation and content display
 */
const TabbedContent = ({ 
  tabs = [], 
  activeTab, 
  setActiveTab, 
  children,
  headerColor = "indigo"
}) => {
  const getTabColor = (color) => {
    const colors = {
      indigo: "border-indigo-500 text-indigo-600",
      green: "border-green-500 text-green-600",
      blue: "border-blue-500 text-blue-600", 
      purple: "border-purple-500 text-purple-600",
      red: "border-red-500 text-red-600",
      orange: "border-orange-500 text-orange-600",
      yellow: "border-yellow-500 text-yellow-600"
    };
    return colors[color] || colors.indigo;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Tab Navigation */}
      <div className="border-b border-gray-100">
        <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition ${
                activeTab === tab.id
                  ? `${getTabColor(headerColor)}`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default TabbedContent;
