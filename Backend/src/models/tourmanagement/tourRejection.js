import mongoose from 'mongoose';

const tourRejectionSchema = new mongoose.Schema({
tourId: {
  type: mongoose.Schema.Types.ObjectId,
  required: true
},
  tourGuideId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourGuide',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const TourRejection = mongoose.model('TourRejection', tourRejectionSchema);
export default TourRejection;
