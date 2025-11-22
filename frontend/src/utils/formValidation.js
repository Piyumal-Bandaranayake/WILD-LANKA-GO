/**
 * Form validation utilities for booking forms
 */

/**
 * Validates booking form data
 * @param {Object} formData - Form data to validate
 * @param {Object} activity - Activity object (optional)
 * @param {number} currentBookings - Current bookings count (optional)
 * @returns {Object} Validation result with validations object
 */
export const validateBookingForm = (formData, activity = {}, currentBookings = 0) => {
  const validations = {};

  // Validate tourist name
  validations.touristName = validateTouristName(formData.touristName);

  // Validate tourist email
  validations.touristEmail = validateTouristEmail(formData.touristEmail);

  // Validate tourist phone
  validations.touristPhone = validateTouristPhone(formData.touristPhone);

  // Validate date
  validations.date = validateDate(formData.date);

  // Validate participants
  validations.participants = validateParticipants(formData.participants, activity, currentBookings);

  // Validate tour guide request
  validations.tourGuide = validateTourGuide(formData.requestTourGuide, activity, formData.participants);

  // Validate special requests
  validations.specialRequests = validateSpecialRequests(formData.specialRequests);

  return {
    validations,
    isValid: Object.values(validations).every(v => v.isValid)
  };
};

/**
 * Validates tourist name
 */
const validateTouristName = (name) => {
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      message: 'Name is required',
      severity: 'error'
    };
  }
  
  if (name.trim().length < 2) {
    return {
      isValid: false,
      message: 'Name must be at least 2 characters',
      severity: 'error'
    };
  }
  
  if (name.trim().length > 50) {
    return {
      isValid: false,
      message: 'Name must be less than 50 characters',
      severity: 'error'
    };
  }
  
  return {
    isValid: true,
    message: '',
    severity: 'success'
  };
};

/**
 * Validates tourist email
 */
const validateTouristEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return {
      isValid: false,
      message: 'Email is required',
      severity: 'error'
    };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address',
      severity: 'error'
    };
  }
  
  return {
    isValid: true,
    message: '',
    severity: 'success'
  };
};

/**
 * Validates tourist phone
 */
const validateTouristPhone = (phone) => {
  if (!phone || phone.trim().length === 0) {
    return {
      isValid: false,
      message: 'Phone number is required',
      severity: 'error'
    };
  }
  
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
  if (!phoneRegex.test(phone)) {
    return {
      isValid: false,
      message: 'Please enter a valid phone number',
      severity: 'error'
    };
  }
  
  return {
    isValid: true,
    message: '',
    severity: 'success'
  };
};

/**
 * Validates booking date
 */
const validateDate = (date) => {
  if (!date) {
    return {
      isValid: false,
      message: 'Date is required',
      severity: 'error'
    };
  }
  
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    return {
      isValid: false,
      message: 'Cannot book activities for past dates',
      severity: 'error'
    };
  }
  
  return {
    isValid: true,
    message: '',
    severity: 'success'
  };
};

/**
 * Validates number of participants
 */
const validateParticipants = (participants, activity = {}, currentBookings = 0) => {
  if (!participants || participants < 1) {
    return {
      isValid: false,
      message: 'Number of participants must be at least 1',
      severity: 'error'
    };
  }
  
  const capacity = activity.capacity || activity.maxParticipants || 50;
  const availableSlots = capacity - currentBookings;
  
  if (participants > capacity) {
    return {
      isValid: false,
      message: `Maximum capacity is ${capacity} participants`,
      severity: 'error'
    };
  }
  
  if (participants > availableSlots) {
    return {
      isValid: false,
      message: `Only ${availableSlots} slots available`,
      severity: 'error'
    };
  }
  
  return {
    isValid: true,
    message: '',
    severity: 'success'
  };
};

/**
 * Validates tour guide request
 */
