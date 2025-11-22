const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tourist',
    required: true,
  },
  applicationType: {
    type: String,
    enum: ['tourGuide', 'safariDriver'],
    required: [true, 'Application type is required'],
  },
  personalInfo: {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[0-9+\-\s()]+$/, 'Please enter a valid phone number'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'Sri Lanka',
      }
    },
    nationalId: {
      type: String,
      required: [true, 'National ID is required'],
    }
  },
  qualifications: {
    education: {
      type: String,
      required: [true, 'Education level is required'],
    },
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
      default: 0,
    },
    languages: [{
      type: String,
      trim: true,
    }],
    certifications: [{
      name: String,
      issuedBy: String,
      issuedDate: Date,
      expiryDate: Date,
      certificateNumber: String,
    }],
    specializations: [{
      type: String,
      trim: true,
    }]
  },
  // Tour Guide specific fields
  tourGuideInfo: {
    guideType: {
      type: String,
      enum: ['wildlife', 'cultural', 'adventure', 'general'],
    },
    areasOfExpertise: [{
      type: String,
      trim: true,
    }],
    previousEmployers: [{
      company: String,
      position: String,
      startDate: Date,
      endDate: Date,
      responsibilities: String,
    }]
  },
  // Safari Driver specific fields
  driverInfo: {
    licenseNumber: {
      type: String,
    },
    licenseType: {
      type: String,
      enum: ['light', 'heavy', 'commercial'],
    },
    licenseExpiryDate: {
      type: Date,
    },
    vehicleExperience: [{
      vehicleType: String,
      yearsOfExperience: Number,
    }],
    drivingRecord: {
      accidents: {
        type: Number,
        default: 0,
      },
      violations: {
        type: Number,
        default: 0,
      },
      lastViolationDate: Date,
    }
  },
  documents: [{
    type: {
      type: String,
      enum: ['resume', 'certificate', 'license', 'id_copy', 'photo', 'other'],
      required: true,
    },
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved_by_wpo', 'approved_by_admin', 'rejected', 'rejected_by_wpo'],
    default: 'pending',
  },
  reviewNotes: [{
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SystemUser',
    },
    note: String,
    reviewDate: {
      type: Date,
      default: Date.now,
    },
    action: {
      type: String,
      enum: ['review', 'approve', 'reject', 'request_info'],
    }
  }],
  
  // Workflow tracking
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
  },
  reviewedAt: Date,
  
  // Wildlife Park Officer approval
  wpoApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
  },
  wpoApprovedAt: Date,
  wpoRejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
  },
  wpoRejectedAt: Date,
  wpoRejectionReason: String,
  
  // Admin final approval
  adminApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
  },
  adminApprovedAt: Date,
  adminRejectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SystemUser',
  },
  adminRejectedAt: Date,
  adminRejectionReason: String,
  
}, {
  timestamps: true,
});

// Indexes
applicationSchema.index({ applicant: 1 });
applicationSchema.index({ status: 1 });
applicationSchema.index({ applicationType: 1 });
applicationSchema.index({ createdAt: -1 });
applicationSchema.index({ 'personalInfo.email': 1 });

// Instance method to update status with two-step approval process
applicationSchema.methods.updateStatus = function(status, reviewerId, notes, userRole) {
  this.status = status;
  
  if (notes) {
    this.reviewNotes.push({
      reviewer: reviewerId,
      note: notes,
      action: status.includes('approved') ? 'approve' : status.includes('rejected') ? 'reject' : 'review'
    });
  }
  
  // Handle Wildlife Park Officer actions
  if (userRole === 'wildlifeOfficer') {
    if (status === 'approved_by_wpo') {
      this.wpoApprovedBy = reviewerId;
      this.wpoApprovedAt = new Date();
    } else if (status === 'rejected_by_wpo') {
      this.wpoRejectedBy = reviewerId;
      this.wpoRejectedAt = new Date();
      if (notes) this.wpoRejectionReason = notes;
    }
  }
  
  // Handle Admin actions
  if (userRole === 'admin') {
    if (status === 'approved_by_admin') {
      this.adminApprovedBy = reviewerId;
      this.adminApprovedAt = new Date();
    } else if (status === 'rejected') {
      this.adminRejectedBy = reviewerId;
      this.adminRejectedAt = new Date();
      if (notes) this.adminRejectionReason = notes;
    }
  }
  
  // General review tracking
  if (status === 'under_review') {
    this.reviewedBy = reviewerId;
    this.reviewedAt = new Date();
  }
  
  return this.save();
};

// Static method to get application statistics
applicationSchema.statics.getStatistics = async function() {
  const statusStats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const typeStats = await this.aggregate([
    {
      $group: {
        _id: '$applicationType',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return {
    byStatus: statusStats,
    byType: typeStats
  };
};

// Static method to find by applicant
applicationSchema.statics.findByApplicant = function(applicantId) {
  return this.find({ applicant: applicantId })
    .populate('reviewedBy approvedBy rejectedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Application', applicationSchema);
