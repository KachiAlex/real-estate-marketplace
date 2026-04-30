#!/usr/bin/env node

/**
 * Critical Data Migration Script
 * Migrates only essential data from local to production
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

const localDb = new Sequelize(process.env.DATABASE_URL, {
  logging: false,
  dialect: 'postgres'
});

const renderDb = new Sequelize(process.env.RENDER_DATABASE_URL, {
  logging: false,
  dialect: 'postgres'
});

// Define what to migrate (in order of dependency)
const MIGRATION_PLAN = [
  {
    table: 'users',
    description: 'User accounts and authentication',
    critical: true
  },
  {
    table: 'subscription_plans',
    description: 'Subscription plan definitions',
    critical: true
  },
  {
    table: 'properties',
    description: 'Property listings',
    critical: true
  },
  {
    table: 'subscriptions',
    description: 'Active subscriptions',
    critical: false
  },
  {
    table: 'mortgage_applications',
    description: 'Mortgage applications',
    critical: false
  },
  {
    table: 'escrow_transactions',
    description: 'Escrow transactions',
    critical: false
  }
];

async function migrateCriticalData() {
  try {
    console.log('🎯 Starting critical data migration...');
    
    // Test connections
    await localDb.authenticate();
    console.log('✅ Connected to local database');
    
    await renderDb.authenticate();
    console.log('✅ Connected to Render database');
    
    for (const migration of MIGRATION_PLAN) {
      console.log(`\n📦 Migrating ${migration.table} (${migration.description})`);
      
      try {
        // Check if table exists locally
        const [tableExists] = await localDb.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = '${migration.table}'
          );
        `);
        
        if (!tableExists[0].exists) {
          console.log(`   ⏭️  Table ${migration.table} doesn't exist locally, skipping`);
          continue;
        }
        
        // Get count
        const [countResult] = await localDb.query(`SELECT COUNT(*) as count FROM "${migration.table}"`);
        const count = parseInt(countResult[0].count);
        
        if (count === 0) {
          console.log(`   ✅ ${migration.table} is empty, skipping`);
          continue;
        }
        
        // Get data
        const [data] = await localDb.query(`SELECT * FROM "${migration.table}"`);
        
        // Insert into Render
        let successCount = 0;
        for (const row of data) {
          try {
            await renderDb.query(`
              INSERT INTO "${migration.table}" VALUES (${Object.keys(row).map((key, index) => `$${index + 1}`).join(', ')})
              ON CONFLICT DO NOTHING
            `, {
              replacements: Object.values(row)
            });
            successCount++;
          } catch (error) {
            console.warn(`   ⚠️  Skipped 1 record due to: ${error.message}`);
          }
        }
        
        console.log(`   ✅ Migrated ${successCount}/${count} records from ${migration.table}`);
        
      } catch (error) {
        console.error(`   ❌ Failed to migrate ${migration.table}:`, error.message);
        if (migration.critical) {
          throw error;
        }
      }
    }
    
    console.log('\n🎉 Critical data migration completed!');
    
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
  migrateCriticalData();
}

module.exports = { migrateCriticalData };
