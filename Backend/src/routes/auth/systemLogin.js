import express from 'express';
import protect from '../../middleware/authMiddleware.js';


const router = express.Router();

// Logged-in system user profile
router.get('/profile/me', protect, (req, res) => {
  res.status(200).json({ message: 'System profile fetched', user: req.user });
});



export default router;
