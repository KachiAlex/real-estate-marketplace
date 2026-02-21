const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const db = require('../config/sequelizeDb');

const email = process.argv[2];
if (!email) {
  console.error('Usage: node checkUserRole.js <email>');
  process.exit(2);
}

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('DB connection ok');
    // Limit selected attributes to a safe subset to avoid errors when the
    // database schema is out-of-sync with the model (missing columns).
    const user = await db.User.findOne({ 
      where: { email },
      attributes: ['id', 'email', 'firstName', 'lastName', 'role', 'roles', 'vendorData']
    });
    if (!user) {
      console.log(`No user found with email=${email}`);
      process.exit(0);
    }
    console.log('User:', {
      id: user.id,
      email: user.email,
      role: user.role,
      roles: user.roles,
      vendorData: user.vendorData || null,
      onboardingComplete: user.onboardingComplete || (user.vendorData && user.vendorData.onboardingComplete)
    });
    process.exit(0);
  } catch (err) {
    console.error('Error querying DB:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
