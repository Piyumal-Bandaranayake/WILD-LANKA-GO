const multer = require('multer');
const { uploadImage } = require('../../config/cloudinary');
const logger = require('../../config/logger');

// Configure multer for memory storage (we'll upload to Cloudinary)
const storage = multer.memoryStorage();

// File filter function
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter,
});

// Middleware to handle single image upload
const uploadSingle = (fieldName = 'imageUrl') => {
  return upload.single(fieldName);
};

// Middleware to handle multiple image uploads
const uploadMultiple = (fieldName = 'images', maxCount = 5) => {
  return upload.array(fieldName, maxCount);
};

// Middleware to upload file to Cloudinary after multer processing
const uploadToCloudinary = async (req, res, next) => {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      const error = new Error('Cloudinary is not configured. Image uploads are disabled on Vercel.');
      logger.error('Cloudinary configuration missing - uploads cannot proceed');
      return next(error);
    }

    if (req.file) {
      // Single file upload with timeout
      const uploadPromise = uploadImage(req.file.buffer, 'wild-lanka-go');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 20000) // 20 second timeout
      );
      
      const result = await Promise.race([uploadPromise, timeoutPromise]);
      if (result.success) {
        req.body.imageUrl = result.url;
        req.cloudinaryResult = result;
      } else {
        throw new Error('Cloudinary upload failed: ' + (result.error || 'Unknown error'));
      }
    } else if (req.files && req.files.length > 0) {
      // Multiple files upload with individual timeouts
      const uploadPromises = req.files.map(file => {
        const uploadPromise = uploadImage(file.buffer, 'wild-lanka-go');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout')), 20000) // 20 second timeout per file
        );
        return Promise.race([uploadPromise, timeoutPromise]);
      });
      
      const results = await Promise.all(uploadPromises);
      
      const successfulUploads = results.filter(result => result.success);
      const failedUploads = results.filter(result => !result.success);
      
      if (failedUploads.length > 0) {
        logger.warn(`${failedUploads.length} files failed to upload to Cloudinary`);
        throw new Error(`${failedUploads.length} file(s) failed to upload to Cloudinary`);
      }
      
      // Store images in the format expected by the controller
      const images = successfulUploads.map(result => ({
        url: result.url,
        description: 'Uploaded photo',
        takenBy: req.user?.id
      }));
      
      req.body.images = images;
      req.cloudinaryResults = results;
    }
    
    next();
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    next(error);
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadToCloudinary,
  upload
};
