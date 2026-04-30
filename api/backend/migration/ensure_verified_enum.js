#!/usr/bin/env node
require('dotenv').config();
const db = require('../config/sequelizeDb');

async function ensureVerified() {
  try {
    const { sequelize } = db;
    await sequelize.authenticate();
    console.log('Connected to DB');

    // Find enum types that look like verificationStatus enums (only real enum types)
    const [types] = await sequelize.query("SELECT t.typname FROM pg_type t WHERE t.typname ILIKE '%verification%' AND t.typtype = 'e';");
    if (!types || types.length === 0) {
      console.log('No verification-related enum types found');
      process.exit(0);
    }

    for (const row of types) {
      const typ = row.typname;
      try {
        console.log(`Ensuring 'verified' in enum: ${typ}`);
        // Use ALTER TYPE ... ADD VALUE IF NOT EXISTS when supported
        await sequelize.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = '${typ}' AND e.enumlabel = 'verified') THEN ALTER TYPE "${typ}" ADD VALUE 'verified'; END IF; END$$;`);
        console.log(`OK: ensured 'verified' in ${typ}`);
      } catch (e) {
        console.error(`Failed to update enum ${typ}:`, e.message || e);
      }
    }

    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  }
}

ensureVerified();
