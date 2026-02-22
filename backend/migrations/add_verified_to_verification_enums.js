const { Client } = require('pg');
require('dotenv').config();

// Prefer DATABASE_URL from environment; fallback to repository example
const connectionString = process.env.DATABASE_URL || 'postgresql://propertyark_user:oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej@dpg-d61qns24d50c7380u57g-a.oregon-postgres.render.com/propertyark';

const enumTypes = [
  'enum_properties_verificationStatus',
  'enum_mortgage_banks_verificationStatus',
  'enum_verification_applications_status'
];

async function run() {
  const sslOption = process.env.DB_REQUIRE_SSL === 'true' ? { rejectUnauthorized: process.env.DB_REJECT_UNAUTHORIZED !== 'false' } : false;
  const client = new Client({ connectionString, ssl: sslOption });
  try {
    await client.connect();
    console.log('Connected — ensuring "verified" value exists in verification enums');

    for (const typ of enumTypes) {
      try {
        console.log(`Ensuring 'verified' in ${typ}`);
        const sql = `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = '${typ}' AND e.enumlabel = 'verified') THEN ALTER TYPE "${typ}" ADD VALUE 'verified'; END IF; END$$;`;
        await client.query(sql);
        console.log(`OK: ensured 'verified' in ${typ}`);
      } catch (e) {
        console.error(`Failed to update ${typ}:`, e.message || e);
      }
    }

    console.log('Migration complete');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch (e) {}
  }
}

run();
