const path = require('path');
// Load environment from repo root .env.backend if present
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env.backend') });
require('dotenv').config();

const db = require('../config/sequelizeDb');

async function listUsers() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ DB authenticated');
    const users = await db.User.findAll({
      attributes: ['id','email','firstName','lastName','role','provider','isVerified','isActive','createdAt'],
      order: [['createdAt','DESC']],
      limit: 1000
    });
    console.log(JSON.stringify(users.map(u => u.toJSON()), null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Database error:', err && err.message ? err.message : err);
    if (err && err.stack) console.error(err.stack);
    process.exit(2);
  }
}

listUsers();
