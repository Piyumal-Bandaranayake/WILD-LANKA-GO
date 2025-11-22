const mongoose = require('mongoose');
const { Schema } = mongoose;

const replySchema = new Schema({
  officerUsername: { type: String, required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const complaintSchema = new Schema({
  // User information - can be either Tourist or SystemUser
  userId: { 
    type: Schema.Types.ObjectId, 
    required: true,
    refPath: 'userType'
  },
  userType: { 
    type: String, 
    enum: ['Tourist', 'SystemUser'], 
    required: true 
  },
  username: { type: String, required: true },  // Display name
  email: { type: String, required: true },     // User email
  role: { 
    type: String, 
    enum: ["tourist", "admin", "wildlifeOfficer", "vet", "tourGuide", "safariDriver", "callOperator", "emergencyOfficer"], 
    required: true 
  },
  message: { type: String, required: true },
  location: { type: String, default: "" },   
  status: { 
    type: String, 
    enum: ['pending', 'reviewed', 'resolved'], 
    default: 'pending' 
  },
  replies: { type: [replySchema], default: [] },
  date: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const Complaint = mongoose.model("Complaint", complaintSchema);
module.exports = Complaint;
