import React from 'react';

/**
 * Standardized dashboard grid layout component
 * Provides consistent 3-column layout (sidebar, main, right panel)
 */
const DashboardGrid = ({ 
  sidebar, 
  main, 
  rightPanel,
  sidebarWidth = "md:col-span-2",
  mainWidth = "md:col-span-7", 
  rightWidth = "md:col-span-3",
  className = ""
}) => {
  return (
    <div className={`grid grid-cols-12 gap-6 ${className}`}>
      {/* Sidebar */}
      {sidebar && (
        <div className={`col-span-12 ${sidebarWidth}`}>
          {sidebar}
        </div>
      )}
      
      {/* Main Content */}
      <div className={`col-span-12 ${sidebar ? mainWidth : rightPanel ? 'md:col-span-9' : 'md:col-span-12'}`}>
        {main}
      </div>
      
      {/* Right Panel */}
      {rightPanel && (
        <div className={`col-span-12 ${rightWidth}`}>
          {rightPanel}
        </div>
      )}
    </div>
  );
};

export default DashboardGrid;