const validateTourGuide = (requestTourGuide, activity = {}, participants = 1) => {
  if (!requestTourGuide) {
    return {
      isValid: true,
      message: '',
      severity: 'success'
    };
  }
  
  if (activity.tourGuideAvailable === false) {
    return {
      isValid: false,
      message: 'Tour guide is not available for this activity',
      severity: 'error'
    };
  }
  
  const minParticipantsForGuide = activity.minParticipantsForGuide || 1;
  if (participants < minParticipantsForGuide) {
    return {
      isValid: false,
      message: `Minimum ${minParticipantsForGuide} participants required for tour guide`,
      severity: 'error'
    };
  }
  
  return {
    isValid: true,
    message: '',
    severity: 'success'
  };
};

/**
 * Validates special requests
 */
const validateSpecialRequests = (specialRequests) => {
  if (!specialRequests || specialRequests.trim().length === 0) {
    return {
      isValid: true,
      message: '',
      severity: 'success'
    };
  }
  
  if (specialRequests.trim().length > 500) {
    return {
      isValid: false,
      message: 'Special requests must be less than 500 characters',
      severity: 'error'
    };
  }
  
  return {
    isValid: true,
    message: '',
    severity: 'success'
  };
};

/**
 * Gets CSS classes for form field validation states
 * @param {Object} validation - Validation result object
 * @param {boolean} touched - Whether the field has been touched
 * @returns {string} CSS classes
 */
export const getValidationClasses = (validation, touched) => {
  if (!touched || !validation) {
    return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
  }
  
  if (validation.severity === 'error') {
    return 'border-red-500 focus:border-red-500 focus:ring-red-500';
  }
  
  if (validation.severity === 'success') {
    return 'border-green-500 focus:border-green-500 focus:ring-green-500';
  }
  
  return 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
};

/**
 * Gets CSS classes for validation messages
 * @param {string} severity - Validation severity level
 * @returns {string} CSS classes
 */
export const getValidationMessageClasses = (severity) => {
  switch (severity) {
    case 'error':
      return 'text-red-600 text-sm mt-1';
    case 'success':
      return 'text-green-600 text-sm mt-1';
    case 'warning':
      return 'text-yellow-600 text-sm mt-1';
    default:
      return 'text-gray-600 text-sm mt-1';
  }
};

/**
 * Validates activity form data
 * @param {Object} formData - Activity form data to validate
 * @returns {Object} Validation result with validations object
 */
export const validateActivityForm = (formData) => {
  const validations = {};

  // Validate activity name
  validations.name = validateActivityName(formData.name);

  // Validate description
  validations.description = validateActivityDescription(formData.description);

  // Validate price
  validations.price = validateActivityPrice(formData.price);

  // Validate duration
  validations.duration = validateActivityDuration(formData.duration);

  // Validate location
  validations.location = validateActivityLocation(formData.location);

  // Validate activity type
  validations.activityType = validateActivityType(formData.activityType);

  // Validate available slots
  validations.availableSlots = validateAvailableSlots(formData.availableSlots);

  return {
    validations,
    isValid: Object.values(validations).every(v => v.isValid),
    hasErrors: Object.values(validations).some(v => v.severity === 'error'),
    hasWarnings: Object.values(validations).some(v => v.severity === 'warning')
  };
};

/**
 * Validates activity name
 */
const validateActivityName = (name) => {
  if (!name || name.trim().length === 0) {
    return {
      isValid: false,
      message: 'Activity name is required',
      severity: 'error'
    };
  }
  
  if (name.trim().length < 3) {
    return {
      isValid: false,
      message: 'Activity name must be at least 3 characters',
      severity: 'error'
    };
  }
  
  if (name.trim().length > 100) {
    return {
      isValid: false,
      message: 'Activity name must be less than 100 characters',
      severity: 'error'
    };
  }
  
  return {
    isValid: true,
    message: '✓ Valid activity name',
    severity: 'success'
  };
};

/**
 * Validates activity description
 */
