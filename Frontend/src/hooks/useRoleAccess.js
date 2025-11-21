import { useAuth } from '../contexts/AuthContext';

/**
 * Hook for role-based access control and feature visibility
 */
export const useRoleAccess = () => {
  const { user, backendUser } = useAuth();

  // Use user if backendUser is not available
  const currentUser = backendUser || user;
  const userRole = currentUser?.role;

  // Helper function to normalize role names for comparison
  const normalizeRole = (role) => {
    if (!role) return '';
    return role.toLowerCase();
  };

  /**
   * Check if user has a specific role (case-insensitive)
   */
  const hasRole = (role) => {
    return normalizeRole(userRole) === normalizeRole(role);
  };

  /**
   * Check if user has any of the specified roles (case-insensitive)
   */
  const hasAnyRole = (roles) => {
    return roles.some(role => normalizeRole(userRole) === normalizeRole(role));
  };

  /**
   * Check if user can access admin features
   */
  const canAccessAdmin = () => {
    return hasRole('admin');
  };

  /**
   * Check if user can manage users
   */
  const canManageUsers = () => {
    return hasRole('admin');
  };

  /**
   * Check if user can handle emergencies
   */
  const canHandleEmergencies = () => {
    return hasAnyRole(['emergencyOfficer', 'callOperator']);
  };

  /**
   * Check if user can manage animal cases
   */
  const canManageAnimalCases = () => {
    return hasAnyRole(['vet', 'wildlifeOfficer']);
  };

  /**
   * Check if user can manage tours
   */
  const canManageTours = () => {
    return hasAnyRole(['admin', 'tourGuide', 'safariDriver']);
  };

  /**
   * Check if user can view reports
   */
  const canViewReports = () => {
    return hasAnyRole(['admin', 'emergencyOfficer', 'callOperator', 'vet', 'wildlifeOfficer']);
  };

  /**
   * Check if user can make bookings
   */
  const canMakeBookings = () => {
    return hasRole('tourist');
  };

  /**
   * Get role-specific navigation items
   */
  const getRoleNavigation = () => {
    const baseNavigation = [
      { key: 'profile', label: 'Profile', path: '/profile' }
    ];

    switch (userRole) {
      case 'admin':
        return [
          { key: 'dashboard', label: 'Admin Dashboard', path: '/dashboard' },
          { key: 'users', label: 'User Management', path: '/users' },
          { key: 'applications', label: 'Applications', path: '/applications' },
          { key: 'activities', label: 'Activities', path: '/activities' },
          { key: 'events', label: 'Events', path: '/events' },
          { key: 'donations', label: 'Donations', path: '/donations' },
          ...baseNavigation
        ];
      
      case 'vet':
        return [
          { key: 'dashboard', label: 'Vet Dashboard', path: '/dashboard' },
          { key: 'animal-cases', label: 'Animal Cases', path: '/animal-cases' },
          { key: 'treatments', label: 'Treatments', path: '/treatments' },
          { key: 'medications', label: 'Medications', path: '/medications' },
          ...baseNavigation
        ];
      
      case 'tourist':
        return [
          { key: 'dashboard', label: 'Tourist Portal', path: '/dashboard' },
          { key: 'activities', label: 'Activities', path: '/activities' },
          { key: 'events', label: 'Events', path: '/events' },
          { key: 'bookings', label: 'My Bookings', path: '/bookings' },
          { key: 'donations', label: 'Donations', path: '/donations' },
          { key: 'feedback', label: 'Feedback', path: '/feedback' },
          { key: 'complaints', label: 'Complaints', path: '/complaints' },
          ...baseNavigation
        ];
      
      case 'emergencyOfficer':
        return [
          { key: 'dashboard', label: 'Emergency Dashboard', path: '/dashboard' },
          { key: 'emergencies', label: 'Emergencies', path: '/emergencies' },
          { key: 'reports', label: 'Reports', path: '/reports' },
          ...baseNavigation
        ];
      
      case 'callOperator':
        return [
          { key: 'dashboard', label: 'Call Center', path: '/dashboard' },
          { key: 'emergencies', label: 'Emergency Calls', path: '/emergencies' },
          { key: 'complaints', label: 'Complaints', path: '/complaints' },
          ...baseNavigation
        ];
      
      case 'safariDriver':
        return [
          { key: 'dashboard', label: 'Driver Dashboard', path: '/dashboard' },
          { key: 'tours', label: 'Tour Assignments', path: '/tours' },
          { key: 'vehicle', label: 'Vehicle Management', path: '/vehicle' },
          { key: 'fuel-claims', label: 'Fuel Claims', path: '/fuel-claims' },
          ...baseNavigation
        ];
      
      case 'tourGuide':
        return [
          { key: 'dashboard', label: 'Guide Dashboard', path: '/dashboard' },
          { key: 'tours', label: 'Tour Assignments', path: '/tours' },
          { key: 'clients', label: 'Client Management', path: '/clients' },
          { key: 'availability', label: 'Availability', path: '/availability' },
          ...baseNavigation
        ];
      
      case 'wildlifeOfficer':
        return [
          { key: 'dashboard', label: 'Wildlife Dashboard', path: '/dashboard' },
          { key: 'conservation', label: 'Conservation Activities', path: '/conservation' },
          { key: 'monitoring', label: 'Wildlife Monitoring', path: '/monitoring' },
          { key: 'reports', label: 'Field Reports', path: '/reports' },
          ...baseNavigation
        ];
      
      default:
        return baseNavigation;
    }
  };

  /**
   * Get role-specific dashboard features
   */
  const getDashboardFeatures = () => {
    switch (userRole) {
      case 'admin':
        return [
          'user-management',
          'application-approval',
          'activity-management',
          'event-management',
          'donation-management',
          'system-analytics'
        ];
      
      case 'vet':
        return [
          'animal-case-management',
          'treatment-tracking',
          'medication-inventory',
          'medical-reports'
        ];
      
      case 'tourist':
        return [
          'activity-booking',
          'event-registration',
          'donation-portal',
          'feedback-system',
          'complaint-system',
          'emergency-reporting'
        ];
      
      case 'emergencyOfficer':
        return [
          'emergency-management',
          'response-coordination',
          'hospital-coordination',
          'incident-reporting'
        ];
      
      case 'callOperator':
        return [
          'emergency-call-handling',
          'case-assignment',
          'complaint-management',
          'communication-center'
        ];
      
      case 'safariDriver':
        return [
          'tour-assignments',
          'vehicle-management',
          'route-tracking',
          'fuel-management'
        ];
      
      case 'tourGuide':
        return [
          'tour-assignments',
          'client-management',
          'availability-management',
          'tour-planning'
        ];
      
      case 'wildlifeOfficer':
        return [
          'wildlife-monitoring',
          'conservation-activities',
          'field-reporting',
          'environmental-tracking'
        ];
      
      default:
        return [];
    }
  };

  return {
    userRole,
    hasRole,
    hasAnyRole,
    canAccessAdmin,
    canManageUsers,
    canHandleEmergencies,
    canManageAnimalCases,
    canManageTours,
    canViewReports,
    canMakeBookings,
    getRoleNavigation,
    getDashboardFeatures
  };
};

export default useRoleAccess;