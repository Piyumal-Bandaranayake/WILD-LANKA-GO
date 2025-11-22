const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  role: { type: String, enum: ['TourGuide', 'Driver'], required: true },

  // Common fields
  firstname: String,
  lastname: String,
  email: { type: String, required: true },
  phone: String,

  // TourGuide-only
  Guide_Registration_No: String,
  Experience_Year: Number,

  // Driver-only
  LicenceNumber: String,
  vehicleType: String,
  vehicleNumber: String,

  // Workflow
  status: { type: String, enum: ['Submitted', 'ApprovedByWPO', 'RejectedByWPO', 'AccountCreated'], default: 'Submitted' },
  notes: String,               // WPO/Admin remarks
}, { timestamps: true });

module.exports = mongoose.model('JobApplication', applicationSchema);
