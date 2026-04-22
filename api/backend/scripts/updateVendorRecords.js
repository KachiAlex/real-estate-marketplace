const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const db = require('../config/sequelizeDb');

function normalizeEmail(e) {
  if (!e) return e;
  return String(e).trim().toLowerCase();
}

function localPartNoDots(email) {
  const parts = String(email).split('@');
  if (parts.length !== 2) return email;
  return `${parts[0].replace(/\./g, '')}@${parts[1]}`.toLowerCase();
}

async function findUserByEmailAny(email) {
  const norm = normalizeEmail(email);
  // Use raw SQL to avoid Sequelize model/column mismatches across environments
  const vendorCol = await detectVendorColumn();
  const vendorSelect = vendorCol ? `, "${vendorCol}" as vendorData` : ', NULL as vendorData';
  const rows = await db.sequelize.query(
    `SELECT id, email, role ${vendorSelect} FROM users WHERE lower(email) = :email LIMIT 1`,
    { replacements: { email: norm }, type: db.sequelize.QueryTypes.SELECT }
  );
  if (rows && rows.length) return rows[0];

  const alt = localPartNoDots(norm);
  const rows2 = await db.sequelize.query(
    `SELECT id, email, role ${vendorSelect} FROM users WHERE lower(email) = :email LIMIT 1`,
    { replacements: { email: alt }, type: db.sequelize.QueryTypes.SELECT }
  );
  return rows2 && rows2.length ? rows2[0] : null;
}

let _detectedVendorCol = null;
let _detectedColumns = null;
async function detectVendorColumn() {
  if (_detectedVendorCol !== null) return _detectedVendorCol;
  try {
    const cols = await db.sequelize.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`, { type: db.sequelize.QueryTypes.SELECT });
    const names = cols.map(c => String(c.column_name));
    _detectedColumns = new Set(names.map(n => n.toLowerCase()));
    const found = names.find(n => n.toLowerCase().includes('vendor')) || null;
    _detectedVendorCol = found;
    return _detectedVendorCol;
  } catch (e) {
    _detectedVendorCol = null;
    return null;
  }
}

async function detectColumnsSet() {
  if (_detectedColumns) return _detectedColumns;
  await detectVendorColumn();
  return _detectedColumns || new Set();
}

async function clearVendorRole(email) {
  const user = await findUserByEmailAny(email);
  if (!user) {
    console.log(`No user found for '${email}'`);
    return { email, found: false };
  }

  const colSet = await detectColumnsSet();
  const updates = [];
  const replacements = { id: user.id };

  // role always present in our schema
  updates.push(`role = 'user'`);

  if (colSet.has('roles')) {
    updates.push(`roles = :roles::json`);
    replacements.roles = JSON.stringify(['user']);
  }

  if (colSet.has('vendordata') || colSet.has('vendor_data') || colSet.has('vendordata')) {
    updates.push(`"${await detectVendorColumn()}" = :vendorData::json`);
    replacements.vendorData = JSON.stringify({});
  }

  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = :id`;
  await db.sequelize.query(sql, { replacements });

  console.log(`Cleared vendor role for ${user.email}`);
  return { email: user.email, found: true };
}

async function markOnboarded(email) {
  const user = await findUserByEmailAny(email);
  if (!user) {
    console.log(`No user found for '${email}'`);
    return { email, found: false };
  }

  let existing = user.vendorData || {};
  try {
    if (typeof existing === 'string') existing = JSON.parse(existing);
  } catch (e) {
    existing = {};
  }

  const newVendorData = Object.assign({}, existing, { onboardingComplete: true, updatedAt: new Date() });

  const colSet = await detectColumnsSet();
  const updates = [];
  const replacements = { id: user.id };

  updates.push(`role = 'vendor'`);
  if (colSet.has('roles')) {
    updates.push(`roles = :roles::json`);
    replacements.roles = JSON.stringify(['vendor']);
  }
  if (colSet.has('vendordata') || colSet.has('vendor_data') || colSet.has('vendordata')) {
    updates.push(`"${await detectVendorColumn()}" = :vendorData::json`);
    replacements.vendorData = JSON.stringify(newVendorData);
  }

  const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = :id`;
  await db.sequelize.query(sql, { replacements });

  console.log(`Marked onboardingComplete for ${user.email}`);
  return { email: user.email, found: true };
}

function parseListArg(val) {
  if (!val) return [];
  return String(val).split(',').map(s => s.trim()).filter(Boolean);
}

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('DB connected');

    const argv = require('minimist')(process.argv.slice(2));
    const clearList = parseListArg(argv.clear || argv.c);
    const onboardList = parseListArg(argv.onboard || argv.o);

    if (clearList.length === 0 && onboardList.length === 0) {
      console.log('Usage: node updateVendorRecords.js --clear "a@x.com,b@x.com" --onboard "c@x.com"');
      process.exit(0);
    }

    for (const e of clearList) {
      await clearVendorRole(e);
    }

    for (const e of onboardList) {
      await markOnboarded(e);
    }

    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
