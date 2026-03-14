/**
 * Seed mock properties into the database
 * This ensures mock properties (with UUID IDs) exist in the database,
 * satisfying foreign key constraints when creating conversations
 */

const mockProperties = require('../data/mockProperties');
const { createLogger } = require('../config/logger');
const { v4: uuidv4 } = require('uuid');

const logger = createLogger('SeedMockProperties');

const MOCK_VENDOR_ID = '550e8400-e29b-41d4-a716-446655440001';

async function seedMockProperties(db) {
  if (!db || !db.Property) {
    logger.warn('Database not available for seeding');
    return false;
  }

  try {
    // First, ensure the mock vendor user exists
    if (db.User) {
      const vendorExists = await db.User.findByPk(MOCK_VENDOR_ID);
      if (!vendorExists) {
        logger.info(`Creating mock vendor user (${MOCK_VENDOR_ID})...`);
        await db.User.create({
          id: MOCK_VENDOR_ID,
          firstName: 'Mock',
          lastName: 'Vendor',
          email: 'mock.vendor@propertyark.com',
          password: '$2a$10$abcdefghijklmnopqrstuvwxyz', // Dummy bcrypt hash
          role: 'vendor',
          roles: ['vendor'],
          isVerified: true,
          isActive: true
        }).catch(err => {
          if (err.name === 'SequelizeUniqueConstraintError') {
            logger.info('Mock vendor already exists');
          } else {
            throw err;
          }
        });
        logger.info('✓ Mock vendor created');
      } else {
        logger.info('✓ Mock vendor already exists');
      }
    }

    // Check if mock properties already exist
    const existingCount = await db.Property.count({
      where: {
        // Check for any of our known mock property IDs
        id: mockProperties.slice(0, 3).map(p => p.id)
      }
    });

    if (existingCount > 0) {
      logger.info(`✓ Mock properties already seeded (found ${existingCount} properties)`);
      return true;
    }

    logger.info(`Seeding ${mockProperties.length} mock properties into database...`);

    // Bulk create mock properties
    await db.Property.bulkCreate(mockProperties, { 
      ignoreDuplicates: true,
      updateOnDuplicate: ['title', 'description', 'details', 'price'] // Update if ID exists but data differs
    });

    logger.info(`✓ Successfully seeded ${mockProperties.length} mock properties`);
    return true;
  } catch (error) {
    logger.error('Failed to seed mock properties:', error.message);
    // Don't fail the app - just warn
    return false;
  }
}

module.exports = { seedMockProperties };
