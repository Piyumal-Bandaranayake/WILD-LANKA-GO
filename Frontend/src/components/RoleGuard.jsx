import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import AccessDenied from './AccessDenied';

const RoleGuard = ({ 
  children, 
  allowedRoles, 
  requiredRole, 
  fallback = null,
  showAccessDenied = true 
}) => {
  const { backendUser, isLoading } = useAuthContext();

  // Show loading state while authentication is in progress
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="mt-4 text-gray-600">Verifying access permissions...</p>
      </div>
    );
  }

  // If no user is authenticated, show access denied
  if (!backendUser) {
    if (fallback) return fallback;
    if (showAccessDenied) {
      return (
        <AccessDenied 
          message="You must be logged in to access this page."
          showContactInfo={false}
        />
      );
    }
    return null;
  }

  const userRole = backendUser.role;

  // Check if user has required role (single role check)
  if (requiredRole && userRole !== requiredRole) {
    if (fallback) return fallback;
    if (showAccessDenied) {
      return (
        <AccessDenied 
          requiredRole={requiredRole}
          userRole={userRole}
          message={`This page is restricted to ${requiredRole} users only.`}
        />
      );
    }
    return null;
  }

  // Check if user has one of the allowed roles (multiple roles check)
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (fallback) return fallback;
    if (showAccessDenied) {
      return (
        <AccessDenied 
          requiredRole={allowedRoles.join(', ')}
          userRole={userRole}
          message={`This page is restricted to users with the following roles: ${allowedRoles.join(', ')}.`}
        />
      );
    }
    return null;
  }

  // User has appropriate role, render children
  return children;
};

export default RoleGuard;