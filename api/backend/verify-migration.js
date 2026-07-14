#!/usr/bin/env node

/**
 * Post-Migration Verification Script
 * Verifies that all data was migrated correctly
 */

require('dotenv').config();
const db = require('../config/sequelizeDb');
const { sequelize } = db;

async function verifyMigration() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   Post-Migration Verification                              ║');
  console.log('║   Checking PostgreSQL data integrity                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Test connection
    console.log('🔌 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful\n');

    // Get table list
    console.log('📊 Checking tables...');
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const expectedTables = [
      'users',
      'properties',
      'escrow_transactions',
      'investments',
      'user_investments',
      'mortgage_banks',
      'mortgage_applications',
      'mortgages',
      'blog_posts',
      'messages',
      'notifications',
      'saved_properties',
      'property_inquiries',
      'property_alerts',
      'support_inquiries',
      'verification_applications',
      'dispute_resolutions',
      'inspection_requests'
    ];

    const existingTables = tables[0].map(t => t.table_name);
    console.log(`Found ${existingTables.length} tables:\n`);

    let allTablesPresent = true;
    expectedTables.forEach(tableName => {
      const exists = existingTables.includes(tableName);
      console.log(`  ${exists ? '✅' : '❌'} ${tableName}`);
      if (!exists) allTablesPresent = false;
    });

    if (!allTablesPresent) {
      console.log('\n⚠️  Some expected tables are missing!');
      console.log('   Run: node migration/migrate.js');
    }

    // Count records in each table
    console.log('\n📈 Record counts:\n');
    const counts = {};
    for (const tableName of existingTables) {
      const [result] = await sequelize.query(
        `SELECT COUNT(*) as count FROM "${tableName}";`
      );
      counts[tableName] = result[0].count;
      console.log(`  ${tableName}: ${result[0].count} records`);
    }

    // Calculate totals
    const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log(`\n  📌 Total records: ${totalRecords}`);

    // Test queries
    console.log('\n🧪 Running test queries...\n');

    try {
      const userCount = await db.User.count();
      console.log(`  ✅ Users table accessible: ${userCount} users`);
    } catch (e) {
      console.log(`  ❌ Users table error: ${e.message}`);
    }

    try {
      const propertyCount = await db.Property.count();
      console.log(`  ✅ Properties table accessible: ${propertyCount} properties`);
    } catch (e) {
      console.log(`  ❌ Properties table error: ${e.message}`);
    }

    try {
      const escrowCount = await db.EscrowTransaction.count();
      console.log(`  ✅ Escrow table accessible: ${escrowCount} transactions`);
    } catch (e) {
      console.log(`  ❌ Escrow table error: ${e.message}`);
    }

    // Final summary
    console.log('\n╔════════════════════════════════════════════════════════════╗');
    if (allTablesPresent && totalRecords > 0) {
      console.log('║   ✅ Verification successful!                              ║');
      console.log('║                                                            ║');
      console.log('║   All tables created and data migrated.                   ║');
      console.log('║   You can now start the backend server.                   ║');
      console.log('║                                                            ║');
      console.log('║   Run: npm start                                           ║');
    } else if (allTablesPresent && totalRecords === 0) {
      console.log('║   ⚠️  Tables exist but no data found                       ║');
      console.log('║                                                            ║');
      console.log('║   Database is ready but migration may have failed.        ║');
      console.log('║   Run migration again: node migration/migrate.js          ║');
    } else {
      console.log('║   ❌ Verification failed                                    ║');
      console.log('║                                                            ║');
      console.log('║   Some tables are missing. Run migration:                 ║');
      console.log('║   node migration/migrate.js                               ║');
    }
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Verification failed:');
    console.error(error.message);
    console.log('\nMake sure:');
    console.log('  1. PostgreSQL database is running');
    console.log('  2. DATABASE_URL is set correctly');
    console.log('  3. Network connectivity to Render is available');
    process.exit(1);
  }
}

verifyMigration();
