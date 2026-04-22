const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const db = require('../config/sequelizeDb');

async function inspectEmails(emails) {
  try {
    await db.sequelize.authenticate();
  } catch (e) {
    console.error('DB auth failed:', e.message || e);
    process.exit(2);
  }

  for (const email of emails) {
    try {
      const user = await db.User.findOne({ where: { email: email.toLowerCase() } });
      if (!user) {
        console.log(`User not found: ${email}`);
        continue;
      }
      const u = user.toJSON();
      // Only print non-sensitive-ish fields; show password hash length
      console.log('---', email, '---');
      console.log('id:', u.id);
      console.log('email:', u.email);
      console.log('role:', u.role);
      console.log('roles:', u.roles);
      console.log('passwordHashPresent:', !!u.password);
      console.log('passwordHashPreview:', u.password ? `${u.password.slice(0,8)}...len(${u.password.length})` : null);
      console.log('vendorData:', u.vendorData ? JSON.stringify(u.vendorData) : null);
    } catch (err) {
      console.error('Error inspecting', email, err.message || err);
    }
  }
  // close connection
  try { await db.sequelize.close(); } catch(e){}
}

const emails = process.argv.slice(2);
if (!emails.length) {
  console.error('Usage: node backend/scripts/inspectUsers.js admin@propertyark.com onyedika.akoma@gmail.com');
  process.exit(1);
}

inspectEmails(emails).catch(err => { console.error(err); process.exit(1); });
