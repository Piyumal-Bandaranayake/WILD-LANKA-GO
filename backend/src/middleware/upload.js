const multer = require('multer');
const path = require('path');
const fs = require('fs');
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
      logger.warn('Cloudinary not configured - storing files locally');
      // Store files locally
      if (req.files && req.files.length > 0) {
        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Save files locally
        const savedFiles = [];
        for (const file of req.files) {
          const fileName = `${Date.now()}-${file.originalname}`;
          const filePath = path.join(uploadsDir, fileName);
          fs.writeFileSync(filePath, file.buffer);
          savedFiles.push({
            url: `/uploads/${fileName}`,
            description: 'Animal case photo',
            takenBy: req.user?.id
          });
        }
        req.body.images = savedFiles;
      }
      return next();
    }

    // For feedback uploads, use local storage for faster performance
    if (req.originalUrl && req.originalUrl.includes('/feedback')) {
      logger.info('Using local storage for feedback uploads (faster)');
      if (req.files && req.files.length > 0) {
        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Save files locally for feedback
        const savedFiles = [];
        logger.info(`Processing ${req.files.length} files for feedback upload`);
        for (const file of req.files) {
          const fileName = `${Date.now()}-${file.originalname}`;
          const filePath = path.join(uploadsDir, fileName);
          fs.writeFileSync(filePath, file.buffer);
          const imageObj = {
            url: `/uploads/${fileName}`,
            description: 'Feedback photo',
            takenBy: req.user?.id
          };
          savedFiles.push(imageObj);
          logger.info(`Saved file: ${fileName} -> ${imageObj.url}`);
        }
        req.body.images = savedFiles;
        logger.info(`Final savedFiles array:`, JSON.stringify(savedFiles));
      }
      return next();
    }

    if (req.file) {
      // Single file upload with timeout
      const uploadPromise = uploadImage(req.file.buffer, 'animal-cases');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 15000) // 15 second timeout (reduced from 25s)
      );
      
      const result = await Promise.race([uploadPromise, timeoutPromise]);
      if (result.success) {
        req.body.imageUrl = result.url;
        req.cloudinaryResult = result;
      } else {
        logger.warn('Cloudinary upload failed, storing locally');
        // Ensure uploads directory exists
        const uploadsDir = path.join(__dirname, '../../uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Save file locally
        const fileName = `${Date.now()}-${req.file.originalname}`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, req.file.buffer);
        req.body.imageUrl = `/uploads/${fileName}`;
      }
    } else if (req.files && req.files.length > 0) {
      // Multiple files upload with individual timeouts
      const uploadPromises = req.files.map(file => {
        const uploadPromise = uploadImage(file.buffer, 'animal-cases');
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timeout')), 15000) // 15 second timeout per file (reduced from 25s)
        );
        return Promise.race([uploadPromise, timeoutPromise]);
      });
      
      const results = await Promise.all(uploadPromises);
      
      const successfulUploads = results.filter(result => result.success);
      const failedUploads = results.filter(result => !result.success);
      
      if (failedUploads.length > 0) {
        logger.warn(`${failedUploads.length} files failed to upload to Cloudinary`);
      }
      
      // Store images in the format expected by the controller
      const images = [];
      results.forEach((result, index) => {
        if (result.success) {
          images.push({
            url: result.url,
            description: 'Animal case photo',
            takenBy: req.user?.id
          });
        } else {
          // Fallback to local storage
          // Ensure uploads directory exists
          const uploadsDir = path.join(__dirname, '../../uploads');
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          
          // Save file locally
          const fileName = `${Date.now()}-${req.files[index].originalname}`;
          const filePath = path.join(uploadsDir, fileName);
          fs.writeFileSync(filePath, req.files[index].buffer);
          
          images.push({
            url: `/uploads/${fileName}`,
            description: 'Animal case photo',
            takenBy: req.user?.id
          });
        }
      });
      
      req.body.images = images;
      req.cloudinaryResults = results;
    }
    
    next();
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    
    // Handle timeout errors specifically
    if (error.message === 'Upload timeout') {
      logger.warn('Upload timeout - falling back to local storage');
      if (req.files && req.files.length > 0) {
        req.body.images = req.files.map(file => ({
          url: `/uploads/${file.originalname}`,
          description: 'Animal case photo',
          takenBy: req.user?.id
        }));
      }
    } else {
      // For other errors, continue without Cloudinary upload
      logger.warn('Continuing without Cloudinary upload');
      if (req.files && req.files.length > 0) {
        req.body.images = req.files.map(file => ({
          url: `/uploads/${file.originalname}`,
          description: 'Animal case photo',
          takenBy: req.user?.id
        }));
      }
    }
    
    next();
  }
};

module.exports = {
  uploadSingle,
  uploadMultiple,
  uploadToCloudinary,
  upload
};
