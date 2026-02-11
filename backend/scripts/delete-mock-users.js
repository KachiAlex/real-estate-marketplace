const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env.backend') });
require('dotenv').config();
const db = require('../config/sequelizeDb');

// Emails from backend/data/mockUsers.js (admin@propertyark.com will be excluded)
const mockEmails = [
  'adebayo.oluwaseun@gmail.com',
  'chioma.nwosu@yahoo.com',
  'emmanuel.adeyemi@hotmail.com',
  'fatima.ibrahim@gmail.com',
  'oluwaseun.akoma@gmail.com',
  'blessing.okafor@outlook.com',
  'ibrahim.musa@gmail.com',
  'grace.eze@yahoo.com',
  'kemi.adebayo@gmail.com',
  'tunde.ogunlana@hotmail.com',
  'onyedika.akoma@gmail.com',
  'emeka.okafor@lagosagents.com',
  'fatima.ibrahim@abujaagents.com',
  'chidi.nwankwo@riversagents.com',
  'aisha.mohammed@propertyowner.com'
];

async function run() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ DB authenticated');

    const found = await db.User.findAll({ where: { email: mockEmails } });
    console.log(`Found ${found.length} matching users:`);
    found.forEach(u => console.log(' -', u.email, `(${u.id})`));

    if (found.length === 0) {
      console.log('No mock users to delete.');
      process.exit(0);
    }

    // Confirmed by user; proceed to delete
    const delCount = await db.User.destroy({ where: { email: mockEmails } });
    console.log(`Deleted ${delCount} users.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(2);
  }
}

run();
