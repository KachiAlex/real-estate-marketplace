/**
 * PostgreSQL Setup Module
 * Handles connection setup with graceful fallback if modules aren't available
 */

let sequelize = null;
let db = null;
const isModuleAvailable = (moduleName) => {
  try {
    require.resolve(moduleName);
    return true;
  } catch (e) {
    return false;
  }
};

const initializeDatabase = async () => {
  try {
    // Check if sequelize is available
    if (!isModuleAvailable('sequelize')) {
      console.warn('⚠️ Sequelize module not found. Database features will be limited.');
      console.log('To enable PostgreSQL support, run: npm install sequelize pg pg-hstore');
      return {
        sequelize: null,
        db: null,
        isConnected: false,
        error: 'Sequelize module not installed'
      };
    }

    // Import Sequelize if available
    const Sequelize = require('sequelize');
    const config = require('./sequelizeDb');

    // Use the existing sequelize instance and models
    sequelize = config.sequelize;
    db = config.db;

    // Bounded retry with exponential backoff; optionally fail-fast in non-dev
    const MAX_RETRIES = Number(process.env.DB_CONNECT_RETRIES || 8);
    const RETRY_BASE_MS = Number(process.env.DB_RETRY_BASE_MS || 1000);
    let attempt = 0;

    while (attempt < MAX_RETRIES) {
      try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL database connection established');

        // Sync models (create tables if they don't exist)
        try {
          await sequelize.sync({ alter: false });
          console.log('✅ Database models synchronized');
        } catch (syncErr) {
          console.warn('Database connected but model sync failed:', syncErr.message);
        }

        return {
          sequelize,
          db,
          isConnected: true,
          error: null
        };
      } catch (connectionError) {
        attempt += 1;
        const wait = RETRY_BASE_MS * Math.pow(2, attempt - 1);
        console.warn(`Postgres connect attempt ${attempt}/${MAX_RETRIES} failed: ${connectionError.message}. Retrying in ${wait}ms...`);
        // Wait before next attempt
        await new Promise((res) => setTimeout(res, wait));
      }
    }

    // If we reach here, all retries failed
    const failFast = process.env.FAIL_ON_DB === 'true' || process.env.NODE_ENV === 'production' && process.env.FAIL_ON_DB !== 'false';
    const errMessage = `Could not connect to PostgreSQL after ${MAX_RETRIES} attempts`;
    console.error('⚠️', errMessage);

    if (failFast) {
      // In production with fail-fast enabled, surface error so process manager restarts the service
      throw new Error(errMessage);
    }

    // Otherwise return gracefully so the backend can continue using fallback storages
    console.log('Continuing without PostgreSQL (falling back to Firestore/local JSON).');
    return {
      sequelize: null,
      db: null,
      isConnected: false,
      error: errMessage
    };
  } catch (error) {
    console.error('❌ Error initializing PostgreSQL:', error.message);
    return {
      sequelize: null,
      db: null,
      isConnected: false,
      error: error.message
    };
  }
};

// Export configuration
module.exports = {
  initializeDatabase,
  isModuleAvailable,
  getSequelize: () => sequelize,
  getDb: () => db
};
