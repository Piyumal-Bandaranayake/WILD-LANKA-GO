import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessRoute,
  getUserPermissions,
  getDashboardRoute,
  getRoleDisplayName,
  getRoleDescription,
  ROLES
} from '../utils/roleUtils';

/**
 * Custom hook for role-based permissions and access control
 * @returns {Object} Permission utilities and user role information
 */
export const usePermissions = () => {
  const { backendUser, isFullyAuthenticated } = useAuth();

  const userRole = backendUser?.role;
  const isAuthenticated = isFullyAuthenticated;

  // Memoized permission utilities to avoid recalculation
  const permissions = useMemo(() => {
    if (!userRole) return [];
    return getUserPermissions(userRole);
  }, [userRole]);

  const roleInfo = useMemo(() => {
    if (!userRole) return null;
    return {
      role: userRole,
      displayName: getRoleDisplayName(userRole),
      description: getRoleDescription(userRole),
      dashboardRoute: getDashboardRoute(userRole)
    };
  }, [userRole]);

  // Permission checking functions
  const checkPermission = (permission) => {
    return hasPermission(userRole, permission);
  };

  const checkAnyPermission = (permissionList) => {
    return hasAnyPermission(userRole, permissionList);
  };

  const checkAllPermissions = (permissionList) => {
    return hasAllPermissions(userRole, permissionList);
  };

  const checkRouteAccess = (routePermissions) => {
    return canAccessRoute(userRole, routePermissions);
  };

  // Helper function to normalize role names for comparison
  const normalizeRole = (role) => {
    if (!role) return '';
    return role.toLowerCase();
  };

  // Role checking functions with case-insensitive comparison
  const isRole = (role) => {
    return normalizeRole(userRole) === normalizeRole(role);
  };

  const isAnyRole = (roleList) => {
    return Array.isArray(roleList) ? roleList.some(role => normalizeRole(userRole) === normalizeRole(role)) : false;
  };

  const isAdmin = () => {
    return userRole === ROLES.ADMIN;
  };

  const isWildlifeOfficer = () => {
    return userRole === ROLES.WILDLIFE_OFFICER;
  };

  const isTourist = () => {
    return userRole === ROLES.TOURIST;
  };

  const isTourGuide = () => {
    return userRole === ROLES.TOUR_GUIDE;
  };

  const isSafariDriver = () => {
    return userRole === ROLES.SAFARI_DRIVER;
  };

  const isVet = () => {
    return userRole === ROLES.VET;
  };

  const isCallOperator = () => {
    return userRole === ROLES.CALL_OPERATOR;
  };

  const isEmergencyOfficer = () => {
    return userRole === ROLES.EMERGENCY_OFFICER;
  };

  // Staff role checking (non-tourist roles)
  const isStaff = () => {
    return userRole && userRole !== ROLES.TOURIST;
  };

  // Manager role checking (roles with management capabilities)
  const isManager = () => {
    return [ROLES.ADMIN, ROLES.WILDLIFE_OFFICER].includes(userRole);
  };

  // Emergency personnel checking
  const isEmergencyPersonnel = () => {
    return [ROLES.CALL_OPERATOR, ROLES.EMERGENCY_OFFICER].includes(userRole);
  };

  // Field personnel checking
  const isFieldPersonnel = () => {
    return [ROLES.TOUR_GUIDE, ROLES.SAFARI_DRIVER, ROLES.VET, ROLES.EMERGENCY_OFFICER].includes(userRole);
  };

  return {
    // User information
    userRole,
    roleInfo,
    permissions,
    isAuthenticated,

    // Permission checking
    hasPermission: checkPermission,
    hasAnyPermission: checkAnyPermission,
    hasAllPermissions: checkAllPermissions,
    canAccessRoute: checkRouteAccess,

    // Role checking
    isRole,
    isAnyRole,
    isAdmin,
    isWildlifeOfficer,
    isTourist,
    isTourGuide,
    isSafariDriver,
    isVet,
    isCallOperator,
    isEmergencyOfficer,

    // Group role checking
    isStaff,
    isManager,
    isEmergencyPersonnel,
    isFieldPersonnel
  };
};

/**
 * Custom hook for conditional rendering based on permissions
 * @param {string|string[]} permissions - Required permission(s)
 * @param {boolean} requireAll - Whether all permissions are required (default: false)
 * @returns {boolean} Whether the user has the required permissions
 */
export const usePermissionCheck = (permissions, requireAll = false) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

  return useMemo(() => {
    if (!permissions) return true;

    if (Array.isArray(permissions)) {
      return requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
    }

    return hasPermission(permissions);
  }, [permissions, requireAll, hasPermission, hasAnyPermission, hasAllPermissions]);
};

/**
 * Custom hook for role-based conditional rendering
 * @param {string|string[]} roles - Required role(s)
 * @param {boolean} requireAll - Whether all roles are required (default: false)
 * @returns {boolean} Whether the user has the required role(s)
 */
export const useRoleCheck = (roles, requireAll = false) => {
  const { isRole, isAnyRole, userRole } = usePermissions();

  return useMemo(() => {
    if (!roles) return true;

    // Helper function to normalize role names for comparison
    const normalizeRole = (role) => {
      if (!role) return '';
      return role.toLowerCase();
    };

    if (Array.isArray(roles)) {
      if (requireAll) {
        // For future multi-role support with case-insensitive comparison
        return roles.every(role => normalizeRole(role) === normalizeRole(userRole));
      }
      return isAnyRole(roles);
    }

    return isRole(roles);
  }, [roles, requireAll, isRole, isAnyRole, userRole]);
};

export default usePermissions;