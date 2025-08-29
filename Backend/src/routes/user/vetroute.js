import express from "express";
import { registerVet } from "../../controllers/user/vetcontroller.js";
const router = express.Router();
// Register Vet route
router.post('/register', registerVet);

export default router;

