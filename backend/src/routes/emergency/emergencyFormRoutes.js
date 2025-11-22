const express = require('express');
const {
  submitEmergencyForm,
  getAllEmergencyForms,
  getEmergencyFormById,
  assignEmergency,
  updateEmergencyFormStatus,
  deleteEmergencyForm
} = require('../../controllers/emergency/emergencyFormController');

const router = express.Router();

// Submit emergency form (public endpoint)
router.post('/submit', submitEmergencyForm);

// Get all emergency forms (with filtering and pagination)
router.get('/', getAllEmergencyForms);

// Get single emergency form by ID
router.get('/:id', getEmergencyFormById);

// Assign emergency form to staff member
router.put('/:id/assign', assignEmergency);

// Update emergency form status
router.put('/:id/status', updateEmergencyFormStatus);

// Delete emergency form
router.delete('/:id', deleteEmergencyForm);

module.exports = router;

