/**
 * Vercel Serverless Function Handler
 * 
 * This file is the entry point for Vercel deployment.
 * It wraps the Express app and exports a handler function.
 */

const connectDB = require('../config/db');

let app;

// Export the serverless handler
module.exports = async (req, res) => {
  try {
    // Ensure database is connected (uses cached connection)
    await connectDB();
    
    // Lazy load the Express app to avoid circular issues
    if (!app) {
      app = require('../server');
    }
    
    // Handle the request with Express
    return app(req, res);
  } catch (error) {
    console.error('Serverless function error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
