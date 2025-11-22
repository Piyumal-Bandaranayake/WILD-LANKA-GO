const express = require('express');
const { submitRejection } = require('../../controllers/tourmanagement/rejectioncontroller');

const router = express.Router();

// GET route for testing
router.get('/', (req, res) => {
  res.json({ message: 'Tour rejection routes are working', status: 'success' });
});

router.post('/submit', submitRejection); // POST /api/tour-rejection/submit

module.exports = router;
