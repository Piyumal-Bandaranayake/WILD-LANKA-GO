import mongoose from "mongoose";

// Define User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6, // You can increase security rules
    },

    role: {
      type: String,
      enum: [
        "Tourist",
        "SafariDriver",
        "Admin",
        "TourGuide",
        "WildlifeOfficer",
        "MedicalOfficer",
        "Vet",
        "CallOperator",
      ],
      required: true,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Export Model
export default mongoose.model("User", userSchema);
