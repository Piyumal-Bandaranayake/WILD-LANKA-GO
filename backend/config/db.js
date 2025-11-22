const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Database Connection Configuration for Vercel Serverless
 * 
 * Uses connection caching to avoid reconnecting on every serverless request.
 * Always connects to the 'wildlankago' database.
 */

// Cache the database connection
let cachedConnection = null;

const connectDB = async () => {
  // Return cached connection if available
  if (cachedConnection && mongoose.connection.readyState === 1) {
    logger.info('Using cached database connection');
    return cachedConnection;
  }

  try {
    // Use MONGODB_URI (Vercel standard) or fallback to MONGO_URI
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB connection string not found. Please set MONGODB_URI in your environment variables');
    }

    // Ensure database name is 'wildlankago'
    let connectionString = mongoUri;
    
    if (!mongoUri.includes('/wildlankago')) {
      if (!mongoUri.includes('?')) {
        connectionString = mongoUri.replace(/\/[^\/]*$/, '/wildlankago').replace(/\/$/, '/wildlankago');
      } else {
        connectionString = mongoUri.replace(/\/[^\/\?]*\?/, '/wildlankago?').replace(/\/\?/, '/wildlankago?');
      }
      logger.info('Database name enforced to "wildlankago"');
    }
    
    if (!connectionString.includes('/wildlankago')) {
      throw new Error('Database configuration error: Must use "wildlankago" database');
    }
    
    logger.info('Connecting to wildlankago database...');

    // Connect with serverless-optimized settings
    const conn = await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 10000, // Shorter timeout for serverless
      socketTimeoutMS: 45000,
      bufferCommands: false, // Don't buffer commands, fail fast
      maxPoolSize: 1, // Single connection for serverless
      minPoolSize: 0, // Allow connection to close
      maxIdleTimeMS: 10000, // Close idle connections after 10s
      retryWrites: true,
      retryReads: true,
    });

    cachedConnection = conn;
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      cachedConnection = null; // Clear cache on error
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      cachedConnection = null; // Clear cache on disconnect
    });

    return conn;
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    cachedConnection = null;
    
    // In development, log error but don't exit
    if (process.env.NODE_ENV === 'development') {
      logger.warn('Development mode: Continuing without database connection');
      return null;
    }
    
    throw error; // Let serverless function fail with proper error
  }
};

module.exports = connectDB;