const validateActivityDescription = (description) => {
  if (!description || description.trim().length === 0) {
    return {
      isValid: false,
      message: 'Description is required',
      severity: 'error'
    };
  }
  
  if (description.trim().length < 20) {
    return {
      isValid: false,
      message: 'Description must be at least 20 characters',
      severity: 'error'
    };
  }
  
  if (description.trim().length > 1000) {
    return {
      isValid: false,
      message: 'Description must be less than 1000 characters',
      severity: 'error'
    };
  }
  
  const wordCount = description.trim().split(/\s+/).filter(word => word.length > 0).length;
  if (wordCount < 10) {
    return {
      isValid: false,
      message: `Description must have at least 10 words (currently ${wordCount} words)`,
      severity: 'error'
    };
  }
  
  return {
    isValid: true,
    message: '✓ Good description',
    severity: 'success'
  };
};

/**
 * Validates activity price
 */
const validateActivityPrice = (price) => {
  if (!price || price.toString().trim().length === 0) {
    return {
      isValid: false,
      message: 'Price is required',
      severity: 'error'
    };
  }
  
  const priceNum = parseFloat(price);
  if (isNaN(priceNum)) {
    return {
      isValid: false,
      message: 'Price must be a valid number',
      severity: 'error'
    };
  }
  
  if (priceNum < 0) {
    return {
      isValid: false,
      message: 'Price cannot be negative',
      severity: 'error'
    };
  }
  
  if (priceNum > 100000) {
    return {
      isValid: false,
      message: 'Price cannot exceed 100,000 LKR',
      severity: 'error'
    };
  }
  
  if (priceNum < 100) {
    return {
      isValid: true,
      message: '⚠ Very low price - consider increasing',
      severity: 'warning'
    };
  }
  
  return {
    isValid: true,
    message: '✓ Valid price',
    severity: 'success'
  };
};

/**
 * Validates activity duration
 */
const validateActivityDuration = (duration) => {
  if (!duration || duration.trim().length === 0) {
    return {
      isValid: false,
      message: 'Duration is required',
      severity: 'error'
    };
  }
  
  // Extract number from duration string (e.g., "3 hours" -> 3)
  const durationMatch = duration.match(/(\d+)/);
  if (!durationMatch) {
    return {
      isValid: false,
      message: 'Duration must contain a number (e.g., "3 hours")',
      severity: 'error'
    };
  }
  
  const durationNum = parseInt(durationMatch[1]);
  if (durationNum < 1) {
    return {
      isValid: false,
      message: 'Duration must be at least 1 hour',
      severity: 'error'
    };
  }
  
  if (durationNum > 24) {
    return {
      isValid: false,
      message: 'Duration cannot exceed 24 hours',
      severity: 'error'
    };
  }
  
  return {
    isValid: true,
    message: '✓ Valid duration',
    severity: 'success'
  };
};

/**
 * Validates activity location
 */
const validateActivityLocation = (location) => {
  if (!location || location.trim().length === 0) {
    return {
      isValid: false,
      message: 'Location is required',
      severity: 'error'
    };
  }
  
  if (location.trim().length < 3) {
    return {
      isValid: false,
      message: 'Location must be at least 3 characters',
      severity: 'error'
    };
  }
  
  if (location.trim().length > 200) {
    return {
      isValid: false,
      message: 'Location must be less than 200 characters',
      severity: 'error'
    };
  }
  
  return {
    isValid: true,
    message: '✓ Valid location',
    severity: 'success'
  };
};

/**
 * Validates activity type
 */
const validateActivityType = (activityType) => {
  if (!activityType || activityType.trim().length === 0) {
    return {
      isValid: false,
      message: 'Activity type is required',
      severity: 'error'
    };
  }
  
  const validTypes = ['safari', 'wildlife-tour', 'bird-watching', 'nature-walk', 'photography', 'adventure', 'educational'];
  if (!validTypes.includes(activityType)) {
    return {
      isValid: false,
      message: 'Please select a valid activity type',
      severity: 'error'
    };
  }
  
  return {
    isValid: true,
    message: '✓ Valid activity type',
    severity: 'success'
  };
};

/**
 * Validates available slots
 */
