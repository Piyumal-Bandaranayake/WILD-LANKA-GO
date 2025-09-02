import mongoose from 'mongoose';

const medicationSchema = new mongoose.Schema({
  name: { type: String, required: true },  // Medication name
  quantity: { type: Number, required: true },  // Current stock quantity
  unit: { type: String, required: true },  // Unit of measurement (e.g., mg, bottles)
  threshold: { type: Number, required: true },  // Minimum stock before ordering
  supplierEmail: { type: String, required: true },  // Supplier's email
  createdAt: { type: Date, default: Date.now },  // Creation date
  updatedAt: { type: Date, default: Date.now },  // Last update date
});

const Medication = mongoose.model('Medication', medicationSchema);

export default Medication;
