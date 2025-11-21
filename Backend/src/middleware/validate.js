const Joi = require('joi');
const { sendValidationError } = require('../utils/response');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @param {String} property - Request property to validate (body, params, query)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      
      return sendValidationError(res, errors, 'Validation failed');
    }

    next();
  };
};

// Common validation schemas
const schemas = {
  // User validation schemas
  userRegistration: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/).required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid(
      'admin', 'wildlifeOfficer', 'vet', 'tourGuide', 
      'safariDriver', 'tourist', 'callOperator', 'emergencyOfficer'
    ).required(),
  }),

  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  userUpdate: Joi.object({
    firstName: Joi.string().min(2).max(50),
    lastName: Joi.string().min(2).max(50),
    phone: Joi.string().pattern(/^[0-9+\-\s()]+$/),
    dateOfBirth: Joi.date(),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      zipCode: Joi.string(),
      country: Joi.string(),
    }),
  }),

  // Activity validation schemas
  activityCreation: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    description: Joi.string().min(1).max(1000).required(),
    price: Joi.number().min(0).required(),
    duration: Joi.number().min(1).required(),
    location: Joi.string().min(1).required(),
    imageUrl: Joi.string().uri().allow(null, ''),
    maxParticipants: Joi.number().min(1).required(),
    dailySlots: Joi.number().min(1).required(),
    category: Joi.string().valid(
      'safari', 'wildlife-tour', 'bird-watching', 'nature-walk', 
      'photography', 'adventure', 'educational'
    ).required(),
    difficulty: Joi.string().valid('easy', 'moderate', 'hard'),
    requirements: Joi.string().allow('', null), // Allow string for single requirement
    includes: Joi.array().items(Joi.string()),
    excludes: Joi.array().items(Joi.string()),
    cancellationPolicy: Joi.string(),
  }),

  activityUpdate: Joi.object({
    title: Joi.string().min(1).max(100),
    description: Joi.string().min(1).max(1000),
    price: Joi.number().min(0),
    duration: Joi.number().min(1),
    location: Joi.string().min(1),
    imageUrl: Joi.string().uri().allow(null),
    maxParticipants: Joi.number().min(1),
    dailySlots: Joi.number().min(1),
    status: Joi.string().valid('active', 'inactive', 'suspended'),
    category: Joi.string().valid(
      'safari', 'wildlife-tour', 'bird-watching', 'nature-walk', 
      'photography', 'adventure', 'educational'
    ),
    difficulty: Joi.string().valid('easy', 'moderate', 'hard'),
    requirements: Joi.alternatives().try(
      Joi.string().allow('', null),
      Joi.array().items(Joi.string())
    ),
    includes: Joi.array().items(Joi.string()),
    excludes: Joi.array().items(Joi.string()),
    cancellationPolicy: Joi.string(),
  }),

  // Event validation schemas
  eventCreation: Joi.object({
    title: Joi.string().min(1).max(100).required(),
    description: Joi.string().min(1).max(1000).required(),
    date: Joi.date().greater('now').required(),
    time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    location: Joi.string().min(1).required(),
    maxSlots: Joi.number().min(1).required(),
    price: Joi.number().min(0).required(),
    imageUrl: Joi.string().uri().allow(null),
    category: Joi.string().valid(
      'workshop', 'seminar', 'conservation', 'educational', 'community', 'fundraising'
    ).required(),
    requirements: Joi.array().items(Joi.string()),
    includes: Joi.array().items(Joi.string()),
    organizer: Joi.object({
      name: Joi.string().required(),
      contact: Joi.string().required(),
      email: Joi.string().email().required(),
    }).required(),
  }),

  eventUpdate: Joi.object({
    title: Joi.string().min(1).max(100),
    description: Joi.string().min(1).max(1000),
    date: Joi.date().greater('now'),
    time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    location: Joi.string().min(1),
    maxSlots: Joi.number().min(1),
    price: Joi.number().min(0),
    imageUrl: Joi.string().uri().allow(null),
    status: Joi.string().valid('upcoming', 'ongoing', 'completed', 'cancelled'),
    category: Joi.string().valid(
      'workshop', 'seminar', 'conservation', 'educational', 'community', 'fundraising'
    ),
    requirements: Joi.array().items(Joi.string()),
    includes: Joi.array().items(Joi.string()),
    organizer: Joi.object({
      name: Joi.string(),
      contact: Joi.string(),
      email: Joi.string().email(),
    }),
  }),

  // Donation validation schemas
  donationCreation: Joi.object({
    amount: Joi.number().min(1).required(),
    currency: Joi.string().valid('USD', 'LKR', 'EUR', 'GBP').default('LKR'),
    paymentMethod: Joi.string().valid(
      'credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash'
    ).default('cash'),
    purpose: Joi.string().valid(
      'general', 'wildlife_conservation', 'habitat_restoration', 
      'animal_rescue', 'education', 'research',
      // New causes from frontend form
      'Wildlife Conservation',
      'Habitat Protection', 
      'Anti-Poaching Efforts',
      'Research & Education',
      'Community Development',
      'Emergency Wildlife Rescue',
      'Park Maintenance',
      'General Support'
    ),
    cause: Joi.string().valid(
      'Wildlife Conservation',
      'Habitat Protection', 
      'Anti-Poaching Efforts',
      'Research & Education',
      'Community Development',
      'Emergency Wildlife Rescue',
      'Park Maintenance',
      'General Support'
    ), // Allow 'cause' as an alias for 'purpose'
    message: Joi.string().max(500).allow(''),
    isAnonymous: Joi.boolean().default(false),
    donorName: Joi.string().trim(),
    donorEmail: Joi.string().email().trim().lowercase(),
  }),

  // Booking validation schemas
  bookingCreate: Joi.object({
    type: Joi.string().valid('safari', 'wildlife_tour', 'conservation_program', 'educational_visit').required(),
    bookingDate: Joi.date().min('now').required(),
    startTime: Joi.string().required(),
    duration: Joi.number().min(0.5).max(24).required(),
    numberOfAdults: Joi.number().min(1).required(),
    numberOfChildren: Joi.number().min(0).default(0),
    location: Joi.object({
      name: Joi.string().required(),
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90),
        longitude: Joi.number().min(-180).max(180),
      }),
      description: Joi.string(),
    }).required(),
    specialRequests: Joi.string().max(500),
    dietaryRequirements: Joi.array().items(Joi.string()),
    accessibilityNeeds: Joi.array().items(Joi.string()),
  }),

  // Animal validation schemas
  animalCreate: Joi.object({
    species: Joi.string().required(),
    commonName: Joi.string(),
    scientificName: Joi.string(),
    condition: Joi.string().valid('critical', 'serious', 'stable', 'good', 'excellent').required(),
    rescueLocation: Joi.object({
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
      }).required(),
      address: Joi.string(),
      description: Joi.string(),
      habitat: Joi.string().valid('forest', 'wetland', 'grassland', 'urban', 'coastal', 'mountain', 'other'),
    }).required(),
    currentLocation: Joi.object({
      facility: Joi.string().required(),
      enclosure: Joi.string(),
    }).required(),
    assignedVet: Joi.string().required(),
  }),

  // Report validation schemas
  reportCreate: Joi.object({
    type: Joi.string().valid('rescue', 'sighting', 'injury', 'emergency', 'poaching', 'habitat_damage').required(),
    title: Joi.string().max(200).required(),
    description: Joi.string().max(2000).required(),
    incidentDate: Joi.date().max('now').required(),
    incidentTime: Joi.string().required(),
    location: Joi.object({
      coordinates: Joi.object({
        latitude: Joi.number().min(-90).max(90).required(),
        longitude: Joi.number().min(-180).max(180).required(),
      }).required(),
      address: Joi.string(),
      landmark: Joi.string(),
      description: Joi.string(),
    }).required(),
    wildlife: Joi.object({
      species: Joi.string(),
      count: Joi.number().min(0),
      condition: Joi.string().valid('healthy', 'injured', 'sick', 'dead', 'distressed', 'unknown'),
      behavior: Joi.string(),
    }),
    reportedBy: Joi.object({
      name: Joi.string(),
      email: Joi.string().email(),
      phone: Joi.string(),
      isAnonymous: Joi.boolean().default(false),
    }),
  }),

  // Vehicle validation schemas
  vehicleCreate: Joi.object({
    registrationNumber: Joi.string().required(),
    type: Joi.string().valid('jeep', 'van', 'truck', 'ambulance', 'motorcycle').required(),
    make: Joi.string().required(),
    model: Joi.string().required(),
    year: Joi.number().min(1900).max(new Date().getFullYear() + 1).required(),
    color: Joi.string(),
    capacity: Joi.object({
      passengers: Joi.number().min(1).required(),
      luggage: Joi.number(),
      fuelTank: Joi.number().min(0),
    }).required(),
    engine: Joi.object({
      type: Joi.string().valid('petrol', 'diesel', 'hybrid', 'electric').required(),
      displacement: Joi.number(),
      power: Joi.number(),
      fuelEfficiency: Joi.number(),
    }).required(),
    mileage: Joi.object({
      current: Joi.number().min(0).required(),
    }).required(),
  }),

  // Common parameter validations
  mongoId: Joi.object({
    id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  }),

  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    sort: Joi.string(),
    order: Joi.string().valid('asc', 'desc').default('desc'),
  }),
};

module.exports = {
  validate,
  schemas,
};
