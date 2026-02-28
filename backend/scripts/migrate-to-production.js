#!/usr/bin/env node

/**
 * Production Migration Script
 * This script helps migrate data from local PostgreSQL to Render PostgreSQL
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Local database connection
const localDb = new Sequelize(process.env.DATABASE_URL, {
  logging: false,
  dialect: 'postgres'
});

// Render database connection (you'll set this in Render environment)
const renderDb = new Sequelize(process.env.RENDER_DATABASE_URL, {
  logging: false,
  dialect: 'postgres'
});

async function migrateToProduction() {
  try {
    console.log('🚀 Starting migration to production database...');
    
    // Test connections
    await localDb.authenticate();
    console.log('✅ Connected to local database');
    
    await renderDb.authenticate();
    console.log('✅ Connected to Render database');
    
    // Get all tables
    const [localTables] = await localDb.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('📋 Tables to migrate:', localTables.map(t => t.table_name));
    
    // Migrate each table
    for (const table of localTables) {
      const tableName = table.table_name;
      
      if (tableName === 'SequelizeMeta') {
        console.log(`⏭️  Skipping ${tableName} (system table)`);
        continue;
      }
      
      console.log(`📦 Migrating ${tableName}...`);
      
      // Get data from local
      const [localData] = await localDb.query(`SELECT * FROM "${tableName}"`);
      
      if (localData.length === 0) {
        console.log(`   ✅ ${tableName} is empty, skipping`);
        continue;
      }
      
      // Insert into Render
      for (const row of localData) {
        try {
          await renderDb.query(`
            INSERT INTO "${tableName}" VALUES (${Object.keys(row).map((key, index) => `$${index + 1}`).join(', ')})
          `, {
            replacements: Object.values(row)
          });
        } catch (error) {
          console.error(`   ❌ Error inserting row in ${tableName}:`, error.message);
        }
      }
      
      console.log(`   ✅ Migrated ${localData.length} records from ${tableName}`);
    }
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await localDb.close();
    await renderDb.close();
  }
}

// Run if called directly
if (require.main === module) {
  migrateToProduction();
}

module.exports = { migrateToProduction };
