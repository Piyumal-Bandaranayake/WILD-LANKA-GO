const express = require('express');
const router = express.Router();
const {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  updateStock,
  getInventoryStats
} = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticate);

// Get inventory dashboard stats
router.get('/stats', 
  authorize('vet', 'admin'),
  getInventoryStats
);

// Get all medicines with filtering and pagination
router.get('/', 
  authorize('vet', 'admin'),
  getMedicines
);

// Get single medicine by ID
router.get('/:id', 
  authorize('vet', 'admin'),
  getMedicineById
);

// Create new medicine
router.post('/', 
  authorize('vet', 'admin'),
  createMedicine
);

// Update medicine
router.put('/:id', 
  authorize('vet', 'admin'),
  updateMedicine
);

// Delete medicine
router.delete('/:id', 
  authorize('vet', 'admin'),
  deleteMedicine
);

// Update stock
router.put('/:id/stock', 
  authorize('vet', 'admin'),
  updateStock
);

module.exports = router;
