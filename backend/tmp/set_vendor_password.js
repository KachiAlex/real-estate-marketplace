const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const db = require('../config/sequelizeDb');

async function run() {
  await db.sequelize.authenticate();
  const email = 'mock.vendor@example.com';
  const user = await db.User.findOne({ where: { email } });
  if (!user) { console.error('User not found'); process.exit(2); }
  const hash = await bcrypt.hash('password', 10);
  user.password = hash;
  await user.save();
  console.log('Updated password for', email);
  process.exit(0);
}
run().catch(e=>{ console.error(e); process.exit(1); });
