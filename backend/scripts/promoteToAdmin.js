const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const db = require('../config/sequelizeDb');

async function promote(emailOrId) {
  await db.sequelize.authenticate();
  let user = null;
  if (emailOrId.includes('@')) {
    user = await db.User.findOne({ where: { email: emailOrId.toLowerCase() } });
  } else {
    user = await db.User.findByPk(emailOrId);
  }

  if (!user) {
    console.error('User not found:', emailOrId);
    await db.sequelize.close();
    process.exit(2);
  }

  const u = user.toJSON();
  const roles = Array.isArray(u.roles) ? new Set(u.roles) : new Set(['user']);
  roles.add('admin');

  user.role = 'admin';
  user.roles = Array.from(roles);
  user.activeRole = 'admin';
  user.updatedAt = new Date();

  await user.save();
  console.log('Promoted user to admin:', user.email || user.id);
  console.log('New roles:', user.roles);

  try { await db.sequelize.close(); } catch (e) {}
}

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node backend/scripts/promoteToAdmin.js <email|id>');
  process.exit(1);
}

promote(arg).catch(err => { console.error('Error:', err.message || err); process.exit(1); });
