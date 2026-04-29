const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgresql://propertyark_user:oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej@dpg-d61qns24d50c7380u57g-a.oregon-postgres.render.com/propertyark';

async function runMigration() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to database — running migration: add property image & detail columns');

    const columns = [
      'ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "images" JSONB;',
      'ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "videos" JSONB;',
      'ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "documents" JSONB;',
      'ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "coverimage" VARCHAR(512);',
      'ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "featuredimage" VARCHAR(512);',
      'ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "bedrooms" INTEGER;',
      'ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "bathrooms" FLOAT;',
      'ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "area" FLOAT;',
      'ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "category" VARCHAR(100);',
      'ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "verificationstatus" VARCHAR(50) DEFAULT \'pending\';',
      'ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "approvalstatus" VARCHAR(50) DEFAULT \'pending\';',
      'ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "address" VARCHAR(255);',
      'ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "owneremail" VARCHAR(255);'
    ];

    for (const sql of columns) {
      await client.query(sql);
      console.log('Executed:', sql);
    }

    console.log('Migration successful: property image & detail columns ensured');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    try { await client.end(); } catch (e) {}
  }
}

runMigration();