const validateAvailableSlots = (availableSlots) => {
  if (!availableSlots || availableSlots.toString().trim().length === 0) {
    return {
      isValid: false,
      message: 'Available slots is required',
      severity: 'error'
    };
  }
  
  const slotsNum = parseInt(availableSlots);
  if (isNaN(slotsNum)) {
    return {
      isValid: false,
      message: 'Available slots must be a valid number',
      severity: 'error'
    };
  }
  
  if (slotsNum < 1) {
    return {
      isValid: false,
      message: 'Available slots must be at least 1',
      severity: 'error'
    };
  }
  
  if (slotsNum > 1000) {
    return {
      isValid: false,
      message: 'Available slots cannot exceed 1000',
      severity: 'error'
    };
  }
  
  if (slotsNum < 5) {
    return {
      isValid: true,
      message: '⚠ Very few slots - consider increasing',
      severity: 'warning'
    };
  }
  
  return {
    isValid: true,
    message: '✓ Valid slots',
    severity: 'success'
  };
};

/**
 * Validates vet case form data
 * @param {Object} formData - Vet case form data to validate
 * @returns {Object} Validation result with validations object
 */
export const validateVetCaseForm = (formData) => {
  const validations = {};

  // Validate animal type
  validations.animalType = validateAnimalType(formData.animalType);

  // Validate location
  validations.location = validateCaseLocation(formData.location);

  // Validate description
  validations.description = validateCaseDescription(formData.description);

  // Validate symptoms
  validations.symptoms = validateSymptoms(formData.symptoms);

  // Validate reported by
  validations.reportedBy = validateReportedBy(formData.reportedBy);

  // Validate contact info
  validations.contactInfo = validateContactInfo(formData.contactInfo);

  // Validate estimated age
  validations.estimatedAge = validateEstimatedAge(formData.estimatedAge);

  // Validate weight
  validations.weight = validateWeight(formData.weight);

  return {
    validations,
    isValid: Object.values(validations).every(v => v.isValid),
    hasErrors: Object.values(validations).some(v => v.severity === 'error'),
    hasWarnings: Object.values(validations).some(v => v.severity === 'warning')
  };
};

/**
 * Validates animal type
 */
const validateAnimalType = (animalType) => {
  if (!animalType || animalType.trim().length === 0) {
    return {
      isValid: false,
      message: 'Animal type is required',
      severity: 'error'
    };
  }

  if (animalType.trim().length < 2) {
    return {
      isValid: false,
      message: 'Animal type must be at least 2 characters',
      severity: 'error'
    };
  }

  if (animalType.trim().length > 50) {
    return {
      isValid: false,
      message: 'Animal type must be less than 50 characters',
      severity: 'error'
    };
  }

  // Check for valid animal type format (letters, spaces, hyphens)
  if (!/^[a-zA-Z\s\-]+$/.test(animalType.trim())) {
    return {
      isValid: false,
      message: 'Animal type can only contain letters, spaces, and hyphens',
      severity: 'error'
    };
  }

  return {
    isValid: true,
    message: '✓ Valid animal type',
    severity: 'success'
  };
};

/**
 * Validates case location
 */
const validateCaseLocation = (location) => {
  if (!location || location.trim().length === 0) {
    return {
      isValid: false,
      message: 'Location is required',
      severity: 'error'
    };
  }

  if (location.trim().length < 3) {
    return {
      isValid: false,
      message: 'Location must be at least 3 characters',
      severity: 'error'
    };
  }

  if (location.trim().length > 200) {
    return {
      isValid: false,
      message: 'Location must be less than 200 characters',
      severity: 'error'
    };
  }

  return {
    isValid: true,
    message: '✓ Valid location',
    severity: 'success'
  };
};

/**
 * Validates case description
 */
