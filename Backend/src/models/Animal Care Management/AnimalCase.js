import mongoose from 'mongoose';

// Define the Animal Case Schema
const animalCaseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    unique: true,
  },
  animalType: {
    type: String,
    required: true, // Select animal type (e.g., Elephant, Tiger, etc.)
  },
  speciesScientificName: {
    type: String,
    required: true, // Scientific name (e.g., Elephas maximus)
  },
  ageSize: {
    type: String,
    enum: ['Adult', 'Juvenile', 'Calf'],
    required: true,
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Unknown'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium',
    required: true,
  },
  location: {
    type: String,
    required: true, // Location details (e.g., national park, coordinates)
  },
  reportedBy: {
    type: String,
    required: true, // Name and role of the person reporting
  },
  primaryCondition: {
    type: String,
    required: true, // Brief description of the primary injury/condition
  },
  symptomsObservations: {
    type: String,
    required: true, // Detailed observations (behavior, symptoms)
  },
  initialTreatmentPlan: {
    type: String,
    required: true, // Immediate treatment steps and interventions
  },
  additionalNotes: {
    type: String,
    default: '', // Additional notes, if any
  },
  photosDocumentation: [{
    public_id: { type: String, required: true },
    url: { type: String, required: true },
    thumbnail_url: { type: String },
    description: { type: String, default: '' },
    uploaded_at: { type: Date, default: Date.now },
    uploaded_by: { type: String, default: '' },
    file_size: { type: Number },
    dimensions: {
      width: { type: Number },
      height: { type: Number }
    }
  }],
  status: {
    type: String,
    enum: ['Unassigned', 'Assigned', 'In Progress', 'Completed'],
    default: 'Unassigned',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});


// Pre-save middleware to generate a unique case ID
animalCaseSchema.pre('save', async function (next) {
  if (this.isNew) {

    const lastCase = await this.constructor.findOne().sort({ createdAt: -1 });
    let nextId = 1;
    if (lastCase && lastCase.caseId) {
      const lastId = parseInt(lastCase.caseId.split('-')[1], 10);
      nextId = lastId + 1;
    }
    this.caseId = `CASE-${String(nextId).padStart(5, '0')}`;
  }
  next();
});

const AnimalCase = mongoose.model('AnimalCase', animalCaseSchema);

export default AnimalCase;
