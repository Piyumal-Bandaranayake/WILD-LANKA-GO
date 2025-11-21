import React from 'react';
import { usePermissionCheck, useRoleCheck } from '../hooks/usePermissions';

/**
 * Permission Guard component for conditional rendering based on permissions
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render if permission is granted
 * @param {string|string[]} props.permissions - Required permission(s)
 * @param {string|string[]} props.roles - Required role(s)
 * @param {boolean} props.requireAll - Whether all permissions/roles are required
 * @param {React.ReactNode} props.fallback - Content to render if permission is denied
 * @param {boolean} props.showFallback - Whether to show fallback content when access is denied
 * @returns {React.ReactNode} The rendered component or null
 */
const PermissionGuard = ({
  children,
  permissions,
  roles,
  requireAll = false,
  fallback = null,
  showFallback = false
}) => {
  const hasPermissions = usePermissionCheck(permissions, requireAll);
  const hasRoles = useRoleCheck(roles, requireAll);

  // If both permissions and roles are specified, user must satisfy both
  const hasAccess = permissions && roles
    ? hasPermissions && hasRoles
    : permissions
      ? hasPermissions
      : roles
        ? hasRoles
        : true; // If neither specified, allow access

  if (hasAccess) {
    return children;
  }

  // Return fallback content if specified and showFallback is true
  if (showFallback && fallback) {
    return fallback;
  }

  return null;
};

/**
 * Role Guard component for conditional rendering based on roles only
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to render if role check passes
 * @param {string|string[]} props.roles - Required role(s)
 * @param {boolean} props.requireAll - Whether all roles are required
 * @param {React.ReactNode} props.fallback - Content to render if role check fails
 * @param {boolean} props.showFallback - Whether to show fallback content
 * @returns {React.ReactNode} The rendered component or null
 */
export const RoleGuard = ({
  children,
  roles,
  requireAll = false,
  fallback = null,
  showFallback = false
}) => {
  return (
    <PermissionGuard
      roles={roles}
      requireAll={requireAll}
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </PermissionGuard>
  );
};

/**
 * Admin Only component - shorthand for admin role guard
 */
export const AdminOnly = ({ children, fallback = null, showFallback = false }) => {
  return (
    <RoleGuard roles="admin" fallback={fallback} showFallback={showFallback}>
      {children}
    </RoleGuard>
  );
};

/**
 * Staff Only component - shorthand for staff role guard
 */
export const StaffOnly = ({ children, fallback = null, showFallback = false }) => {
  return (
    <RoleGuard
      roles={['admin', 'wildlifeOfficer', 'tourGuide', 'safariDriver', 'vet', 'callOperator', 'emergencyOfficer']}
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * Tourist Only component - shorthand for tourist role guard
 */
export const TouristOnly = ({ children, fallback = null, showFallback = false }) => {
  return (
    <RoleGuard roles="tourist" fallback={fallback} showFallback={showFallback}>
      {children}
    </RoleGuard>
  );
};

/**
 * Manager Only component - shorthand for management roles
 */
export const ManagerOnly = ({ children, fallback = null, showFallback = false }) => {
  return (
    <RoleGuard
      roles={['admin', 'wildlifeOfficer']}
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * Emergency Personnel Only component
 */
export const EmergencyPersonnelOnly = ({ children, fallback = null, showFallback = false }) => {
  return (
    <RoleGuard
      roles={['callOperator', 'emergencyOfficer']}
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * Field Personnel Only component
 */
export const FieldPersonnelOnly = ({ children, fallback = null, showFallback = false }) => {
  return (
    <RoleGuard
      roles={['tourGuide', 'safariDriver', 'vet', 'emergencyOfficer']}
      fallback={fallback}
      showFallback={showFallback}
    >
      {children}
    </RoleGuard>
  );
};

/**
 * Conditional Button component that's only visible with permissions
 */
export const PermissionButton = ({
  permissions,
  roles,
  requireAll = false,
  children,
  className = '',
  disabled = false,
  ...buttonProps
}) => {
  const hasAccess = permissions || roles
    ? permissions
      ? usePermissionCheck(permissions, requireAll)
      : useRoleCheck(roles, requireAll)
    : true;

  if (!hasAccess) {
    return null;
  }

  return (
    <button
      className={`${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled}
      {...buttonProps}
    >
      {children}
    </button>
  );
};

/**
 * Conditional Link component that's only visible with permissions
 */
export const PermissionLink = ({
  permissions,
  roles,
  requireAll = false,
  children,
  className = '',
  ...linkProps
}) => {
  const hasAccess = permissions || roles
    ? permissions
      ? usePermissionCheck(permissions, requireAll)
      : useRoleCheck(roles, requireAll)
    : true;

  if (!hasAccess) {
    return null;
  }

  return (
    <a className={className} {...linkProps}>
      {children}
    </a>
  );
};

export default PermissionGuard;
