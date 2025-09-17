import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Define the schema for Vet
const vetSchema = new mongoose.Schema({
  Fullname: {
    type: String,
    required: true,
    trim: true
  },
  Email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  PhoneNumber: {
    type: String,
    required: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  VetRegistrationNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  specification: {
    type: String,
    required: true,
    enum: ['Small Animals', 'Large Animals', 'Exotic Animals', 'Surgery', 'Dentistry', 'Dermatology', 'Ophthalmology', 'Cardiology', 'Emergency Care']
  },
  isAvailable: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Create indexes to ensure uniqueness
vetSchema.index({ Email: 1 }, { unique: true });
vetSchema.index({ username: 1 }, { unique: true });
vetSchema.index({ VetRegistrationNumber: 1 }, { unique: true });

// Hash password before saving
vetSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Method to compare passwords
vetSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to remove password from JSON output
vetSchema.methods.toJSON = function () {
  const vet = this.toObject();
  delete vet.password;
  return vet;
};

const Vet = mongoose.model("Vet", vetSchema);

// Drop any conflicting old indexes on application start
Vet.init().then(() => {
  console.log("Vet model initialized with proper indexes");
}).catch(err => {
  console.log("Model initialization completed");
});

export default Vet;