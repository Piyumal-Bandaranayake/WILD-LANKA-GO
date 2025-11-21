// Role definitions and permissions management

export const ROLES = {
  ADMIN: 'admin',
  WILDLIFE_OFFICER: 'wildlifeOfficer',
  TOURIST: 'tourist',
  TOUR_GUIDE: 'tourGuide',
  SAFARI_DRIVER: 'safariDriver',
  VET: 'vet',
  CALL_OPERATOR: 'callOperator',
  EMERGENCY_OFFICER: 'emergencyOfficer'
};

export const ROLE_DISPLAY_NAMES = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.WILDLIFE_OFFICER]: 'Wildlife Officer',
  [ROLES.TOURIST]: 'Tourist',
  [ROLES.TOUR_GUIDE]: 'Tour Guide',
  [ROLES.SAFARI_DRIVER]: 'Safari Driver',
  [ROLES.VET]: 'Veterinarian',
  [ROLES.CALL_OPERATOR]: 'Call Operator',
  [ROLES.EMERGENCY_OFFICER]: 'Emergency Officer'
};

export const ROLE_DESCRIPTIONS = {
  [ROLES.ADMIN]: 'Full system access and management capabilities',
  [ROLES.WILDLIFE_OFFICER]: 'Manage bookings, complaints, applications, and park operations',
  [ROLES.TOURIST]: 'Book activities, register for events, make donations, and report issues',
  [ROLES.TOUR_GUIDE]: 'Manage tour assignments, materials, and progress tracking',
  [ROLES.SAFARI_DRIVER]: 'Handle tour assignments, odometer tracking, and fuel claims',
  [ROLES.VET]: 'Animal care management, treatments, and medical records',
  [ROLES.CALL_OPERATOR]: 'Emergency call handling and incident management',
  [ROLES.EMERGENCY_OFFICER]: 'Emergency response and first-aid coordination'
};

export const PERMISSIONS = {
  // Activity Management
  VIEW_ACTIVITIES: 'view_activities',
  CREATE_ACTIVITY: 'create_activity',
  EDIT_ACTIVITY: 'edit_activity',
  DELETE_ACTIVITY: 'delete_activity',
  BOOK_ACTIVITY: 'book_activity',

  // Event Management
  VIEW_EVENTS: 'view_events',
  CREATE_EVENT: 'create_event',
  EDIT_EVENT: 'edit_event',
  DELETE_EVENT: 'delete_event',
  REGISTER_EVENT: 'register_event',

  // Booking Management
  VIEW_ALL_BOOKINGS: 'view_all_bookings',
  VIEW_OWN_BOOKINGS: 'view_own_bookings',
  ASSIGN_DRIVER: 'assign_driver',
  ASSIGN_GUIDE: 'assign_guide',
  CANCEL_BOOKING: 'cancel_booking',

  // User Management
  VIEW_ALL_USERS: 'view_all_users',
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  APPROVE_APPLICATION: 'approve_application',

  // Animal Care
  VIEW_ANIMAL_CASES: 'view_animal_cases',
  CREATE_ANIMAL_CASE: 'create_animal_case',
  EDIT_ANIMAL_CASE: 'edit_animal_case',
  DELETE_ANIMAL_CASE: 'delete_animal_case',
  MANAGE_TREATMENTS: 'manage_treatments',
  MANAGE_MEDICATION: 'manage_medication',

  // Emergency Management
  VIEW_EMERGENCIES: 'view_emergencies',
  CREATE_EMERGENCY: 'create_emergency',
  HANDLE_EMERGENCY: 'handle_emergency',
  FORWARD_EMERGENCY: 'forward_emergency',

  // Complaint Management
  VIEW_COMPLAINTS: 'view_complaints',
  CREATE_COMPLAINT: 'create_complaint',
  REPLY_COMPLAINT: 'reply_complaint',
  DELETE_COMPLAINT: 'delete_complaint',

  // Financial Management
  VIEW_DONATIONS: 'view_donations',
  MAKE_DONATION: 'make_donation',
  VIEW_FUEL_CLAIMS: 'view_fuel_claims',
  SUBMIT_FUEL_CLAIM: 'submit_fuel_claim',
  APPROVE_FUEL_CLAIM: 'approve_fuel_claim',

  // Reporting
  GENERATE_REPORTS: 'generate_reports',
  VIEW_ANALYTICS: 'view_analytics'
};

