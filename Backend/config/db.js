const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Database Connection Configuration
 * 
 * IMPORTANT: This application ALWAYS connects to the 'wildlankago' database
 * - All existing data is stored in the 'wildlankago' database
 * - NO test databases should be created
 * - The connection string is automatically modified to ensure 'wildlankago' database is used
 * - This preserves all existing donation, booking, event, and user data
 */
const connectDB = async () => {
  try {
    // Check for both MONGO_URI and MONGODB_URI
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB connection string not found. Please set MONGO_URI or MONGODB_URI in your .env file');
    }

    // Ensure database name is 'wildlankago' - DO NOT CREATE TEST DATABASES
    let connectionString = mongoUri;
    
    // Force wildlankago database name - preserve existing data
    if (!mongoUri.includes('/wildlankago')) {
      if (!mongoUri.includes('?')) {
        // Case: mongodb://host/other_db or mongodb://host/
        connectionString = mongoUri.replace(/\/[^\/]*$/, '/wildlankago').replace(/\/$/, '/wildlankago');
      } else {
        // Case: mongodb://host/other_db?params or mongodb://host/?params
        connectionString = mongoUri.replace(/\/[^\/\?]*\?/, '/wildlankago?').replace(/\/\?/, '/wildlankago?');
      }
      
      logger.info('Database name enforced to "wildlankago" to preserve existing data');
    }
    
    // Validate that we're using the correct database
    if (!connectionString.includes('/wildlankago')) {
      throw new Error('Database configuration error: Must use "wildlankago" database to preserve existing data. Current connection string does not specify wildlankago database.');
    }
    
    logger.info('Connecting to wildlankago database (existing data preserved)');

    const conn = await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 30000, // 30 seconds
      socketTimeoutMS: 45000, // 45 seconds
      bufferCommands: false,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    logger.info(`Database: ${conn.connection.name} (preserving existing data)`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      // Don't exit the process, just log the error
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected - attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });

    // Handle connection close
    mongoose.connection.on('close', () => {
      logger.warn('MongoDB connection closed');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        logger.error('Error during MongoDB connection close:', err);
        process.exit(1);
      }
    });

    return conn;
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    
    // In development, don't exit immediately - allow for retries
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      logger.warn('Development mode: Continuing without database connection');
      logger.warn('Please check your MONGO_URI in .env file');
      logger.warn('The server will continue running but database operations may fail');
      
      // Set up automatic reconnection attempts
      const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
      if (mongoUri) {
        let connectionString = mongoUri;
        
        // Ensure database name is 'wildlankago' for reconnection attempts
        if (!mongoUri.includes('/wildlankago')) {
          if (!mongoUri.includes('?')) {
            connectionString = mongoUri.replace(/\/[^\/]*$/, '/wildlankago').replace(/\/$/, '/wildlankago');
          } else {
            connectionString = mongoUri.replace(/\/[^\/\?]*\?/, '/wildlankago?').replace(/\/\?/, '/wildlankago?');
          }
        }
        
        const reconnectInterval = setInterval(async () => {
          try {
            logger.info('Attempting to reconnect to database...');
            await mongoose.connect(connectionString, {
              serverSelectionTimeoutMS: 10000,
              socketTimeoutMS: 15000,
              bufferCommands: false,
              maxPoolSize: 10,
              retryWrites: true,
              retryReads: true
            });
            logger.info('Database reconnected successfully!');
            clearInterval(reconnectInterval);
          } catch (reconnectError) {
            logger.warn('Reconnection attempt failed:', reconnectError.message);
          }
        }, 30000); // Try every 30 seconds
      } else {
        logger.error('No MongoDB URI found in environment variables');
      }
      
      return null;
    } else {
      logger.error('Database connection failed in production mode');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
