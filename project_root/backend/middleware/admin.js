/**
 * Admin Authentication Middleware
 *
 * This middleware checks if the authenticated user has admin role.
 * It assumes the auth middleware has already run and req.user is available.
 *
 * @module middleware/admin
 */

const logger = require('../config/logger');

/**
 * Middleware to verify if user has admin privileges
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
const isAdmin = (req, res, next) => {
  try {
    // Check if user exists (authentication middleware should have set this)
    if (!req.user) {
      logger.warn('Admin access attempted without authentication');
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user has admin role
    if (req.user.role !== 'admin') {
      logger.warn(`Admin access denied for user: ${req.user.id} (${req.user.email}) - Path: ${req.originalUrl}`);
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Log successful admin access
    logger.info(`Admin access granted for user: ${req.user.id} (${req.user.email}) - Path: ${req.originalUrl}`);

    // User is admin, proceed to next middleware/route handler
    next();
  } catch (error) {
    logger.error(`Admin middleware error: ${error.message}`, {
      userId: req?.user?.id,
      path: req.originalUrl,
      error: error.stack
    });

    return res.status(500).json({ error: 'Server error during authorization check' });
  }
};

module.exports = {
  isAdmin
};

/**
 * Testing instructions:
 *
 * 1. To test admin restriction:
 *    a) Login with a non-admin user (role='user')
 *    b) Attempt to access an admin endpoint
 *    c) Should receive 403 Forbidden with message "Admin access required"
 *
 * 2. To test admin access:
 *    a) Login with an admin user (role='admin')
 *    b) Access the same admin endpoint
 *    c) Should proceed normally to the endpoint handler
 */
