const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const db = require('../config/sequelizeDb');

function normalizeEmail(e) { return String(e || '').trim().toLowerCase(); }
function parseListArg(val) { if (!val) return []; return String(val).split(',').map(s => s.trim()).filter(Boolean); }

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('DB connected');
    const argv = require('minimist')(process.argv.slice(2));
    const emails = parseListArg(argv.emails || argv.e || (argv._ && argv._.join(',')));
    if (!emails || emails.length === 0) { console.log('Usage: node checkRolesForEmails.js --emails "a@x.com,b@x.com"'); process.exit(0); }

    for (const raw of emails) {
      const email = normalizeEmail(raw);
      // Detect if activeRole column exists in this schema
      const cols = await db.sequelize.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`, { type: db.sequelize.QueryTypes.SELECT });
      const names = cols.map(c => String(c.column_name).toLowerCase());
      const hasActiveRole = names.includes('activerole') || names.includes('activeRole'.toLowerCase());
      const activeSelect = hasActiveRole ? ', "activeRole"' : '';
      const rows = await db.sequelize.query(
        `SELECT id, email, role, roles::text as roles_text${activeSelect}, "vendorData"::text as vendorDataText FROM users WHERE lower(email) = :email LIMIT 1`,
        { replacements: { email }, type: db.sequelize.QueryTypes.SELECT }
      );
      if (!rows || rows.length === 0) {
        console.log(`${email}: not found`);
        continue;
      }
      const r = rows[0];
      let rolesParsed = r.roles_text;
      try { if (typeof rolesParsed === 'string') rolesParsed = JSON.parse(rolesParsed); } catch (e) {}
      console.log('---');
      console.log(`email: ${r.email}`);
      console.log(`role: ${r.role}`);
      console.log(`roles (raw): ${r.roles_text}`);
      console.log(`roles (parsed): ${Array.isArray(rolesParsed) ? rolesParsed.join(', ') : rolesParsed}`);
      console.log(`activeRole: ${r.activerole || r.activeRole}`);
      console.log('vendorData (raw):');
      console.log(r.vendordatatext || r.vendorDataText || 'null');
    }

    process.exit(0);
  } catch (e) {
    console.error('Error:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
