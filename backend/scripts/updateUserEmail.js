const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const db = require('../config/sequelizeDb');

function normalizeEmail(e) { return String(e || '').trim().toLowerCase(); }

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('DB connected');
    const argv = require('minimist')(process.argv.slice(2));
    const from = normalizeEmail(argv.from || argv.f || argv._ && argv._[0]);
    const to = normalizeEmail(argv.to || argv.t || argv._ && argv._[1]);
    if (!from || !to) { console.log('Usage: node updateUserEmail.js --from old@x.com --to new@x.com'); process.exit(0); }

    // Check target email conflict
    const conflict = await db.sequelize.query(`SELECT id, email FROM users WHERE lower(email) = :to LIMIT 1`, { replacements: { to }, type: db.sequelize.QueryTypes.SELECT });
    if (conflict && conflict.length) {
      console.error(`Target email ${to} already exists (id=${conflict[0].id}). Aborting.`);
      process.exit(2);
    }

    const rows = await db.sequelize.query(`SELECT id, email, "vendorData"::text as vendorText FROM users WHERE lower(email) = :from LIMIT 1`, { replacements: { from }, type: db.sequelize.QueryTypes.SELECT });
    if (!rows || rows.length === 0) {
      console.error(`Source email ${from} not found.`);
      process.exit(1);
    }
    const user = rows[0];

    // Prepare new vendorData if exists
    let vendorObj = null;
    try { if (user.vendortext) vendorObj = JSON.parse(user.vendortext); } catch (e) { vendorObj = null; }
    if (vendorObj && vendorObj.contactInfo) vendorObj.contactInfo.email = to;

    // Perform update
    if (vendorObj) {
      await db.sequelize.query(`UPDATE users SET email = :to, "vendorData" = :vd::json WHERE id = :id`, { replacements: { to, vd: JSON.stringify(vendorObj), id: user.id }, type: db.sequelize.QueryTypes.UPDATE });
    } else {
      await db.sequelize.query(`UPDATE users SET email = :to WHERE id = :id`, { replacements: { to, id: user.id }, type: db.sequelize.QueryTypes.UPDATE });
    }

    console.log(`Updated user id=${user.id} email: ${user.email} -> ${to}`);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
