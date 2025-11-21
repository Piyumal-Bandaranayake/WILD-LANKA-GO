const express = require('express');
const {
    reportEmergency,
    createEmergencyByCallOperator,
    getAllEmergencies,
    getEmergencyById,
    updateEmergencyStatus,
    deleteEmergency,
    getEmergencyStats,
    assignEmergency,
    getAssignedEmergencies,
    updateEmergencyStatusSimple
} = require('../../controllers/emergency/emergencyController');
const { authenticate, authorize } = require('../../middleware/authMiddleware');

const router = express.Router();

// Endpoint for reporting an emergency (POST) - Public/Visitor use
router.post('/report', reportEmergency);

// Endpoint for creating emergency by call operator (POST) - Protected route
router.post('/call-operator', authenticate, authorize('callOperator', 'admin'), createEmergencyByCallOperator);

// Endpoint for getting emergency statistics (GET) - Must be before /:id route - Protected route
router.get('/stats', authenticate, authorize('callOperator', 'admin', 'emergencyOfficer'), getEmergencyStats);

// Endpoint for getting all emergencies with filtering and pagination (GET) - Protected route
router.get('/', authenticate, authorize('callOperator', 'admin', 'emergencyOfficer'), getAllEmergencies);

// Endpoint for getting emergencies assigned to current user (GET) - Protected route
router.get('/assigned', authenticate, authorize('emergencyOfficer', 'vet', 'admin'), getAssignedEmergencies);

// Endpoint for getting an emergency by ID (GET) - Protected route
router.get('/:id', authenticate, authorize('callOperator', 'admin', 'emergencyOfficer'), getEmergencyById);

// Endpoint for updating emergency status (PUT) - Protected route
router.put('/:id/status', authenticate, authorize('callOperator', 'admin', 'emergencyOfficer'), updateEmergencyStatus);

// Endpoint for simple status update by emergency officers (PUT) - Protected route
router.put('/:id/status-simple', authenticate, authorize('emergencyOfficer', 'vet', 'admin'), updateEmergencyStatusSimple);

// Endpoint for assigning emergency to staff member (PUT) - Protected route
router.put('/:id/assign', authenticate, authorize('callOperator', 'admin'), assignEmergency);

// Endpoint for deleting an emergency (DELETE) - Protected route
router.delete('/:id', authenticate, authorize('callOperator', 'admin'), deleteEmergency);

module.exports = router;
