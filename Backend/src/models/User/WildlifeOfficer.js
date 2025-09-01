import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const wildlifeOfficerSchema = new mongoose.Schema({
  Fullname: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  username: { // ✅ lowercase and consistent with login system
    type: String,
    required: true,
    unique: true,
  },
  password: { // ✅ lowercase and consistent
    type: String,
    required: true,
    minlength: 6,
  },
  PhoneNumber: {
    type: String,
    required: true,
  },
  OfficerID: {
    type: String,
    required: true,
    unique: true,
  },
  ExperienceYear: {
    type: Number,
    required: true,
    min: 0,
  },
  Status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  },
});

// ✅ Hash the password before saving
wildlifeOfficerSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// ✅ Compare entered password with stored hash
wildlifeOfficerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const WildlifeOfficer = mongoose.model('WildlifeOfficer', wildlifeOfficerSchema);
export default WildlifeOfficer;
