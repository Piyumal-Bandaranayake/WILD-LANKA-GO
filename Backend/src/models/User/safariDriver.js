import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const safariDriverSchema = new mongoose.Schema({
  DriverName: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  PhoneNumber: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: { // ✅ lowercase (important for consistency)
    type: String,
    required: true,
    minlength: 6
  },
  LicenceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  vechicleType: {
    type: String,
    required: true,
  },
  vechicleNumber: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  }
});

// ✅ Hash password before saving
safariDriverSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// ✅ Compare password
safariDriverSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const SafariDriver = mongoose.model('SafariDriver', safariDriverSchema);
export default SafariDriver;
