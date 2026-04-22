const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const db = require('../config/sequelizeDb');

function normalizeEmail(e) {
  if (!e) return e;
  return String(e).trim().toLowerCase();
}

async function detectVendorColumn() {
  try {
    const cols = await db.sequelize.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`, { type: db.sequelize.QueryTypes.SELECT });
    const names = cols.map(c => String(c.column_name));
    const found = names.find(n => n.toLowerCase().includes('vendor')) || null;
    return found;
  } catch (e) {
    return null;
  }
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
    const emails = parseListArg(argv.emails || argv.e || argv._ && argv._.join(','));
    if (!emails || emails.length === 0) {
      console.log('Usage: node inspectVendorData.js --emails "a@x.com,b@x.com"');
      process.exit(0);
    }

    const vendorCol = await detectVendorColumn();
    const vendorSelect = vendorCol ? `, "${vendorCol}" as vendorData, "${vendorCol}"::text as vendorDataText` : ', NULL as vendorData, NULL as vendorDataText';

    for (const raw of emails) {
      const email = normalizeEmail(raw);
      const rows = await db.sequelize.query(`SELECT id, email, role ${vendorSelect} FROM users WHERE lower(email) = :email LIMIT 1`, { replacements: { email }, type: db.sequelize.QueryTypes.SELECT });
      if (!rows || rows.length === 0) {
        console.log(`${email}: not found`);
        continue;
      }
      const r = rows[0];
      let vd = r.vendorData;
      let vdText = r.vendorDataText;
      try { if (typeof vd === 'string') vd = JSON.parse(vd); } catch (e) {}
      console.log('---');
      console.log(`email: ${r.email}`);
      console.log(`role: ${r.role}`);
      console.log('vendorData (parsed):');
      console.log(JSON.stringify(vd, null, 2));
      console.log('vendorData (raw text):');
      console.log(vdText);
    }

    process.exit(0);
  } catch (err) {
    console.error('Error:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
