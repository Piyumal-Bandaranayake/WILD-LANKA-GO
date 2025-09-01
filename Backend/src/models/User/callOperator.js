import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const callOperatorSchema = new mongoose.Schema({
  operatorName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: { // ✅ lowercase (for login)
    type: String,
    required: true,
    unique: true,
  },
  password: { // ✅ lowercase (for login)
    type: String,
    required: true,
    minlength: 6,
  },
  phone: {
    type: String,
    required: true,
  },
});

// ✅ Hash the password before saving
callOperatorSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// ✅ Compare entered password
callOperatorSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const CallOperator = mongoose.model('CallOperator', callOperatorSchema);
export default CallOperator;
