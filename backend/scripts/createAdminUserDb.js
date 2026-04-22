const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const db = require('../config/sequelizeDb');
const bcrypt = require('bcryptjs');

async function createAdmin(email, password) {
  await db.sequelize.authenticate();
  const lower = email.toLowerCase();
  let user = await db.User.findOne({ where: { email: lower } });
  const hash = await bcrypt.hash(password, 10);
  if (user) {
    user.password = hash;
    user.role = 'admin';
    user.roles = Array.isArray(user.roles) ? Array.from(new Set([...user.roles, 'admin'])) : ['user','admin'];
    user.activeRole = 'admin';
    await user.save();
    console.log('Updated existing user to admin:', lower, user.id);
  } else {
    user = await db.User.create({
      email: lower,
      password: hash,
      firstName: 'Smoke',
      lastName: 'Admin',
      role: 'admin',
      roles: ['user','admin'],
      activeRole: 'admin',
      isVerified: true,
      isActive: true
    });
    console.log('Created admin user:', lower, user.id);
  }
  try { await db.sequelize.close(); } catch(e){}
}

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.error('Usage: node backend/scripts/createAdminUserDb.js <email> <password>');
  process.exit(1);
}

createAdmin(email, password).catch(err => { console.error(err); process.exit(1); });
