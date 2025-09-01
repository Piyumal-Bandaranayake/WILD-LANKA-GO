import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// Define the schema for Vet
const vetSchema = new mongoose.Schema({
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
  VetRegistrationNumber: {
    type: String,
    required: true,
    unique: true,
  },
  specification: {
    type: String,
    required: true,
  },
});

// ✅ Hash password before saving
vetSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// ✅ Method to compare passwords
vetSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Vet = mongoose.model("Vet", vetSchema);
export default Vet;
