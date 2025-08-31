import mongoose from 'mongoose';

const tourMaterialSchema = new mongoose.Schema({
  // Link material to a tour
  tourId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true
  },

  // Who uploaded it (Tour Guide / Wildlife Officer etc.)
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourGuide',
    required: true
  },

  // File details
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  fileUrl: {
    type: String, // URL/path to uploaded file (e.g., AWS S3, local storage)
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'image', 'doc', 'map', 'other'],
    default: 'other'
  },

  // Access controls
  isDownloadable: {
    type: Boolean,
    default: true
  },

  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const TourMaterial = mongoose.model('TourMaterial', tourMaterialSchema);
export default TourMaterial;
