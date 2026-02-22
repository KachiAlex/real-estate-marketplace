const db = require('../config/sequelizeDb');

/**
 * Add missing columns to the users table that the Sequelize model expects.
 * This script is idempotent: it checks information_schema before ALTER TABLE.
 * Run: node backend/migration/add_missing_user_columns.js
 */

async function columnExists(columnName) {
  const sql = `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name = :col`;
  const rows = await db.sequelize.query(sql, { replacements: { col: columnName }, type: db.Sequelize.QueryTypes.SELECT });
  return rows && rows.length > 0;
}

async function addColumn(columnSql) {
  try {
    await db.sequelize.query(columnSql);
    console.log('Added:', columnSql);
  } catch (e) {
    console.error('Failed to add column:', columnSql, e.message || e);
  }
}

const columns = [
  { name: 'suspendedBy', sql: 'ALTER TABLE "users" ADD COLUMN "suspendedBy" VARCHAR' },
  { name: 'activatedBy', sql: 'ALTER TABLE "users" ADD COLUMN "activatedBy" VARCHAR' },
  { name: 'verificationToken', sql: 'ALTER TABLE "users" ADD COLUMN "verificationToken" VARCHAR' },
  { name: 'verificationExpires', sql: 'ALTER TABLE "users" ADD COLUMN "verificationExpires" TIMESTAMP' },
  { name: 'resetPasswordToken', sql: 'ALTER TABLE "users" ADD COLUMN "resetPasswordToken" VARCHAR' },
  { name: 'resetPasswordExpires', sql: 'ALTER TABLE "users" ADD COLUMN "resetPasswordExpires" TIMESTAMP' },
  { name: 'verificationNotes', sql: 'ALTER TABLE "users" ADD COLUMN "verificationNotes" TEXT' },
  { name: 'verifiedBy', sql: 'ALTER TABLE "users" ADD COLUMN "verifiedBy" VARCHAR' },
  { name: 'verifiedAt', sql: 'ALTER TABLE "users" ADD COLUMN "verifiedAt" TIMESTAMP' },
  { name: 'preferences', sql: "ALTER TABLE \"users\" ADD COLUMN \"preferences\" JSONB DEFAULT '{}'::jsonb" },
  { name: 'favorites', sql: "ALTER TABLE \"users\" ADD COLUMN \"favorites\" JSONB DEFAULT '[]'::jsonb" },
  { name: 'mortgageBankProfile', sql: 'ALTER TABLE "users" ADD COLUMN "mortgageBankProfile" VARCHAR' }
];

async function run() {
  try {
    console.log('Connecting to DB...');
    await db.sequelize.authenticate();
    console.log('Connected');

    for (const col of columns) {
      const exists = await columnExists(col.name);
      if (exists) {
        console.log('Already exists:', col.name);
      } else {
        console.log('Creating column:', col.name);
        await addColumn(col.sql);
      }
    }

    console.log('Done.');
    process.exit(0);
  } catch (e) {
    console.error('Migration error:', e);
    process.exit(1);
  }
}

run();
