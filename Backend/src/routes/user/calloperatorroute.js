import express, { Router } from "express";
import { registerCallOperator, getCallOperators, getCallOperatorById } from "../../controllers/user/callOperatorcontroller.js";

const router = express.Router();

// Register a new Call Operator
router.post('/register', registerCallOperator);

// Get all Call Operators
router.get('/', getCallOperators);

// Get Call Operator by ID
router.get('/:id', getCallOperatorById);


export default router;