import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
  Name: {
    type: String,
    required: true,
  },
  Username: {
    type: String,
    required: true,
    unique: true,
  },
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  Password: {
    type: String,
    required: true,
    minlength: 6,
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ✅ Virtual field for compatibility with systemLogin controller
adminSchema.virtual('password')
  .get(function () {
    return this.Password;
  })
  .set(function (val) {
    this.Password = val;
  });

// ✅ Hash the actual Password field before save
adminSchema.pre('save', async function (next) {
  if (this.isModified('Password')) {
    this.Password = await bcrypt.hash(this.Password, 10);
  }
  next();
});

// ✅ Utility method if needed elsewhere
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.Password);
};

const Admin = mongoose.model('Admin', adminSchema);
export default Admin;
