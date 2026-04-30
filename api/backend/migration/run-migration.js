#!/usr/bin/env node

/**
 * Quick Migration Runner
 * Executes the Firestore to PostgreSQL migration with proper setup
 */

require('dotenv').config();
const { spawn } = require('child_process');
const path = require('path');

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║   Firestore → PostgreSQL Migration Runner                 ║');
console.log('║   Property ARK Real Estate Marketplace                     ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

console.log('📋 Pre-Migration Checks:');
console.log('   ✓ Environment: ' + (process.env.NODE_ENV || 'development'));
console.log('   ✓ Database: ' + (process.env.DB_NAME || 'propertyark'));
console.log('   ✓ Host: ' + (process.env.DB_HOST || 'unknown'));
console.log('   ✓ User: ' + (process.env.DB_USER || 'unknown'));

// Verify Firebase credentials
try {
  const serviceAccount = require('../serviceAccountKey.json');
  console.log('   ✓ Firebase Admin SDK: Configured');
} catch (e) {
  console.error('   ✗ Firebase Admin SDK: NOT FOUND (required for migration)');
  console.log('\n   Please ensure serviceAccountKey.json exists in backend/\n');
  process.exit(1);
}

console.log('\n🚀 Starting migration...\n');

// Run migration script
const migrationPath = path.join(__dirname, 'migrate.js');
const migration = spawn('node', [migrationPath], {
  cwd: __dirname,
  stdio: 'inherit'
});

migration.on('exit', (code) => {
  if (code === 0) {
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ Migration completed successfully!                     ║');
    console.log('║                                                            ║');
    console.log('║   Next steps:                                              ║');
    console.log('║   1. Run: npm start                                        ║');
    console.log('║   2. Verify database tables created                        ║');
    console.log('║   3. Test API endpoints                                    ║');
    console.log('║   4. Deploy to Render                                      ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  } else {
    console.log('\n❌ Migration failed with exit code ' + code);
  }
  process.exit(code);
});

migration.on('error', (error) => {
  console.error('\n❌ Failed to start migration:', error);
  process.exit(1);
});
