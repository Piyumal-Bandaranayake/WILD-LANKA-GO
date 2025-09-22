import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Utility functions for image operations
export const uploadImage = async (file, options = {}) => {
  try {
    const defaultOptions = {
      folder: 'wildlanka/animal-care',
      resource_type: 'image',
      format: 'jpg',
      quality: 'auto',
      fetch_format: 'auto',
      ...options
    };

    const result = await cloudinary.uploader.upload(file, defaultOptions);
    
    console.log('✅ Image uploaded to Cloudinary:', {
      public_id: result.public_id,
      url: result.secure_url,
      size: result.bytes
    });

    return {
      public_id: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      created_at: result.created_at
    };
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error(`Image upload failed: ${error.message}`);
  }
};

// Delete image from Cloudinary
export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log('🗑️ Image deleted from Cloudinary:', publicId);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary delete error:', error);
    throw new Error(`Image deletion failed: ${error.message}`);
  }
};

// Generate optimized URL
export const getOptimizedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    fetch_format: 'auto',
    quality: 'auto',
    crop: 'fill',
    gravity: 'auto',
    ...options
  };

  return cloudinary.url(publicId, defaultOptions);
};

// Generate thumbnail URL
export const getThumbnailUrl = (publicId, width = 300, height = 300) => {
  return cloudinary.url(publicId, {
    width,
    height,
    crop: 'fill',
    gravity: 'auto',
    quality: 'auto',
    fetch_format: 'auto'
  });
};

// Generate multiple sizes for responsive images
export const getResponsiveUrls = (publicId) => {
  const sizes = [
    { name: 'thumbnail', width: 150, height: 150 },
    { name: 'small', width: 300, height: 300 },
    { name: 'medium', width: 600, height: 600 },
    { name: 'large', width: 1200, height: 1200 }
  ];

  return sizes.reduce((urls, size) => {
    urls[size.name] = cloudinary.url(publicId, {
      width: size.width,
      height: size.height,
      crop: 'fill',
      gravity: 'auto',
      quality: 'auto',
      fetch_format: 'auto'
    });
    return urls;
  }, {});
};

export default cloudinary;