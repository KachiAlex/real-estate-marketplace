const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const db = require('../config/sequelizeDb');

function normalizeEmail(e) { return String(e || '').trim().toLowerCase(); }

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('DB connected');
    const argv = require('minimist')(process.argv.slice(2));
    const email = normalizeEmail(argv.email || argv.e);
    if (!email) { console.log('Usage: node setVendorOnboardCheck.js --email a@x.com'); process.exit(0); }

    const vendorColRows = await db.sequelize.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`, { type: db.sequelize.QueryTypes.SELECT });
    const names = vendorColRows.map(c => String(c.column_name));
    const vendorCol = names.find(n => n.toLowerCase().includes('vendor')) || 'vendorData';

    const updSql = `UPDATE users SET "${vendorCol}" = :vd::json WHERE lower(email) = :email RETURNING id`;
    const vd = JSON.stringify({ onboardingComplete: true, updatedAt: new Date() });
    const up = await db.sequelize.query(updSql, { replacements: { vd, email }, type: db.sequelize.QueryTypes.UPDATE });
    console.log('UPDATE result (raw):', up);

    const selSql = `SELECT "${vendorCol}"::text as vendorText FROM users WHERE lower(email) = :email LIMIT 1`;
    const rows = await db.sequelize.query(selSql, { replacements: { email }, type: db.sequelize.QueryTypes.SELECT });
    console.log('SELECT result:', rows);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
