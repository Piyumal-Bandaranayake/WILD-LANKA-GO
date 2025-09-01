import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  touristId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tourist',  // Reference to the User model (tourist)
    required: true 
  },
  amount: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  donationDate: { 
    type: Date, 
    default: Date.now 
  },
  message: { 
    type: String, 
    default: ''  // Optional message from the donor
  },
},{ timestamps: true }); // Automatically manage createdAt and updatedAt fields

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
