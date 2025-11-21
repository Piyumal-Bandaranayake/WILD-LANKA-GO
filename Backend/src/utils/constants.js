/**
 * Application constants
 */

// User roles
const USER_ROLES = {
  ADMIN: 'admin',
  WILDLIFE_OFFICER: 'wildlifeOfficer',
  VET: 'vet',
  TOUR_GUIDE: 'tourGuide',
  SAFARI_DRIVER: 'safariDriver',
  TOURIST: 'tourist',
  CALL_OPERATOR: 'callOperator',
  EMERGENCY_OFFICER: 'emergencyOfficer',
};

// User status
const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended',
};

// Booking status
const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Animal status
const ANIMAL_STATUS = {
  RESCUED: 'rescued',
  UNDER_TREATMENT: 'under_treatment',
  RECOVERED: 'recovered',
  RELEASED: 'released',
  DECEASED: 'deceased',
};

// Report types
const REPORT_TYPES = {
  RESCUE: 'rescue',
  SIGHTING: 'sighting',
  INJURY: 'injury',
  EMERGENCY: 'emergency',
  POACHING: 'poaching',
  HABITAT_DAMAGE: 'habitat_damage',
};

// Report status
const REPORT_STATUS = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  INVESTIGATING: 'investigating',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

// Vehicle types
const VEHICLE_TYPES = {
  JEEP: 'jeep',
  VAN: 'van',
  TRUCK: 'truck',
  AMBULANCE: 'ambulance',
  MOTORCYCLE: 'motorcycle',
};

// Vehicle status
const VEHICLE_STATUS = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  MAINTENANCE: 'maintenance',
  OUT_OF_SERVICE: 'out_of_service',
};

// Booking types
const BOOKING_TYPES = {
  SAFARI: 'safari',
  WILDLIFE_TOUR: 'wildlife_tour',
  CONSERVATION_PROGRAM: 'conservation_program',
  EDUCATIONAL_VISIT: 'educational_visit',
  ACTIVITY: 'activity',
};

// Priority levels
const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

// Email templates
const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  BOOKING_CONFIRMATION: 'booking_confirmation',
  BOOKING_CANCELLATION: 'booking_cancellation',
  PASSWORD_RESET: 'password_reset',
  ACCOUNT_ACTIVATION: 'account_activation',
};

// File upload limits
const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 10,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// Pagination defaults
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Cache durations (in seconds)
const CACHE_DURATION = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
};

// API rate limiting
const RATE_LIMITS = {
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // requests per window
  },
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // login attempts per window
  },
  UPLOAD: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // uploads per minute
  },
};

module.exports = {
  USER_ROLES,
  USER_STATUS,
  BOOKING_STATUS,
  ANIMAL_STATUS,
  REPORT_TYPES,
  REPORT_STATUS,
  VEHICLE_TYPES,
  VEHICLE_STATUS,
  BOOKING_TYPES,
  PRIORITY_LEVELS,
  EMAIL_TEMPLATES,
  UPLOAD_LIMITS,
  PAGINATION,
  CACHE_DURATION,
  RATE_LIMITS,
};
