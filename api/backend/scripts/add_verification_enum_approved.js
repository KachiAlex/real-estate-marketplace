const db = require('../config/sequelizeDb');
const { sequelize } = db;

async function addValue() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    // Add 'approved' to verificationStatus enum if missing
    try {
      await sequelize.query("ALTER TYPE \"enum_properties_verificationStatus\" ADD VALUE IF NOT EXISTS 'approved';");
      console.log("Ensured enum value 'approved' exists for enum_properties_verificationStatus");
    } catch (e) {
      console.error('Failed to alter enum type:', e.message || e);
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('DB connect failed:', err.message || err);
    process.exit(1);
  }
}

addValue();