// Role-based permissions mapping
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // Admin has all permissions

  [ROLES.WILDLIFE_OFFICER]: [
    PERMISSIONS.VIEW_ALL_BOOKINGS,
    PERMISSIONS.ASSIGN_DRIVER,
    PERMISSIONS.ASSIGN_GUIDE,
    PERMISSIONS.VIEW_COMPLAINTS,
    PERMISSIONS.REPLY_COMPLAINT,
    PERMISSIONS.DELETE_COMPLAINT,
    PERMISSIONS.APPROVE_APPLICATION,
    PERMISSIONS.VIEW_FUEL_CLAIMS,
    PERMISSIONS.APPROVE_FUEL_CLAIM,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.VIEW_ALL_USERS
  ],

  [ROLES.TOURIST]: [
    PERMISSIONS.VIEW_ACTIVITIES,
    PERMISSIONS.BOOK_ACTIVITY,
    PERMISSIONS.VIEW_EVENTS,
    PERMISSIONS.REGISTER_EVENT,
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.MAKE_DONATION,
    PERMISSIONS.CREATE_COMPLAINT,
    PERMISSIONS.CREATE_EMERGENCY
  ],

  [ROLES.TOUR_GUIDE]: [
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.GENERATE_REPORTS
  ],

  [ROLES.SAFARI_DRIVER]: [
    PERMISSIONS.VIEW_OWN_BOOKINGS,
    PERMISSIONS.SUBMIT_FUEL_CLAIM,
    PERMISSIONS.VIEW_FUEL_CLAIMS,
    PERMISSIONS.GENERATE_REPORTS
  ],

  [ROLES.VET]: [
    PERMISSIONS.VIEW_ANIMAL_CASES,
    PERMISSIONS.CREATE_ANIMAL_CASE,
    PERMISSIONS.EDIT_ANIMAL_CASE,
    PERMISSIONS.DELETE_ANIMAL_CASE,
    PERMISSIONS.MANAGE_TREATMENTS,
    PERMISSIONS.MANAGE_MEDICATION,
    PERMISSIONS.GENERATE_REPORTS
  ],

  [ROLES.CALL_OPERATOR]: [
    PERMISSIONS.VIEW_EMERGENCIES,
    PERMISSIONS.HANDLE_EMERGENCY,
    PERMISSIONS.FORWARD_EMERGENCY,
    PERMISSIONS.VIEW_COMPLAINTS,
    PERMISSIONS.REPLY_COMPLAINT,
    PERMISSIONS.GENERATE_REPORTS
  ],

  [ROLES.EMERGENCY_OFFICER]: [
    PERMISSIONS.VIEW_EMERGENCIES,
    PERMISSIONS.HANDLE_EMERGENCY,
    PERMISSIONS.GENERATE_REPORTS
  ]
};

// Utility functions
export const hasPermission = (userRole, permission) => {
  if (!userRole || !permission) return false;

  // Admin has all permissions
  if (userRole === ROLES.ADMIN) return true;

  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

export const hasAnyPermission = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;
  return permissions.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole, permissions) => {
  if (!userRole || !permissions || !Array.isArray(permissions)) return false;
  return permissions.every(permission => hasPermission(userRole, permission));
};

export const canAccessRoute = (userRole, routePermissions) => {
  if (!routePermissions || routePermissions.length === 0) return true;
  return hasAnyPermission(userRole, routePermissions);
};

export const getUserPermissions = (userRole) => {
  if (!userRole) return [];
  return ROLE_PERMISSIONS[userRole] || [];
};

export const getRoleDisplayName = (role) => {
  return ROLE_DISPLAY_NAMES[role] || role;
};

export const getRoleDescription = (role) => {
  return ROLE_DESCRIPTIONS[role] || 'No description available';
};

export const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};

export const getAvailableRoles = () => {
  return Object.values(ROLES);
};

// Dashboard route mappings
export const DASHBOARD_ROUTES = {
  [ROLES.ADMIN]: '/dashboard/admin',
  [ROLES.WILDLIFE_OFFICER]: '/dashboard/wildlife-officer',
  [ROLES.TOURIST]: '/dashboard/tourist',
  [ROLES.TOUR_GUIDE]: '/dashboard/tour-guide',
  [ROLES.SAFARI_DRIVER]: '/dashboard/safari-driver',
  [ROLES.VET]: '/dashboard/vet',
  [ROLES.CALL_OPERATOR]: '/dashboard/call-operator',
  [ROLES.EMERGENCY_OFFICER]: '/dashboard/emergency-officer'
};

export const getDashboardRoute = (userRole) => {
  return DASHBOARD_ROUTES[userRole] || '/dashboard';
};

// Role hierarchy (for future use)
export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 10,
  [ROLES.WILDLIFE_OFFICER]: 8,
  [ROLES.CALL_OPERATOR]: 7,
  [ROLES.EMERGENCY_OFFICER]: 6,
  [ROLES.VET]: 5,
  [ROLES.TOUR_GUIDE]: 4,
  [ROLES.SAFARI_DRIVER]: 4,
  [ROLES.TOURIST]: 1
};

export const getRoleLevel = (role) => {
  return ROLE_HIERARCHY[role] || 0;
};

export const canManageRole = (managerRole, targetRole) => {
  const managerLevel = getRoleLevel(managerRole);
  const targetLevel = getRoleLevel(targetRole);
  return managerLevel > targetLevel;
};

export default {
  ROLES,
  ROLE_DISPLAY_NAMES,
  ROLE_DESCRIPTIONS,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessRoute,
  getUserPermissions,
  getRoleDisplayName,
  getRoleDescription,
  isValidRole,
  getAvailableRoles,
  DASHBOARD_ROUTES,
  getDashboardRoute,
  ROLE_HIERARCHY,
  getRoleLevel,
  canManageRole
};