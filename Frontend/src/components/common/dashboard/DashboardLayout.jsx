import React from 'react';
import Navbar from '../../Navbar';
import Footer from '../../footer';

/**
 * Standardized dashboard layout component
 * Provides consistent structure across all role-based dashboards
 */
const DashboardLayout = ({ 
  children, 
  className = "bg-[#F4F6FF]",
  showFooter = true 
}) => {
  return (
    <div className={`flex flex-col min-h-screen ${className}`}>
      <Navbar />
      <div className="flex-1 pt-28 pb-10">
        <div className="mx-auto max-w-7xl px-4">
          {children}
        </div>
      </div>
      {showFooter && <Footer />}
    </div>
  );
};

export default DashboardLayout;