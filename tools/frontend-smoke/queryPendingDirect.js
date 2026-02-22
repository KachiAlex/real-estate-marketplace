#!/usr/bin/env node
// Run the same SQL used by /api/admin/vendors/pending directly against the DB.
// Usage: set env DATABASE_URL (and DB_REQUIRE_SSL/DB_REJECT_UNAUTHORIZED) then:
// node queryPendingDirect.js

const path = require('path');
const dbPath = path.join(__dirname, '..', '..', 'backend', 'config', 'sequelizeDb');
const db = require(dbPath);

(async function run() {
  try {
    const sql = `SELECT id, email, role, "vendorData"::text as vendorDataText FROM users WHERE ("vendorData"->>'kycStatus') IN ('pending','required') ORDER BY updatedAt DESC LIMIT 200`;
    console.log('Running SQL:', sql);
    const rows = await db.sequelize.query(sql, { type: db.sequelize.QueryTypes.SELECT });
    console.log('Query returned', rows.length, 'rows');
    for (const r of rows) {
      console.log({ id: r.id, email: r.email, vendorData: (() => { try { return JSON.parse(r.vendorDataText); } catch (e) { return r.vendorDataText; } })() });
    }
    process.exit(0);
  } catch (err) {
    console.error('Direct query error:', err && err.stack ? err.stack : err);
    process.exit(2);
  }
})();
