/**
 * Admin User Seed Script
 *
 * This script creates an initial admin user for system access.
 * Use this in development or when setting up a new environment.
 *
 * @module scripts/seeds/admins
 */

const mongoose = require('mongoose');
const User = require('../../backend/models/User');
const config = require('../../backend/config/database');
const logger = require('../../backend/config/logger');

/**
 * Creates an admin user in the database
 *
 * @returns {Promise<void>} Resolves when seeding is complete
 */
async function seedAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    logger.info('Connected to database for admin user seeding');

    // Define admin user data
    const adminUser = {
      email: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'Admin123!', // Should be changed in production
      role: 'admin'
    };

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminUser.email });

    if (existingAdmin) {
      logger.info(`Admin user ${adminUser.email} already exists`);
    } else {
      // Create new admin user
      const user = new User(adminUser);
      await user.save();
      logger.info(`Admin user created: ${adminUser.email}`);
    }

    // Disconnect from database
    await mongoose.disconnect();
    logger.info('Database connection closed');

  } catch (error) {
    logger.error(`Error seeding admin user: ${error.message}`);
    process.exit(1);
  }
}

// Run the seeding function if script is executed directly
if (require.main === module) {
  seedAdminUser()
    .then(() => {
      console.log('Admin user seed completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}

module.exports = seedAdminUser;

/**
 * Usage instructions:
 *
 * 1. Run directly with Node:
 *    $ node scripts/seeds/admins.js
 *
 * 2. Set custom admin credentials via environment variables:
 *    $ ADMIN_EMAIL=customadmin@example.com ADMIN_PASSWORD=SecureP@ss123 node scripts/seeds/admins.js
 *
 * 3. Import in other scripts:
 *    const seedAdminUser = require('./scripts/seeds/admins');
 *    await seedAdminUser();
 */
