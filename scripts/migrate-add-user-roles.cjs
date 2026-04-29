/**
 * Migration script: Add roles (JSONB) and activerole (VARCHAR) columns
 * to the users table for dual-role support.
 *
 * Uses the existing Sequelize configuration so it connects exactly like
 * the application does (same DATABASE_URL, SSL settings, etc.)
 */
const path = require('path');

// Load env from workspace root (two levels up from scripts folder)
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const { sequelize } = require('../backend/config/sequelizeDb');

const MIGRATION_SQL = `
  -- Add roles JSON column with default ['user']
  ALTER TABLE users
  ADD COLUMN IF NOT EXISTS roles JSONB DEFAULT '["user"]';

  -- Add activeRole column with default 'user'
  ALTER TABLE users
  ADD COLUMN IF NOT EXISTS activerole VARCHAR(50) DEFAULT 'user';

  -- Backfill existing users: populate roles from single role column
  UPDATE users
  SET roles = to_jsonb(ARRAY[role])
  WHERE roles IS NULL OR roles = 'null';

  -- Backfill existing users: set activeRole from role column
  UPDATE users
  SET activerole = COALESCE(role, 'user')
  WHERE activerole IS NULL;

  -- Ensure role column stays in sync with activeRole for backward compatibility
  UPDATE users
  SET role = COALESCE(activerole, role, 'user')
  WHERE role IS NULL;
`;

async function run() {
  console.log('Connecting to database via Sequelize...');
  try {
    await sequelize.authenticate();
    console.log('Connected.');

    console.log('Running migration...');
    await sequelize.query(MIGRATION_SQL);
    console.log('Migration complete: roles & activerole columns added/updated.');

    // Verify
    const [results] = await sequelize.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'users'
         AND column_name IN ('roles', 'activerole')`
    );
    console.log('Verified columns:', results);

    await sequelize.close();
    console.log('Connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    try { await sequelize.close(); } catch (_) { /* ignore */ }
    process.exit(1);
  }
}

run();
