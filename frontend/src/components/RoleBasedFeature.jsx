import React from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  const { user, backendUser } = useAuth();
  const { hasRole, hasAnyRole } = useRoleAccess();

  // Use user if backendUser is not available
  const currentUser = backendUser || user;

  // Debug: Log role checking
  console.log('🔍 RoleBasedFeature - Role check:', {
    currentUser: currentUser,
    userRole: currentUser?.role,
    requiredRole: requiredRole,
    allowedRoles: allowedRoles,
    hasUser: !!currentUser
  });

  // If no user is authenticated, don't show the feature
  if (!currentUser) {
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
  const { user, backendUser } = useAuth();
  const { hasRole, hasAnyRole } = useRoleAccess();

  // Use user if backendUser is not available
  const currentUser = backendUser || user;

  const canSee = (allowedRoles = [], requiredRole = null) => {
    if (!currentUser) return false;
    
    if (requiredRole && !hasRole(requiredRole)) return false;
    if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) return false;
    
    return true;
  };

  return { canSee, userRole: currentUser?.role };
};

export default RoleBasedFeature;
