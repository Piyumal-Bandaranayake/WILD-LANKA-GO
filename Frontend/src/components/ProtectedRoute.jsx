import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], fallback = null, requireAllRoles = false }) => {
  const { isFullyAuthenticated, isLoading, loginWithRedirect, backendUser } = useAuthContext();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show login prompt or fallback
  if (!isFullyAuthenticated) {
    if (fallback) {
      return fallback;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please log in to access this page.</p>
          </div>

          <button
            onClick={() => loginWithRedirect()}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    );
  }

  // Check role-based permissions if allowedRoles is specified
  if (allowedRoles.length > 0 && backendUser) {
    const userRole = backendUser.role;

    // Check if user has required role(s)
    const hasPermission = requireAllRoles
      ? allowedRoles.every(role => userRole === role || userRole === 'admin') // Admin has access to everything
      : allowedRoles.includes(userRole) || userRole === 'admin'; // Admin has access to everything

    if (!hasPermission) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
              <p className="text-gray-600">
                You don't have permission to access this page.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Required role(s): {allowedRoles.join(', ')}
              </p>
              <p className="text-sm text-gray-500">
                Your role: {userRole}
              </p>
            </div>

            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      );
    }
  }

  // User is fully authenticated and has required permissions, render the protected content
  return children;
};

export default ProtectedRoute;