const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../config/logger');

/**
 * Health check endpoint
 * Returns the system status, uptime, and application version
 * @route GET /health
 * @returns {Object} 200 - System health information
 * @returns {Error} 500 - Server error
 */
router.get('/', async (req, res) => {
  try {
    // Calculate system uptime in seconds
    const uptime = process.uptime();

    // Get application version from package.json
    let version = 'unknown';
    try {
      const packageJson = await fs.readFile(path.join(process.cwd(), 'package.json'), 'utf8');
      const packageData = JSON.parse(packageJson);
      version = packageData.version || 'unknown';
    } catch (err) {
      logger.error('Failed to read package.json:', err);
      // Continue with unknown version if package.json can't be read
    }

    // Return health data
    res.status(200).json({
      status: 'ok',
      uptime: uptime,
      version: version
    });
  } catch (err) {
    logger.error('Health check endpoint error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system health information'
    });
  }
});

// Export the router for use in the main application
module.exports = router;
