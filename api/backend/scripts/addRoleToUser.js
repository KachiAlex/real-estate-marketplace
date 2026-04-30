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
    const roleToAdd = String(argv.add || argv.r || 'user').trim();
    if (!email || !roleToAdd) { console.log('Usage: node addRoleToUser.js --email a@x.com --add roleName'); process.exit(0); }

    const rows = await db.sequelize.query(`SELECT id, email, roles::text as roles_text FROM users WHERE lower(email) = :email LIMIT 1`, { replacements: { email }, type: db.sequelize.QueryTypes.SELECT });
    if (!rows || rows.length === 0) { console.log(`${email}: not found`); process.exit(0); }
    const r = rows[0];
    let roles = [];
    try { roles = r.roles_text ? JSON.parse(r.roles_text) : []; } catch (e) { roles = Array.isArray(r.roles) ? r.roles : []; }
    if (!Array.isArray(roles)) roles = [];
    if (!roles.includes(roleToAdd)) roles.push(roleToAdd);

    const sql = `UPDATE users SET roles = :roles::json WHERE id = :id RETURNING id`; 
    await db.sequelize.query(sql, { replacements: { roles: JSON.stringify(roles), id: r.id }, type: db.sequelize.QueryTypes.UPDATE });
    console.log(`Updated roles for ${r.email}: ${roles.join(', ')}`);
    process.exit(0);
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
