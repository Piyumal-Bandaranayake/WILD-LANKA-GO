const mongoose = require('mongoose');
const { VEHICLE_TYPES, VEHICLE_STATUS } = require('../utils/constants');

const vehicleSchema = new mongoose.Schema({
  // Basic Information
  vehicleId: {
    type: String,
    unique: true,
    required: [true, 'Vehicle ID is required'],
  },
  registrationNumber: {
    type: String,
    unique: true,
    required: [true, 'Registration number is required'],
    uppercase: true,
    trim: true,
  },
  
  // Vehicle Details
  type: {
    type: String,
    enum: Object.values(VEHICLE_TYPES),
    required: [true, 'Vehicle type is required'],
  },
  make: {
    type: String,
    required: [true, 'Vehicle make is required'],
    trim: true,
  },
  model: {
    type: String,
    required: [true, 'Vehicle model is required'],
    trim: true,
  },
  year: {
    type: Number,
    required: [true, 'Manufacturing year is required'],
    min: 1900,
    max: new Date().getFullYear() + 1,
  },
  color: {
    type: String,
    trim: true,
  },
  
  // Capacity and Specifications
  capacity: {
    passengers: {
      type: Number,
      required: [true, 'Passenger capacity is required'],
      min: 1,
    },
    luggage: Number, // in cubic feet or liters
    fuelTank: {
      type: Number,
      min: 0,
    },
  },
  
  // Engine and Performance
  engine: {
    type: {
      type: String,
      enum: ['petrol', 'diesel', 'hybrid', 'electric'],
      required: [true, 'Engine type is required'],
    },
    displacement: Number, // in cc
    power: Number, // in HP
    fuelEfficiency: Number, // km per liter
  },
  
  // Status and Availability
  status: {
    type: String,
    enum: Object.values(VEHICLE_STATUS),
    default: VEHICLE_STATUS.AVAILABLE,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Assignment
  assignedDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignmentDate: Date,
  
  // Location and Tracking
  currentLocation: {
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    address: String,
    facility: String,
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  
  // Maintenance and Service
  maintenance: {
    lastService: {
      date: Date,
      type: String,
      mileage: Number,
      performedBy: String,
      cost: Number,
      notes: String,
    },
    nextService: {
      date: Date,
      mileage: Number,
      type: String,
    },
    serviceHistory: [{
      date: {
        type: Date,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      mileage: Number,
      description: String,
      performedBy: String,
      cost: Number,
      parts: [String],
      notes: String,
    }],
  },
  
  // Mileage and Usage
  mileage: {
    current: {
      type: Number,
      required: [true, 'Current mileage is required'],
      min: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  usageHistory: [{
    date: Date,
    startMileage: Number,
    endMileage: Number,
    distance: Number,
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    purpose: String,
    fuelConsumed: Number,
  }],
  
  // Insurance and Documentation
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date,
    coverage: [String],
    premium: Number,
  },
  registration: {
    expiryDate: Date,
    issuedBy: String,
  },
  permits: [{
    type: String,
    number: String,
    expiryDate: Date,
    issuedBy: String,
  }],
  
  // Safety and Equipment
  safetyEquipment: [{
    item: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    condition: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor', 'needs_replacement'],
      default: 'good',
    },
    lastChecked: Date,
  }],
  
  // Features and Amenities
  features: [{
    type: String,
  }],
  amenities: [{
    type: String,
  }],
  
  // Fuel Management
  fuel: {
    currentLevel: {
      type: Number,
      min: 0,
      max: 100, // percentage
    },
    lastRefuel: {
      date: Date,
      amount: Number,
      cost: Number,
      mileage: Number,
      station: String,
    },
    fuelHistory: [{
      date: Date,
      amount: Number,
      cost: Number,
      mileage: Number,
      station: String,
      driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    }],
  },
  
  // Inspection and Compliance
  inspections: [{
    type: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    result: {
      type: String,
      enum: ['passed', 'failed', 'conditional'],
      required: true,
    },
    inspector: String,
    notes: String,
    nextDue: Date,
  }],
  
  // Financial Information
  financial: {
    purchasePrice: Number,
    purchaseDate: Date,
    currentValue: Number,
    depreciationRate: Number,
    totalMaintenanceCost: {
      type: Number,
      default: 0,
    },
    totalFuelCost: {
      type: Number,
      default: 0,
    },
  },
  
  // Administrative
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters'],
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
vehicleSchema.index({ vehicleId: 1 });
vehicleSchema.index({ registrationNumber: 1 });
vehicleSchema.index({ type: 1 });
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ assignedDriver: 1 });
vehicleSchema.index({ isActive: 1 });

// Pre-save middleware to generate vehicle ID
vehicleSchema.pre('save', function(next) {
  if (!this.vehicleId) {
    const typePrefix = {
      [VEHICLE_TYPES.JEEP]: 'JP',
      [VEHICLE_TYPES.VAN]: 'VN',
      [VEHICLE_TYPES.TRUCK]: 'TK',
      [VEHICLE_TYPES.AMBULANCE]: 'AM',
      [VEHICLE_TYPES.MOTORCYCLE]: 'MC',
    };
    
    const prefix = typePrefix[this.type] || 'VH';
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.vehicleId = `${prefix}-${random}`;
  }
  next();
});

// Virtual for vehicle age
vehicleSchema.virtual('age').get(function() {
  return new Date().getFullYear() - this.year;
});

// Virtual for next service due
vehicleSchema.virtual('serviceStatus').get(function() {
  if (!this.maintenance.nextService.date) return 'unknown';
  
  const now = new Date();
  const nextService = new Date(this.maintenance.nextService.date);
  const daysUntilService = Math.ceil((nextService - now) / (1000 * 60 * 60 * 24));
  
  if (daysUntilService < 0) return 'overdue';
  if (daysUntilService <= 7) return 'due_soon';
  if (daysUntilService <= 30) return 'upcoming';
  return 'current';
});

// Instance method to assign driver
vehicleSchema.methods.assignDriver = function(driverId, assignedBy) {
  this.assignedDriver = driverId;
  this.assignmentDate = new Date();
  this.updatedBy = assignedBy;
  return this.save();
};

// Instance method to update mileage
vehicleSchema.methods.updateMileage = function(newMileage, updatedBy) {
  if (newMileage < this.mileage.current) {
    throw new Error('New mileage cannot be less than current mileage');
  }
  
  this.mileage.current = newMileage;
  this.mileage.lastUpdated = new Date();
  this.updatedBy = updatedBy;
  return this.save();
};

// Instance method to add fuel record
vehicleSchema.methods.addFuelRecord = function(fuelData) {
  this.fuel.fuelHistory.push({
    ...fuelData,
    date: fuelData.date || new Date(),
  });
  
  // Update last refuel info
  this.fuel.lastRefuel = {
    date: fuelData.date || new Date(),
    amount: fuelData.amount,
    cost: fuelData.cost,
    mileage: fuelData.mileage,
    station: fuelData.station,
  };
  
  // Update total fuel cost
  this.financial.totalFuelCost += fuelData.cost || 0;
  
  return this.save();
};

// Static method to find available vehicles
vehicleSchema.statics.findAvailable = function(type = null) {
  const query = {
    status: VEHICLE_STATUS.AVAILABLE,
    isActive: true,
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query);
};

// Static method to find vehicles needing service
vehicleSchema.statics.findNeedingService = function() {
  const now = new Date();
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  return this.find({
    $or: [
      { 'maintenance.nextService.date': { $lte: oneWeekFromNow } },
      { 'maintenance.nextService.date': { $exists: false } },
    ],
    isActive: true,
  });
};

module.exports = mongoose.model('Vehicle', vehicleSchema);
