import express from 'express';
import logger from '../../utils/logger.js';
import { dashboardAccessLogger, apiErrorLogger } from '../../middleware/dashboardLoggingMiddleware.js';

const router = express.Router();

/**
 * Route for frontend to send error logs
 * Allows client-side errors to be logged on the server
 */
router.post('/errors', (req, res) => {
  const { error, context, userInfo } = req.body;
  
  try {
    // Validate required fields
    if (!error || !error.message) {
      return res.status(400).json({ 
        message: 'Error message is required',
        received: req.body 
      });
    }

    // Log the frontend error
    logger.systemError('Frontend error reported', {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        status: error.status
      },
      context: {
        ...context,
        userAgent: req.get('User-Agent'),
        clientIP: req.ip,
        timestamp: new Date().toISOString()
      },
      user: {
        id: userInfo?.id,
        email: userInfo?.email,
        role: userInfo?.role
      }
    });

    res.json({ 
      message: 'Error logged successfully',
      logId: Date.now().toString()
    });
  } catch (logError) {
    console.error('Failed to log frontend error:', logError);
    res.status(500).json({ 
      message: 'Failed to log error',
      error: logError.message 
    });
  }
});

/**
 * Route for logging dashboard access events
 */
router.post('/dashboard-access', (req, res) => {
  const { dashboardType, action, metadata } = req.body;
  const user = req.user || req.auth?.payload;
  
  try {
    logger.dashboardAccess(`Dashboard ${action}: ${dashboardType}`, {
      dashboardType,
      action,
      userId: user?.sub || user?._id,
      userRole: user?.role,
      userEmail: user?.email,
      clientIP: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      ...metadata
    });

    res.json({ message: 'Dashboard access logged' });
  } catch (error) {
    console.error('Failed to log dashboard access:', error);
    res.status(500).json({ 
      message: 'Failed to log dashboard access',
      error: error.message 
    });
  }
});

/**
 * Route for getting error statistics (admin only)
 */
router.get('/stats', (req, res) => {
  // This would typically require admin authentication
  // For now, just return a placeholder response
  
  try {
    // In a real implementation, you would query your log files or database
    const stats = {
      totalErrors: 0,
      errorsByCategory: {
        AUTH: 0,
        DASHBOARD: 0,
        API: 0,
        SYSTEM: 0
      },
      errorsByTimeframe: {
        last24Hours: 0,
        lastWeek: 0,
        lastMonth: 0
      },
      topErrors: [],
      dashboardAccess: {
        totalAccesses: 0,
        accessesByRole: {},
        accessesByDashboard: {}
      }
    };

    logger.systemInfo('Error statistics requested', {
      requestedBy: req.user?.email || 'unknown',
      clientIP: req.ip
    });

    res.json(stats);
  } catch (error) {
    logger.systemError('Failed to generate error statistics', {
      error: error.message,
      requestedBy: req.user?.email || 'unknown'
    });
    
    res.status(500).json({ 
      message: 'Failed to generate statistics',
      error: error.message 
    });
  }
});

/**
 * Route for getting recent logs (admin only)
 */
router.get('/recent', (req, res) => {
  const { category, limit = 50, level } = req.query;
  
  try {
    // In a real implementation, you would read from log files or database
    // For now, return a placeholder response
    
    logger.systemInfo('Recent logs requested', {
      category,
      limit,
      level,
      requestedBy: req.user?.email || 'unknown',
      clientIP: req.ip
    });

    const logs = []; // Would be populated from actual log storage

    res.json({
      logs,
      total: logs.length,
      filters: { category, limit, level }
    });
  } catch (error) {
    logger.systemError('Failed to fetch recent logs', {
      error: error.message,
      requestedBy: req.user?.email || 'unknown'
    });
    
    res.status(500).json({ 
      message: 'Failed to fetch logs',
      error: error.message 
    });
  }
});

export default router;