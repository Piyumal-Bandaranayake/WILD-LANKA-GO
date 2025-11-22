/**
 * Standardized dashboard configuration
 * Defines consistent navigation, colors, and layouts for all role-based dashboards
 */

// Common dashboard colors by role
export const DASHBOARD_COLORS = {
  admin: {
    primary: 'bg-indigo-600',
    secondary: 'bg-indigo-50',
    accent: 'text-indigo-700',
    icon: 'H'
  },
  vet: {
    primary: 'bg-green-600',
    secondary: 'bg-green-50', 
    accent: 'text-green-700',
    icon: 'V'
  },
  tourist: {
    primary: 'bg-blue-600',
    secondary: 'bg-blue-50',
    accent: 'text-blue-700', 
    icon: 'T'
  },
  callOperator: {
    primary: 'bg-red-600',
    secondary: 'bg-red-50',
    accent: 'text-red-700',
    icon: 'C'
  },
  emergencyOfficer: {
    primary: 'bg-blue-600',
    secondary: 'bg-blue-50',
    accent: 'text-blue-700',
    icon: 'E'
  },
  safariDriver: {
    primary: 'bg-orange-600',
    secondary: 'bg-orange-50',
    accent: 'text-orange-700',
    icon: 'D'
  },
  tourGuide: {
    primary: 'bg-purple-600',
    secondary: 'bg-purple-50',
    accent: 'text-purple-700',
    icon: 'G'
  },
  wildlifeOfficer: {
    primary: 'bg-green-600',
    secondary: 'bg-green-50',
    accent: 'text-green-700',
    icon: 'W'
  }
};

// Common dashboard icons
export const DASHBOARD_ICONS = {
  overview: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-1a6 6 0 00-9-5.197M9 20H4v-1a6 6 0 019-5.197M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  activities: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  events: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  donations: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636 10.682 6.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  emergency: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  ),
  reports: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  feedback: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  complaints: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  cases: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  inventory: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  bookings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2" />
    </svg>
  ),
  assignments: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  materials: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  profile: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
};

// Role-specific navigation configurations
export const DASHBOARD_NAVIGATION = {
  admin: [
    { key: 'overview', label: 'Dashboard', icon: DASHBOARD_ICONS.overview },
    { key: 'users', label: 'Users', icon: DASHBOARD_ICONS.users },
    { key: 'applications', label: 'Applications', icon: DASHBOARD_ICONS.assignments },
    { key: 'activities', label: 'Activities', icon: DASHBOARD_ICONS.activities },
    { key: 'events', label: 'Events', icon: DASHBOARD_ICONS.events }
  ],
  
  vet: [
    { key: 'cases', label: 'Animal Cases', icon: DASHBOARD_ICONS.cases },
    { key: 'inventory', label: 'Medication Inventory', icon: DASHBOARD_ICONS.inventory }
  ],
  
  tourist: [
    { key: 'overview', label: 'Overview', icon: DASHBOARD_ICONS.overview },
    { key: 'activities', label: 'Activities', icon: DASHBOARD_ICONS.activities },
    { key: 'events', label: 'Events', icon: DASHBOARD_ICONS.events },
    { key: 'donations', label: 'Donations', icon: DASHBOARD_ICONS.donations },
    { key: 'feedback', label: 'Feedback', icon: DASHBOARD_ICONS.feedback },
    { key: 'complaints', label: 'Complaints', icon: DASHBOARD_ICONS.complaints },
    { key: 'emergency', label: 'Emergency', icon: DASHBOARD_ICONS.emergency },
    { key: 'myBookings', label: 'My Bookings', icon: DASHBOARD_ICONS.bookings }
  ],
  
  callOperator: [
    { key: 'dashboard', label: 'Emergency Operations', icon: DASHBOARD_ICONS.emergency },
    { key: 'emergency-management', label: 'Emergency Management', icon: DASHBOARD_ICONS.assignments },
    { key: 'complaints', label: 'Complaints & Forms', icon: DASHBOARD_ICONS.complaints },
    { key: 'reports', label: 'Reports & Analytics', icon: DASHBOARD_ICONS.reports }
  ],
  
  emergencyOfficer: [
    { key: 'active', label: 'Active Emergencies', icon: DASHBOARD_ICONS.emergency },
    { key: 'pending', label: 'Pending', icon: DASHBOARD_ICONS.assignments },
    { key: 'resolved', label: 'Resolved', icon: DASHBOARD_ICONS.reports },
    { key: 'reports', label: 'Reports', icon: DASHBOARD_ICONS.reports }
  ],
  
  safariDriver: [
    { key: 'overview', label: 'Overview', icon: DASHBOARD_ICONS.overview },
    { key: 'assignments', label: 'Tour Assignments', icon: DASHBOARD_ICONS.assignments },
    { key: 'odometer', label: 'Odometer Tracking', icon: DASHBOARD_ICONS.reports },
    { key: 'fuelClaims', label: 'Fuel Claims', icon: DASHBOARD_ICONS.reports },
    { key: 'history', label: 'Tour History', icon: DASHBOARD_ICONS.reports },
    { key: 'profile', label: 'Profile', icon: DASHBOARD_ICONS.profile }
  ],
  
  tourGuide: [
    { key: 'overview', label: 'Overview', icon: DASHBOARD_ICONS.overview },
    { key: 'assignments', label: 'Tour Assignments', icon: DASHBOARD_ICONS.assignments },
    { key: 'progress', label: 'Tour Progress', icon: DASHBOARD_ICONS.activities },
    { key: 'materials', label: 'Tour Materials', icon: DASHBOARD_ICONS.materials },
    { key: 'reports', label: 'Reports', icon: DASHBOARD_ICONS.reports },
    { key: 'profile', label: 'Profile', icon: DASHBOARD_ICONS.profile }
  ],
  
  wildlifeOfficer: [
    { key: 'overview', label: 'Overview', icon: DASHBOARD_ICONS.overview },
    { key: 'bookings', label: 'Bookings Management', icon: DASHBOARD_ICONS.bookings },
    { key: 'complaints', label: 'Complaints', icon: DASHBOARD_ICONS.complaints },
    { key: 'applications', label: 'Job Applications', icon: DASHBOARD_ICONS.users },
    { key: 'fuelClaims', label: 'Fuel Claims', icon: DASHBOARD_ICONS.reports },
    { key: 'reports', label: 'Overview', icon: DASHBOARD_ICONS.reports }
  ]
};

// Common dashboard titles
export const DASHBOARD_TITLES = {
  admin: 'Admin Portal',
  vet: 'Veterinary Dashboard', 
  tourist: 'Tourist Portal',
  callOperator: 'Emergency Operations',
  emergencyOfficer: 'Emergency Response',
  safariDriver: 'Driver Portal',
  tourGuide: 'Guide Portal',
  wildlifeOfficer: 'Wildlife Management'
};

// Responsive breakpoints
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px', 
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};
