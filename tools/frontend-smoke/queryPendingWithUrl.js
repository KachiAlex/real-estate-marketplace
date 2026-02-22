#!/usr/bin/env node
// Connect to a Postgres DB using a provided DATABASE_URL and run the admin pending SQL.
// Usage: node queryPendingWithUrl.js <DATABASE_URL>

const [,, databaseUrl] = process.argv;
if (!databaseUrl) {
  console.error('Usage: node queryPendingWithUrl.js <DATABASE_URL>');
  process.exit(2);
}

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(databaseUrl, {
  logging: (msg) => console.log('SQL:', msg),
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

(async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB');
    const sql = `SELECT id, email, role, "vendorData"::text as vendorDataText FROM users WHERE ("vendorData"->>'kycStatus') IN ('pending','required') ORDER BY "updatedAt" DESC LIMIT 200`;
    const [rows] = await sequelize.query(sql, { type: Sequelize.QueryTypes.SELECT });
    if (!rows) {
      console.log('No rows returned (rows falsy)');
    } else if (Array.isArray(rows)) {
      console.log('Rows count:', rows.length);
      for (const r of rows) console.log({ id: r.id, email: r.email, vendorDataText: r.vendorDataText });
    } else {
      console.log('Rows result (non-array):', rows);
    }
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    const util = require('util');
    console.error('Error running query (detailed):', util.inspect(err, { depth: null }));
    try { await sequelize.close(); } catch (e) {}
    process.exit(1);
  }
})();