const validateCaseDescription = (description) => {
  if (!description || description.trim().length === 0) {
    return {
      isValid: false,
      message: 'Description is required',
      severity: 'error'
    };
  }

  if (description.trim().length < 20) {
    return {
      isValid: false,
      message: 'Description must be at least 20 characters',
      severity: 'error'
    };
  }

  if (description.trim().length > 1000) {
    return {
      isValid: false,
      message: 'Description must be less than 1000 characters',
      severity: 'error'
    };
  }

  const wordCount = description.trim().split(/\s+/).filter(word => word.length > 0).length;
  if (wordCount < 5) {
    return {
      isValid: false,
      message: `Description must have at least 5 words (currently ${wordCount} words)`,
      severity: 'error'
    };
  }

  return {
    isValid: true,
    message: '✓ Valid description',
    severity: 'success'
  };
};

/**
 * Validates symptoms
 */
const validateSymptoms = (symptoms) => {
  // Symptoms are optional, but if provided, validate them
  if (!symptoms || symptoms.trim().length === 0) {
    return {
      isValid: true,
      message: 'Symptoms are optional',
      severity: 'info'
    };
  }

  if (symptoms.trim().length < 5) {
    return {
      isValid: false,
      message: 'Symptoms must be at least 5 characters if provided',
      severity: 'error'
    };
  }

  if (symptoms.trim().length > 500) {
    return {
      isValid: false,
      message: 'Symptoms must be less than 500 characters',
      severity: 'error'
    };
  }

  return {
    isValid: true,
    message: '✓ Valid symptoms',
    severity: 'success'
  };
};

/**
 * Validates reported by field
 */
const validateReportedBy = (reportedBy) => {
  if (!reportedBy || reportedBy.trim().length === 0) {
    return {
      isValid: false,
      message: 'Reporter name is required',
      severity: 'error'
    };
  }

  if (reportedBy.trim().length < 2) {
    return {
      isValid: false,
      message: 'Reporter name must be at least 2 characters',
      severity: 'error'
    };
  }

  if (reportedBy.trim().length > 100) {
    return {
      isValid: false,
      message: 'Reporter name must be less than 100 characters',
      severity: 'error'
    };
  }

  // Check for valid name format (letters, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z\s\-']+$/.test(reportedBy.trim())) {
    return {
      isValid: false,
      message: 'Reporter name can only contain letters, spaces, hyphens, and apostrophes',
      severity: 'error'
    };
  }

  return {
    isValid: true,
    message: '✓ Valid reporter name',
    severity: 'success'
  };
};

/**
 * Validates contact information
 */
const validateContactInfo = (contactInfo) => {
  if (!contactInfo || contactInfo.trim().length === 0) {
    return {
      isValid: false,
      message: 'Contact information is required',
      severity: 'error'
    };
  }

  const trimmedContact = contactInfo.trim();

  // Check if it's an email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(trimmedContact)) {
    return {
      isValid: true,
      message: '✓ Valid email address',
      severity: 'success'
    };
  }

  // Check if it's a phone number
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
  if (phoneRegex.test(trimmedContact)) {
    return {
      isValid: true,
      message: '✓ Valid phone number',
      severity: 'success'
    };
  }

  // If neither email nor phone, show error
  return {
    isValid: false,
    message: 'Please enter a valid email address or phone number',
    severity: 'error'
  };
};

/**
 * Validates estimated age
 */
const validateEstimatedAge = (estimatedAge) => {
  // Estimated age is optional
  if (!estimatedAge || estimatedAge.trim().length === 0) {
    return {
      isValid: true,
      message: 'Estimated age is optional',
      severity: 'info'
    };
  }

  const trimmedAge = estimatedAge.trim();

  // Check for common age formats
  if (/^(Adult|Juvenile|Pup|Cub|Young|Old|Senior|Newborn|Infant)$/i.test(trimmedAge)) {
    return {
      isValid: true,
      message: '✓ Valid age category',
      severity: 'success'
    };
  }

  // Check for numeric age with units
  if (/^\d+\s*(years?|months?|days?|weeks?)$/i.test(trimmedAge)) {
    return {
      isValid: true,
      message: '✓ Valid age with units',
      severity: 'success'
    };
  }

  // Check for just numbers (assume years)
  if (/^\d+$/.test(trimmedAge)) {
    const ageNum = parseInt(trimmedAge);
    if (ageNum > 100) {
      return {
        isValid: true,
        message: '⚠ Very old age - please verify',
        severity: 'warning'
      };
    }
    return {
      isValid: true,
      message: '✓ Valid age (assuming years)',
      severity: 'success'
    };
  }

  return {
    isValid: false,
    message: 'Please enter a valid age (e.g., "Adult", "2 years", "6 months")',
    severity: 'error'
  };
};

