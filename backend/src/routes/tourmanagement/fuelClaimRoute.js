const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  submitFuelClaim,
  submitOdometerReading,
  getOdometerReadingsByDriver,
  getAllFuelClaims,
  getFuelClaimsByDriver,
  updateFuelClaimStatus
} = require('../../controllers/tourmanagement/fuelClaimController');

const router = express.Router();
const { authenticate, authorize } = require('../../middleware/authMiddleware');
const { uploadImage } = require('../../config/cloudinary');

// Configure multer for memory storage (uploads to Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024,  // 5MB file size limit
    files: 1  // Maximum 1 file for individual odometer reading
  },
  fileFilter: (req, file, cb) => {
    console.log('🔍 File filter check:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      extname: path.extname(file.originalname).toLowerCase()
    });
    
    const allowedFileTypes = /jpeg|jpg|png|gif/;
    const isValidExtname = allowedFileTypes.test(path.extname(file.originalname).toLowerCase());
    const isValidMimetype = allowedFileTypes.test(file.mimetype);

    if (isValidExtname && isValidMimetype) {
      console.log('✅ File type accepted');
      return cb(null, true);
    } else {
      console.log('❌ File type rejected');
      cb(new Error('Invalid file type. Only JPG, PNG, and GIF are allowed for odometer readings.'));
    }
  }
});

// Protected routes (require authentication)
router.use(authenticate);

router.post('/submit', 
  authorize('safariDriver'),
  upload.fields([
    { name: 'startMeterImage', maxCount: 1 },
    { name: 'endMeterImage', maxCount: 1 }
  ]), 
  submitFuelClaim
);         // Submit fuel claim with image uploads

// New route for simplified fuel claim submission (without required images)
router.post('/submit-simple', 
  authorize('safariDriver'),
  submitFuelClaim
);         // Submit fuel claim without required images

router.post('/odometer', 
  authorize('safariDriver'),
  upload.single('image'),
  (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      console.log('❌ Multer error:', err);
      return res.status(400).json({ 
        message: 'File upload error: ' + err.message,
        code: err.code 
      });
    } else if (err) {
      console.log('❌ Upload error:', err);
      return res.status(400).json({ 
        message: 'Upload error: ' + err.message 
      });
    }
    next();
  },
  submitOdometerReading
);         // Submit individual odometer reading

router.get('/odometer', 
  authorize('safariDriver'), 
  getOdometerReadingsByDriver
);         // Get odometer readings for current driver

router.get('/odometer/:driverId', 
  authorize('admin', 'wildlifeOfficer'), 
  getOdometerReadingsByDriver
);         // Get odometer readings for specific driver (admin only)

router.get('/', 
  authorize('admin', 'wildlifeOfficer'), 
  getAllFuelClaims
);               // Get all fuel claims

router.get('/driver/:driverId', 
  authorize('admin', 'wildlifeOfficer', 'safariDriver'), 
  getFuelClaimsByDriver
); // Get claims by driver

router.put('/:id/status', 
  authorize('admin', 'wildlifeOfficer'), 
  updateFuelClaimStatus
); // Update fuel claim status

module.exports = router;
