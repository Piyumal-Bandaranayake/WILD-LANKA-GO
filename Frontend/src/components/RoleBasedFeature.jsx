import React from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import useRoleAccess from '../hooks/useRoleAccess';

/**
 * Component that conditionally renders content based on user role
 */
const RoleBasedFeature = ({ 
  children, 
  allowedRoles = [], 
  requiredRole = null,
  fallback = null,
  hideIfNoAccess = true 
}) => {
  const { backendUser } = useAuthContext();
  const { hasRole, hasAnyRole } = useRoleAccess();

  // If no user is authenticated, don't show the feature
  if (!backendUser) {
    return hideIfNoAccess ? null : fallback;
  }

  // Check if user has required role (single role check)
  if (requiredRole && !hasRole(requiredRole)) {
    return hideIfNoAccess ? null : fallback;
  }

  // Check if user has one of the allowed roles (multiple roles check)
  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    return hideIfNoAccess ? null : fallback;
  }

  // User has appropriate role, render children
  return children;
};

/**
 * Hook for conditional rendering based on role
 */
export const useRoleBasedVisibility = () => {
  const { backendUser } = useAuthContext();
  const { hasRole, hasAnyRole } = useRoleAccess();

  const canSee = (allowedRoles = [], requiredRole = null) => {
    if (!backendUser) return false;
    
    if (requiredRole && !hasRole(requiredRole)) return false;
    if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) return false;
    
    return true;
  };

  return { canSee, userRole: backendUser?.role };
};

export default RoleBasedFeature;