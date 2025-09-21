import React from 'react';
import { useAuthContext } from '../../contexts/AuthContext';

/**
 * Reusable Dashboard Layout Component
 * Provides consistent layout structure for all role dashboards
 */
const DashboardLayout = ({ 
  children, 
  sidebarItems = [], 
  activeTab, 
  setActiveTab,
  searchValue,
  setSearchValue,
  searchPlaceholder = "Search something...",
  greetingMessage,
  statsCards = [],
  rightWidgets = [],
  headerColor = "indigo",
  showAddButton = false,
  onAddClick,
  addButtonText = "Add New"
}) => {
  const { backendUser, user } = useAuthContext();

  const getHeaderGradient = (color) => {
    const gradients = {
      indigo: "from-indigo-600 to-indigo-700",
      green: "from-green-600 to-green-700", 
      blue: "from-blue-600 to-blue-700",
      purple: "from-purple-600 to-purple-700",
      red: "from-red-600 to-red-700",
      orange: "from-orange-600 to-orange-700",
      yellow: "from-yellow-600 to-yellow-700"
    };
    return gradients[color] || gradients.indigo;
  };

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
    <div className="flex-1 pt-28 pb-10">
      <div className="mx-auto max-w-7xl px-4">
        {/* Grid: Sidebar | Main | Right */}
        <div className="grid grid-cols-12 gap-6">
          {/* LEFT SIDEBAR */}
          <aside className="col-span-12 md:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-24">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                  {backendUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="font-semibold">Dashboard</div>
              </div>

              {sidebarItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.onClick) {
                      item.onClick();
                    } else if (setActiveTab) {
                      setActiveTab(item.id);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition
                    ${activeTab === item.id ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <span className={`p-2 rounded-lg ${activeTab === item.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.icon}
                  </span>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}

              {showAddButton && onAddClick && (
                <div className="mt-4 border-t pt-3">
                  <button
                    onClick={onAddClick}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3 py-2 text-sm font-semibold"
                  >
                    {addButtonText}
                  </button>
                </div>
              )}
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="col-span-12 md:col-span-7">
            {/* Top search + greeting banner */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-1">
                  <input
                    value={searchValue || ''}
                    onChange={(e) => setSearchValue && setSearchValue(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 shadow-sm border border-gray-200 focus:outline-none"
                  />
                  <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16 10.5A5.5 5.5 0 105.5 16 5.5 5.5 0 0016 10.5z" />
                  </svg>
                </div>
                {showAddButton && onAddClick && (
                  <button
                    onClick={onAddClick}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 shadow-sm"
                  >
                    {addButtonText}
                  </button>
                )}
              </div>

              {greetingMessage && (
                <div className={`bg-gradient-to-r ${getHeaderGradient(headerColor)} text-white rounded-2xl p-5 flex items-center justify-between shadow-sm`}>
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold">
                      {greetingMessage}
                    </h2>
                    <p className="text-sm opacity-90 mt-1">
                      Welcome back, {backendUser?.name?.split(' ')[0] || 'User'}!
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <div className="w-28 h-20 rounded-xl bg-white/10 backdrop-blur-sm" />
                  </div>
                </div>
              )}
            </div>

            {/* Stats Cards */}
            {statsCards.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {statsCards.map((card, index) => (
                  <StatCard 
                    key={index}
                    title={card.title} 
                    value={card.value} 
                    color={card.color} 
                    icon={card.icon}
                    iconPath={card.iconPath}
                    change={card.change}
                  />
                ))}
              </div>
            )}

            {/* Main Content Area */}
            <div className="space-y-6">
              {children}
            </div>
          </main>

          {/* RIGHT WIDGETS */}
          <aside className="col-span-12 md:col-span-3">
            <div className="space-y-6">
              {/* Profile mini */}
              <div className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
                    {backendUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800">{backendUser?.name || user?.displayName || 'User'}</div>
                    <div className="text-xs text-gray-500">View profile</div>
                  </div>
                </div>
              </div>

              {/* Custom Right Widgets */}
              {rightWidgets.map((widget, index) => (
                <div key={index} className="bg-white rounded-2xl shadow-sm p-5">
                  {widget.title && (
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">{widget.title}</h3>
                  )}
                  {widget.content}
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// StatCard Component
const StatCard = ({ title, value, color = 'blue', icon, iconPath, change }) => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600'
  };
  
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center">
        <span className={`p-2 rounded-xl ${colorMap[color]}`}>
          {icon ? (
            <span className="text-lg">{icon}</span>
          ) : iconPath ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath} />
            </svg>
          ) : null}
        </span>
        <div className="ml-3 flex-1">
          <div className="text-xs text-gray-500">{title}</div>
          <div className="text-xl font-bold text-gray-800">{value}</div>
          {change && (
            <div className="text-xs text-gray-500 mt-1">{change}</div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * TabbedContent Component
 * Provides tabbed interface for main content area
 */
const TabbedContent = ({ 
  tabs = [], 
  activeTab, 
  setActiveTab, 
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
    <div className="bg-white rounded-2xl shadow-sm">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? `${getTabColor(headerColor)}`
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {tabs.find(tab => tab.id === activeTab)?.content || (
          <div className="text-center py-8 text-gray-500">
            No content available for this tab.
          </div>
        )}
      </div>
    </div>
  );
};

export { DashboardLayout, TabbedContent };
