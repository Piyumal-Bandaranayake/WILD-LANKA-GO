import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import AccessDenied from './AccessDenied';

const RoleGuard = ({ 
  children, 
  allowedRoles, 
  requiredRole, 
  fallback = null,
  showAccessDenied = true 
}) => {
  const { user, loading } = useAuth();

  // Show loading state while authentication is in progress
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <p className="mt-4 text-gray-600">Verifying access permissions...</p>
      </div>
    );
  }

  // If no user is authenticated, show access denied
  if (!user) {
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

  const userRole = user.role;

  // Helper function to normalize role names for comparison
  const normalizeRole = (role) => {
    if (!role) return '';
    // Convert to lowercase for comparison
    return role.toLowerCase();
  };

  // Check if user has required role (single role check with case-insensitive comparison)
  if (requiredRole && normalizeRole(userRole) !== normalizeRole(requiredRole)) {
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

  // Check if user has one of the allowed roles (multiple roles check with case-insensitive comparison)
  if (allowedRoles && !allowedRoles.some(role => normalizeRole(role) === normalizeRole(userRole))) {
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