/**
 * Validates weight
 */
const validateWeight = (weight) => {
  // Weight is optional
  if (!weight || weight.trim().length === 0) {
    return {
      isValid: true,
      message: 'Weight is optional',
      severity: 'info'
    };
  }

  const trimmedWeight = weight.trim();

  // Check for numeric weight with units
  if (/^\d+(\.\d+)?\s*(kg|kgs|kilograms?|pounds?|lbs?)$/i.test(trimmedWeight)) {
    const weightMatch = trimmedWeight.match(/^(\d+(?:\.\d+)?)/);
    const weightNum = parseFloat(weightMatch[1]);
    
    // Check for reasonable weight ranges
    if (weightNum > 10000) {
      return {
        isValid: true,
        message: '⚠ Very heavy weight - please verify',
        severity: 'warning'
      };
    }
    
    return {
      isValid: true,
      message: '✓ Valid weight',
      severity: 'success'
    };
  }

  // Check for just numbers (assume kg)
  if (/^\d+(\.\d+)?$/.test(trimmedWeight)) {
    const weightNum = parseFloat(trimmedWeight);
    if (weightNum > 10000) {
      return {
        isValid: true,
        message: '⚠ Very heavy weight - please verify',
        severity: 'warning'
      };
    }
    return {
      isValid: true,
      message: '✓ Valid weight (assuming kg)',
      severity: 'success'
    };
  }

  return {
    isValid: false,
    message: 'Please enter a valid weight (e.g., "50 kg", "120 pounds")',
    severity: 'error'
  };
};

/**
 * Validates event form data
 * @param {Object} formData - Event form data to validate
 * @returns {Object} Validation result with validations object
 */
export const validateEventForm = (formData) => {
  const validations = {};

  // Validate event title
  validations.title = validateEventTitle(formData.title);

  // Validate description
  validations.description = validateEventDescription(formData.description);

  // Validate date
  validations.date = validateEventDate(formData.date);

  // Validate time
  validations.time = validateEventTime(formData.time);

  // Validate location
  validations.location = validateEventLocation(formData.location);

  // Validate max slots
  validations.maxSlots = validateEventMaxSlots(formData.maxSlots);

  return {
    validations,
    isValid: Object.values(validations).every(v => v.isValid),
    hasErrors: Object.values(validations).some(v => v.severity === 'error'),
    hasWarnings: Object.values(validations).some(v => v.severity === 'warning')
  };
};

/**
 * Validates event title
 */
const validateEventTitle = (title) => {
  if (!title || title.trim().length === 0) {
    return {
      isValid: false,
      message: 'Event title is required',
      severity: 'error'
    };
  }
  
  if (title.trim().length < 3) {
    return {
      isValid: false,
      message: 'Event title must be at least 3 characters',
      severity: 'error'
    };
  }
  
  if (title.trim().length > 100) {
    return {
      isValid: false,
      message: 'Event title must be less than 100 characters',
      severity: 'error'
    };
  }
  
  return {
    isValid: true,
    message: '✓ Valid event title',
    severity: 'success'
  };
};

/**
 * Validates event description
 */
