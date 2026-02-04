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
    
    // Try to connect to PostgreSQL
    sequelize = config.sequelize;
    db = config.db;

    try {
      await sequelize.authenticate();
      console.log('✅ PostgreSQL database connection established');
      
      // Sync models (create tables if they don't exist)
      await sequelize.sync({ alter: false });
      console.log('✅ Database models synchronized');

      return {
        sequelize,
        db,
        isConnected: true,
        error: null
      };
    } catch (connectionError) {
      console.warn('⚠️ Could not connect to PostgreSQL:', connectionError.message);
      console.log('Backend will continue with Firestore for now.');
      return {
        sequelize: null,
        db: null,
        isConnected: false,
        error: connectionError.message
      };
    }
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
