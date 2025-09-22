import mongoose from 'mongoose';

const tourGuideSchema = new mongoose.Schema({
  guideId: {
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
    nationality: { type: String },
    languages: [{ type: String }], // Languages spoken
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relation: { type: String },
    },
  },
  certification: {
    registrationNumber: { type: String, required: true, unique: true },
    licenseType: { type: String, required: true },
    issuedDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    issuingAuthority: { type: String, required: true },
    specializations: [{ 
      type: String,
      enum: ['Wildlife', 'Birds', 'Cultural', 'Adventure', 'Photography', 'Botany', 'Archaeology']
    }],
  },
  experience: {
    yearsOfExperience: { type: Number, required: true, min: 0 },
    previousEmployers: [{
      companyName: { type: String },
      position: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      description: { type: String },
    }],
    certifications: [{
      name: { type: String },
      issuedBy: { type: String },
      issuedDate: { type: Date },
      expiryDate: { type: Date },
      certificateUrl: { type: String },
    }],
  },
  employment: {
    employeeId: { type: String },
    dateJoined: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended', 'Terminated'],
      default: 'Active',
    },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Freelance', 'Contract'],
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
    preferredAreas: [{ type: String }], // Preferred parks/areas
    maxToursPerDay: { type: Number, default: 2 },
    workingHours: {
      start: { type: String, default: '05:00' },
      end: { type: String, default: '19:00' },
    },
  },
  tourHistory: [{
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    numberOfTourists: { type: Number },
    tourType: { type: String },
    touristRating: { type: Number, min: 1, max: 5 },
    feedback: { type: String },
    earnings: { type: Number },
  }],
  tourMaterials: [{
    materialId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TourMaterial',
    },
    title: { type: String, required: true },
    type: { 
      type: String,
      enum: ['Audio', 'Video', 'Document', 'Presentation', 'Map', 'Other'],
      required: true
    },
    fileUrl: { type: String, required: true },
    description: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  }],
  performance: {
    totalToursCompleted: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    onTimePercentage: { type: Number, default: 100 },
    customerSatisfactionScore: { type: Number, default: 0 },
    knowledgeRating: { type: Number, default: 0 },
    communicationRating: { type: Number, default: 0 },
  },
  ratings: [{
    touristId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
    },
    overall: { type: Number, min: 1, max: 5 },
    knowledge: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    punctuality: { type: Number, min: 1, max: 5 },
    friendliness: { type: Number, min: 1, max: 5 },
    comments: { type: String },
    ratedAt: { type: Date, default: Date.now },
  }],
  tourAssignments: [{
    tourId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tour',
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['Assigned', 'Accepted', 'Rejected', 'Completed'],
      default: 'Assigned',
    },
    response: { type: String }, // Response message if rejected
    responseAt: { type: Date },
  }],
  documentation: {
    profileImage: {
      public_id: { type: String },
      url: { type: String },
    },
    licenseImage: {
      public_id: { type: String },
      url: { type: String },
    },
    certificateImages: [{
      public_id: { type: String },
      url: { type: String },
      description: { type: String },
    }],
    idCardImage: {
      public_id: { type: String },
      url: { type: String },
    },
  },
  notifications: [{
    type: {
      type: String,
      enum: ['Tour Assignment', 'Tour Update', 'Material Upload', 'Rating Received', 'System Alert'],
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
  settings: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: true },
    tourReminders: { type: Boolean, default: true },
    ratingNotifications: { type: Boolean, default: true },
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

// Pre-save middleware to generate guide ID
tourGuideSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastGuide = await this.constructor.findOne().sort({ createdAt: -1 });
    let nextId = 1;
    if (lastGuide && lastGuide.guideId) {
      const lastId = parseInt(lastGuide.guideId.split('-')[1], 10);
      nextId = lastId + 1;
    }
    this.guideId = `TGD-${String(nextId).padStart(5, '0')}`;
  }
  
  // Calculate average rating
  if (this.ratings && this.ratings.length > 0) {
    const totalRating = this.ratings.reduce((sum, rating) => sum + rating.overall, 0);
    this.performance.averageRating = totalRating / this.ratings.length;
    
    const knowledgeTotal = this.ratings.reduce((sum, rating) => sum + rating.knowledge, 0);
    this.performance.knowledgeRating = knowledgeTotal / this.ratings.length;
    
    const communicationTotal = this.ratings.reduce((sum, rating) => sum + rating.communication, 0);
    this.performance.communicationRating = communicationTotal / this.ratings.length;
  }
  
  this.updatedAt = new Date();
  next();
});

// Indexes for better performance
tourGuideSchema.index({ userId: 1 });
tourGuideSchema.index({ 'personalInfo.email': 1 });
tourGuideSchema.index({ 'certification.registrationNumber': 1 });
tourGuideSchema.index({ 'employment.status': 1 });
tourGuideSchema.index({ 'availability.isAvailable': 1 });
tourGuideSchema.index({ 'certification.specializations': 1 });

const TourGuideProfile = mongoose.model('TourGuideProfile', tourGuideSchema);

export default TourGuideProfile;