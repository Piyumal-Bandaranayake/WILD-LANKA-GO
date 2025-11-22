import React from 'react';
import Navbar from './Navbar';
import Footer from './footer';

const AccessDenied = ({ 
  requiredRole, 
  userRole, 
  message = "You don't have permission to access this page.",
  showContactInfo = true 
}) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 flex items-center justify-center pt-32">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 max-w-md text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-800 mb-3">Access Denied</h2>
          <p className="text-red-700 mb-4">{message}</p>
          
          {requiredRole && userRole && (
            <div className="bg-red-100 rounded-md p-3 mb-4">
              <p className="text-sm text-red-800">
                <strong>Required Role:</strong> {requiredRole}
              </p>
              <p className="text-sm text-red-800">
                <strong>Your Role:</strong> {userRole}
              </p>
            </div>
          )}
          
          {showContactInfo && (
            <div className="text-sm text-red-600">
              <p>If you believe this is an error, please contact your administrator.</p>
            </div>
          )}
          
          <button
            onClick={() => window.history.back()}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AccessDenied;
