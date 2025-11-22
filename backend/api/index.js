/**
 * Vercel Serverless Function Handler
 * 
 * This file is the entry point for Vercel deployment.
 * It wraps the Express app and exports a handler function.
 */

const app = require('../server');

// Export the serverless handler
module.exports = async (req, res) => {
  // Handle the request with Express
  return app(req, res);
};
