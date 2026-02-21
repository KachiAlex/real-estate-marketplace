const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const db = require('../config/sequelizeDb');

(async () => {
  try {
    await db.sequelize.authenticate();
    console.log('DB connected');

    // Inspect table columns to find the JSON column that may contain vendorData
    const colsQuery = `SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`;
    const cols = await db.sequelize.query(colsQuery, { type: db.sequelize.QueryTypes.SELECT });
    const originalCols = Array.isArray(cols) ? cols.map(c => String(c.column_name)) : [];
    const columnNames = originalCols.map(c => c.toLowerCase());

    // Possible column name variants used in different deployments — pick any column containing 'vendor'
    const idx = columnNames.findIndex(c => c.includes('vendor'));
    const jsonColCandidate = idx >= 0 ? originalCols[idx] : null;

    let sql;
    if (jsonColCandidate) {
      // Use proper quoting for the column
      const col = jsonColCandidate;
      sql = `SELECT id, email, role, "${col}" as vendorData FROM users WHERE role = 'vendor' OR ("${col}"->>'onboardingComplete') = 'true'`;
    } else {
      // Fallback: only check role
      console.warn('Could not locate a vendor JSON column; falling back to role-only query');
      sql = `SELECT id, email, role, NULL as vendorData FROM users WHERE role = 'vendor'`;
    }

    const rows = await db.sequelize.query(sql, { type: db.sequelize.QueryTypes.SELECT });

    if (!rows || rows.length === 0) {
      console.log('No vendor-onboarded users found.');
      process.exit(0);
    }

    console.log(`Found ${rows.length} vendor(s):`);
    rows.forEach((r, idx) => {
      let vendorData = null;
      try { vendorData = r.vendorData ? (typeof r.vendorData === 'string' ? JSON.parse(r.vendorData) : r.vendorData) : null; } catch (e) { vendorData = r.vendorData; }
      console.log(`${idx + 1}. ${r.email}  | role=${r.role} | onboardingComplete=${vendorData && vendorData.onboardingComplete ? vendorData.onboardingComplete : 'n/a'}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error querying DB:', err && err.message ? err.message : err);
    process.exit(1);
  }
})();