const validateEventDescription = (description) => {
  if (!description || description.trim().length === 0) {
    return {
      isValid: false,
      message: 'Description is required',
      severity: 'error'
    };
  }
  
  if (description.trim().length < 20) {
    return {
      isValid: false,
      message: 'Description must be at least 20 characters',
      severity: 'error'
    };
  }
  
  if (description.trim().length > 1000) {
    return {
      isValid: false,
      message: 'Description must be less than 1000 characters',
      severity: 'error'
    };
  }
  
  const wordCount = description.trim().split(/\s+/).filter(word => word.length > 0).length;
  if (wordCount < 10) {
    return {
      isValid: false,
      message: `Description must have at least 10 words (currently ${wordCount} words)`,
      severity: 'error'
    };
  }
  
  return {
    isValid: true,
    message: '✓ Good description',
    severity: 'success'
  };
};

/**
 * Validates event date
 */
const validateEventDate = (date) => {
  if (!date || date.trim().length === 0) {
    return {
      isValid: false,
      message: 'Event date is required',
      severity: 'error'
    };
  }
  
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (selectedDate < today) {
    return {
      isValid: false,
      message: 'Event date cannot be in the past',
      severity: 'error'
    };
  }
  
  // Check if date is too far in the future (more than 1 year)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
  
  if (selectedDate > oneYearFromNow) {
    return {
      isValid: true,
      message: '⚠ Event is scheduled very far in the future',
      severity: 'warning'
    };
  }
  
  return {
    isValid: true,
    message: '✓ Valid event date',
    severity: 'success'
  };
};

/**
 * Validates event time
 */
const validateEventTime = (time) => {
  if (!time || time.trim().length === 0) {
    return {
      isValid: false,
      message: 'Event time is required',
      severity: 'error'
    };
  }
  
  // Basic time format validation (HH:MM)
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(time)) {
    return {
      isValid: false,
      message: 'Please enter a valid time format (HH:MM)',
      severity: 'error'
    };
  }
  
  // Check for reasonable event times (between 6 AM and 11 PM)
  const [hours] = time.split(':').map(Number);
  if (hours < 6) {
    return {
      isValid: true,
      message: '⚠ Very early event time - consider if this is correct',
      severity: 'warning'
    };
  }
  
  if (hours > 23) {
    return {
      isValid: true,
      message: '⚠ Very late event time - consider if this is correct',
      severity: 'warning'
    };
  }
  
  return {
    isValid: true,
    message: '✓ Valid event time',
    severity: 'success'
  };
};

/**
 * Validates event location
 */
const validateEventLocation = (location) => {
  if (!location || location.trim().length === 0) {
    return {
      isValid: false,
      message: 'Location is required',
      severity: 'error'
    };
  }
  
  if (location.trim().length < 3) {
    return {
      isValid: false,
      message: 'Location must be at least 3 characters',
      severity: 'error'
    };
  }
  
  if (location.trim().length > 200) {
    return {
      isValid: false,
      message: 'Location must be less than 200 characters',
      severity: 'error'
    };
  }
  
  return {
    isValid: true,
    message: '✓ Valid location',
    severity: 'success'
  };
};

/**
 * Validates event max slots
 */
const validateEventMaxSlots = (maxSlots) => {
  if (!maxSlots || maxSlots.toString().trim().length === 0) {
    return {
      isValid: false,
      message: 'Maximum slots is required',
      severity: 'error'
    };
  }
  
  const slotsNum = parseInt(maxSlots);
  if (isNaN(slotsNum)) {
    return {
      isValid: false,
      message: 'Maximum slots must be a valid number',
      severity: 'error'
    };
  }
  
  if (slotsNum < 1) {
    return {
      isValid: false,
      message: 'Maximum slots must be at least 1',
      severity: 'error'
    };
  }
  
  if (slotsNum > 1000) {
    return {
      isValid: false,
      message: 'Maximum slots cannot exceed 1000',
      severity: 'error'
    };
  }
  
  if (slotsNum < 5) {
    return {
      isValid: true,
      message: '⚠ Very few slots - consider increasing',
      severity: 'warning'
    };
  }
  
  if (slotsNum > 500) {
    return {
      isValid: true,
      message: '⚠ Very large event - ensure venue can accommodate',
      severity: 'warning'
    };
  }
  
  return {
    isValid: true,
    message: '✓ Valid slots',
    severity: 'success'
  };
};