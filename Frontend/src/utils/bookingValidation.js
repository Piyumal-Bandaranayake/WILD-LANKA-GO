/**
 * Booking validation utilities for capacity and permission checks
 */

/**
 * Validates booking capacity based on activity data and current bookings
 * @param {Object} activity - Activity object with capacity information
 * @param {number} requestedParticipants - Number of participants requested
 * @param {number} currentBookings - Current number of booked participants
 * @returns {Object} Validation result with success, message, and available slots
 */
export const validateBookingCapacity = (activity, requestedParticipants, currentBookings = 0) => {
  const capacity = activity.capacity || activity.maxParticipants || 50;
  const availableSlots = capacity - currentBookings;
  
  if (requestedParticipants <= 0) {
    return {
      success: false,
      message: 'Number of participants must be at least 1',
      availableSlots,
      capacity
    };
  }
  
  if (requestedParticipants > capacity) {
    return {
      success: false,
      message: `Maximum capacity is ${capacity} participants`,
      availableSlots,
      capacity
    };
  }
  
  if (requestedParticipants > availableSlots) {
    return {
      success: false,
      message: `Only ${availableSlots} slots available. Please reduce participants or choose another date.`,
      availableSlots,
      capacity
    };
  }
  
  return {
    success: true,
    message: `${availableSlots - requestedParticipants} slots remaining after your booking`,
    availableSlots,
    capacity
  };
};

/**
 * Validates booking permissions based on user role and activity restrictions
 * @param {Object} user - User object with role information
 * @param {Object} activity - Activity object with permission requirements
 * @returns {Object} Validation result with success and message
 */
export const validateBookingPermissions = (user, activity) => {
  // Check if user is authenticated
  if (!user) {
    return {
      success: false,
      message: 'You must be logged in to make a booking',
      requiresAuth: true
    };
  }
  
  // Check if activity is active
  if (activity.status && activity.status !== 'Active') {
    return {
      success: false,
      message: 'This activity is not currently available for booking',
      activityInactive: true
    };
  }
  
  // Check if activity has specific role requirements
  if (activity.requiredRole && user.role !== activity.requiredRole) {
    return {
      success: false,
      message: `This activity requires ${activity.requiredRole} role`,
      roleRestricted: true
    };
  }
  
  // Check if user has reached booking limits
  if (activity.maxBookingsPerUser && user.bookingCount >= activity.maxBookingsPerUser) {
    return {
      success: false,
      message: `You have reached the maximum booking limit of ${activity.maxBookingsPerUser} for this activity`,
      limitReached: true
    };
  }
  
  return {
    success: true,
    message: 'Booking permissions validated'
  };
};

/**
 * Validates booking date restrictions
 * @param {string} bookingDate - Selected booking date
 * @param {Object} activity - Activity object with date restrictions
 * @returns {Object} Validation result with success and message
 */
export const validateBookingDate = (bookingDate, activity) => {
  const selectedDate = new Date(bookingDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Check if date is in the past
  if (selectedDate < today) {
    return {
      success: false,
      message: 'Cannot book activities for past dates',
      pastDate: true
    };
  }
  
  // Check minimum advance booking requirement
  const minAdvanceDays = activity.minAdvanceBookingDays || 1;
  const minDate = new Date(today);
  minDate.setDate(today.getDate() + minAdvanceDays);
  
  if (selectedDate < minDate) {
    return {
      success: false,
      message: `Booking must be made at least ${minAdvanceDays} day(s) in advance`,
      tooEarly: true
    };
  }
  
  // Check maximum advance booking limit
  const maxAdvanceDays = activity.maxAdvanceBookingDays || 365;
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + maxAdvanceDays);
  
  if (selectedDate > maxDate) {
    return {
      success: false,
      message: `Booking cannot be made more than ${maxAdvanceDays} days in advance`,
      tooLate: true
    };
  }
  
  // Check if activity is available on selected day of week
  if (activity.availableDays && activity.availableDays.length > 0) {
    const dayOfWeek = selectedDate.getDay();
    if (!activity.availableDays.includes(dayOfWeek)) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return {
        success: false,
        message: `This activity is not available on ${dayNames[dayOfWeek]}s`,
        dayRestricted: true
      };
    }
  }
  
  return {
    success: true,
    message: 'Booking date is valid'
  };
};

/**
 * Validates tour guide availability
 * @param {boolean} requestTourGuide - Whether tour guide is requested
 * @param {Object} activity - Activity object with tour guide info
 * @param {number} participants - Number of participants
 * @returns {Object} Validation result with success and message
 */
export const validateTourGuideRequest = (requestTourGuide, activity, participants) => {
  if (!requestTourGuide) {
    return {
      success: true,
      message: 'No tour guide requested'
    };
  }
  
  // Check if tour guide is available for this activity
  if (activity.tourGuideAvailable === false) {
    return {
      success: false,
      message: 'Tour guide is not available for this activity',
      tourGuideUnavailable: true
    };
  }
  
  // Check minimum participants for tour guide
  const minParticipantsForGuide = activity.minParticipantsForGuide || 1;
  if (participants < minParticipantsForGuide) {
    return {
      success: false,
      message: `Minimum ${minParticipantsForGuide} participants required for tour guide`,
      insufficientParticipants: true
    };
  }
  
  return {
    success: true,
    message: 'Tour guide request is valid'
  };
};

/**
 * Comprehensive booking validation
 * @param {Object} bookingData - Complete booking data
 * @param {Object} activity - Activity object
 * @param {Object} user - User object
 * @param {number} currentBookings - Current bookings count
 * @returns {Object} Complete validation result
 */
export const validateCompleteBooking = (bookingData, activity, user, currentBookings = 0) => {
  const validations = {
    capacity: validateBookingCapacity(activity, bookingData.participants, currentBookings),
    permissions: validateBookingPermissions(user, activity),
    date: validateBookingDate(bookingData.date, activity),
    tourGuide: validateTourGuideRequest(bookingData.requestTourGuide, activity, bookingData.participants)
  };
  
  const allValid = Object.values(validations).every(v => v.success);
  
  return {
    success: allValid,
    validations,
    errors: Object.values(validations).filter(v => !v.success),
    warnings: Object.values(validations).filter(v => v.success && v.message !== 'Booking permissions validated' && v.message !== 'No tour guide requested' && v.message !== 'Booking date is valid')
  };
};

/**
 * Formats validation errors for display
 * @param {Array} errors - Array of validation error objects
 * @returns {string} Formatted error message
 */
export const formatValidationErrors = (errors) => {
  if (!errors || errors.length === 0) return '';
  
  return errors.map(error => error.message).join('. ');
};

/**
 * Gets capacity status for display
 * @param {number} availableSlots - Available slots
 * @param {number} capacity - Total capacity
 * @returns {Object} Status information
 */
export const getCapacityStatus = (availableSlots, capacity) => {
  const percentage = (availableSlots / capacity) * 100;
  
  if (percentage <= 10) {
    return {
      status: 'critical',
      color: 'red',
      message: 'Very few slots remaining!'
    };
  } else if (percentage <= 25) {
    return {
      status: 'warning',
      color: 'yellow',
      message: 'Limited slots available'
    };
  } else if (percentage <= 50) {
    return {
      status: 'moderate',
      color: 'blue',
      message: 'Good availability'
    };
  } else {
    return {
      status: 'good',
      color: 'green',
      message: 'Plenty of slots available'
    };
  }
};
