import mongoose from "mongoose";
const { Schema } = mongoose;

const replySchema = new Schema({
  officerUsername: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const complaintSchema = new Schema({
  username: { type: String, required: true },  // Who filed (tourist, guide, driver)
  email: { type: String, required: true },     // Added email field
  role: { 
    type: String, 
    enum: ["Tourist", "TourGuide", "Driver"], 
    required: true 
  },
  message: { type: String, required: true },
  location: { type: String, default: "" },   
  replies: { type: [replySchema], default: [] },
  date: { type: Date, default: Date.now }
});

const Complaint = mongoose.model("Complaint", complaintSchema);
export default Complaint;
