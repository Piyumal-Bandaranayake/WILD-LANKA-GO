const cloudinary = require('cloudinary').v2;
const logger = require('./logger');

// Configure Cloudinary
const configureCloudinary = () => {
  if (process.env.CLOUDINARY_CLOUD_NAME && 
      process.env.CLOUDINARY_API_KEY && 
      process.env.CLOUDINARY_API_SECRET) {
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    logger.info('Cloudinary configured successfully');
    return true;
  } else {
    logger.warn('Cloudinary configuration missing - image uploads will be disabled');
    return false;
  }
};

// Upload image to Cloudinary
const uploadImage = async (filePathOrBuffer, folder = 'wild-lanka-go') => {
  try {
    let uploadOptions = {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto',
      fetch_format: 'auto',
      timeout: 20000, // 20 second timeout for individual uploads
    };

    // Handle buffer uploads (from multer memory storage)
    if (Buffer.isBuffer(filePathOrBuffer)) {
      const result = await cloudinary.uploader.upload(
        `data:image/jpeg;base64,${filePathOrBuffer.toString('base64')}`,
        uploadOptions
      );
      
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      };
    } else {
      // Handle file path uploads (original functionality)
      const result = await cloudinary.uploader.upload(filePathOrBuffer, uploadOptions);
      
      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      };
    }
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    
    // Handle specific error types
    if (error.message && (error.message.includes('timeout') || error.message.includes('ECONNABORTED'))) {
      logger.warn('Cloudinary upload timeout - this is expected if Cloudinary is not configured');
      return {
        success: false,
        error: 'Upload timeout - Cloudinary may not be configured',
        timeout: true
      };
    }
    
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
};

// Delete image from Cloudinary
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      result: result.result,
    };
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Upload multiple images
const uploadMultipleImages = async (filePaths, folder = 'wild-lanka-go') => {
  try {
    const uploadPromises = filePaths.map(filePath => uploadImage(filePath, folder));
    const results = await Promise.all(uploadPromises);
    
    return {
      success: true,
      results: results,
      successCount: results.filter(r => r.success).length,
      failureCount: results.filter(r => !r.success).length,
    };
  } catch (error) {
    logger.error('Multiple image upload error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

module.exports = {
  cloudinary,
  configureCloudinary,
  uploadImage,
  deleteImage,
  uploadMultipleImages,
};
