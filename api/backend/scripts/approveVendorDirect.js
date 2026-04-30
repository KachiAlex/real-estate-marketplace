const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });
const db = require('../config/sequelizeDb');

async function approveVendorById(id) {
  await db.sequelize.authenticate();
  const user = await db.User.findByPk(id);
  if (!user) {
    console.error('User not found by id:', id);
    await db.sequelize.close();
    process.exit(2);
  }

  const u = user.toJSON();
  const vendorData = u.vendorData && typeof u.vendorData === 'object' ? u.vendorData : {};
  vendorData.kycStatus = 'approved';
  vendorData.updatedAt = new Date().toISOString();

  user.vendorData = vendorData;
  user.role = 'vendor';
  user.roles = Array.isArray(u.roles) ? Array.from(new Set([...u.roles, 'vendor'])) : ['user','vendor'];
  user.activeRole = 'vendor';

  await user.save();
  console.log('Approved vendor id:', id);
  console.log('vendorData now:', JSON.stringify(user.vendorData));

  try { await db.sequelize.close(); } catch(e){}
}

const id = process.argv[2];
if (!id) {
  console.error('Usage: node backend/scripts/approveVendorDirect.js <user-id>');
  process.exit(1);
}

approveVendorById(id).catch(err => {
  console.error('Error approving vendor:', err.message || err);
  process.exit(1);
});
