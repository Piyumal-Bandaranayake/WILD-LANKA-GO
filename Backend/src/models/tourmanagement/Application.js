import mongoose from 'mongoose';

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
  vechicleType: String,
  vechicleNumber: String,

  // Workflow
  status: { type: String, enum: ['Submitted', 'ApprovedByWPO', 'RejectedByWPO', 'AccountCreated'], default: 'Submitted' },
  notes: String,               // WPO/Admin remarks
}, { timestamps: true });

export default mongoose.model('Application', applicationSchema);
