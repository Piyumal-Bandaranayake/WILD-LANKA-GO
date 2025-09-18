import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const emergencyOfficerSchema = new mongoose.Schema({
  Fullname: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  PhoneNumber: {
    type: String,
    required: true,
  },
  EmergencyOfficerRegistartionNumber: {
    type: String,
    required: true,
    unique: true,
  },
  isAvailable: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// ✅ Hash password before saving
emergencyOfficerSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// ✅ Compare entered password
emergencyOfficerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const EmergencyOfficer = mongoose.model('EmergencyOfficer', emergencyOfficerSchema);
export default EmergencyOfficer;