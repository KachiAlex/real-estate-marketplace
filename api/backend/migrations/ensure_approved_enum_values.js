#!/usr/bin/env node
require('dotenv').config();
const db = require('../config/sequelizeDb');

/**
 * Ensure 'approved' exists in verification-related enum types.
 * Usage: node backend/migrations/ensure_approved_enum_values.js
 * Set DATABASE_URL env to point to the target DB (production or staging) before running.
 */
async function ensureApproved() {

  try {
    // Patch: force SSL for Render DB if DATABASE_URL contains 'render.com'
    const { Sequelize } = require('sequelize');
    let sequelize = db.sequelize;
    const dbUrl = process.env.DATABASE_URL || '';
    if (dbUrl.includes('render.com')) {
      sequelize = new Sequelize(dbUrl, { dialect: 'postgres', dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } });
      await sequelize.authenticate();
      console.log('Connected to Render DB with SSL');
    } else {
      await sequelize.authenticate();
      console.log('Connected to DB');
    }

    const enumTypes = [
      'enum_properties_verificationStatus',
      'enum_mortgage_banks_verificationStatus',
      'enum_verification_applications_status'
    ];

    for (const typ of enumTypes) {
      try {
        console.log(`Ensuring 'approved' in enum: ${typ}`);
        await sequelize.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid = t.oid WHERE t.typname = '${typ}' AND e.enumlabel = 'approved') THEN ALTER TYPE "${typ}" ADD VALUE 'approved'; END IF; END$$;`);
        console.log(`OK: ensured 'approved' in ${typ}`);
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

ensureApproved();
