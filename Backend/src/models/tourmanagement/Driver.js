import mongoose from 'mongoose';

const driverSchema = new mongoose.Schema({
  driverId: {
    type: String,
    unique: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  personalInfo: {
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String },
    dateOfBirth: { type: Date },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },
  },
  licenseInfo: {
    licenseNumber: { type: String, required: true, unique: true },
    licenseType: { type: String, required: true },
    expiryDate: { type: Date, required: true },
    issuedDate: { type: Date },
    issuingAuthority: { type: String },
  },
  vehicleInfo: {
    vehicleType: { 
      type: String, 
      enum: ['Safari Jeep', 'Bus', 'Van', 'Truck', 'Other'],
      required: true 
    },
    vehicleNumber: { type: String, required: true },
    vehicleModel: { type: String },
    vehicleYear: { type: Number },
    capacity: { type: Number },
    fuelType: { 
      type: String,
      enum: ['Petrol', 'Diesel', 'Hybrid', 'Electric'],
      default: 'Diesel'
    },
    averageFuelConsumption: { type: Number }, // km per liter
  },
  employment: {
    employeeId: { type: String },
    dateJoined: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended', 'Terminated'],
      default: 'Active',
    },
    workSchedule: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract'],
      default: 'Full-time',
    },
  },
  availability: {
    isAvailable: { type: Boolean, default: true },
    currentTour: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
      default: null,
    },
    unavailableDates: [{
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      reason: { type: String },
    }],
    workingHours: {
      start: { type: String, default: '06:00' },
      end: { type: String, default: '18:00' },
    },
  },
  tourHistory: [{
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    distance: { type: Number },
    touristRating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
  }],
  fuelClaims: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FuelClaim',
  }],
  odometerTracking: {
    currentReading: { type: Number, default: 0 },
    lastUpdated: { type: Date },
    maintenanceAlerts: [{
      type: { type: String },
      message: { type: String },
      dueAt: { type: Number }, // odometer reading
      isActive: { type: Boolean, default: true },
    }],
  },
  performance: {
    totalToursCompleted: { type: Number, default: 0 },
    totalDistanceDriven: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    onTimePercentage: { type: Number, default: 100 },
    fuelEfficiencyRating: { type: Number, default: 0 },
  },
  documentation: {
    profileImage: {
      public_id: { type: String },
      url: { type: String },
    },
    licenseImage: {
      public_id: { type: String },
      url: { type: String },
    },
    vehicleImages: [{
      public_id: { type: String },
      url: { type: String },
      description: { type: String },
    }],
    medicalCertificate: {
      public_id: { type: String },
      url: { type: String },
      expiryDate: { type: Date },
    },
  },
  notifications: [{
    type: {
      type: String,
      enum: ['Tour Assignment', 'Fuel Claim Update', 'Maintenance Alert', 'System Alert'],
    },
    message: { type: String },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
  bankDetails: {
    accountNumber: { type: String },
    bankName: { type: String },
    branchCode: { type: String },
    accountHolderName: { type: String },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save middleware to generate driver ID
driverSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastDriver = await this.constructor.findOne().sort({ createdAt: -1 });
    let nextId = 1;
    if (lastDriver && lastDriver.driverId) {
      const lastId = parseInt(lastDriver.driverId.split('-')[1], 10);
      nextId = lastId + 1;
    }
    this.driverId = `DRV-${String(nextId).padStart(5, '0')}`;
  }
  
  this.updatedAt = new Date();
  next();
});

// Indexes for better performance
driverSchema.index({ userId: 1 });
driverSchema.index({ 'personalInfo.email': 1 });
driverSchema.index({ 'licenseInfo.licenseNumber': 1 });
driverSchema.index({ 'employment.status': 1 });
driverSchema.index({ 'availability.isAvailable': 1 });

const Driver = mongoose.model('Driver', driverSchema);

export default Driver;