import express from "express";
import { 
  registerCallOperator, 
  getCallOperators, 
  getCallOperatorById, 
  updateCallOperator,
  deleteCallOperator,
  toggleAvailability,
  getAvailableOperators
} from "../../controllers/user/callOperatorcontroller.js";

const router = express.Router();

// Register a new Call Operator
router.post('/register', registerCallOperator);

// Get all active Call Operators
router.get('/', getCallOperators);

// Get available Call Operators
router.get('/available', getAvailableOperators);

// Get Call Operator by ID
router.get('/:id', getCallOperatorById);

// Update Call Operator profile
router.put('/:id', updateCallOperator);

// Delete Call Operator profile (soft delete)
router.delete('/:id', deleteCallOperator);

// Toggle call operator availability
router.patch('/:id/availability', toggleAvailability);

export default router;