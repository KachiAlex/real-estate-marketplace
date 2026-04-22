module.exports = async () => {
  try {
    const db = require('../config/sequelizeDb');
    if (db && db.sequelize && typeof db.sequelize.close === 'function') {
      await db.sequelize.close();
      // eslint-disable-next-line no-console
      console.log('Jest global teardown: Sequelize connection closed');
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Jest global teardown warning:', error && error.message ? error.message : error);
  }
};
