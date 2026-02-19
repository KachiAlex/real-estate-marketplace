const { Client } = require('pg');

// Prefer DATABASE_URL from environment; fallback to known connection string used by repo migrations
const connectionString = process.env.DATABASE_URL || 'postgresql://propertyark_user:oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej@dpg-d61qns24d50c7380u57g-a.oregon-postgres.render.com/propertyark';

async function runMigration() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to database — running migration: add suspendedAt to users');

    // Add column if it doesn't already exist
    await client.query('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP;');

    console.log('Migration successful: "suspendedAt" column ensured on "users" table');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch (e) {}
  }
}

runMigration();
