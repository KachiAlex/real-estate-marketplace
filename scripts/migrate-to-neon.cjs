#!/usr/bin/env node

/**
 * Database Migration Script: Render PostgreSQL to Neon
 * 
 * Usage: node scripts/migrate-to-neon.cjs
 * 
 * Prerequisites:
 * - npm install pg
 * - Set RENDER_DATABASE_URL and NEON_DATABASE_URL environment variables
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Environment variables
const RENDER_DB_URL = process.env.RENDER_DATABASE_URL;
const NEON_DB_URL = process.env.NEON_DATABASE_URL || 'postgresql://neondb_owner:npg_xUZQWBfyGt79@ep-noisy-resonance-am77s3ty-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

if (!RENDER_DB_URL) {
  console.error('ERROR: RENDER_DATABASE_URL environment variable is required');
  process.exit(1);
}

// Database clients
const renderClient = new Client(RENDER_DB_URL);
const neonClient = new Client(NEON_DB_URL);

// Migration configuration
const TABLES_TO_MIGRATE = [
  'users',
  'properties', 
  'conversations',
  'messages',
  'support_inquiries',
  'payments',
  'reviews',
  'favorites',
  'viewing_requests'
];

// Backup directory
const BACKUP_DIR = path.join(__dirname, '../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Utility functions
const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Database operations
const connectClients = async () => {
  try {
    await renderClient.connect();
    log('Connected to Render database');
    
    await neonClient.connect();
    log('Connected to Neon database');
  } catch (error) {
    log(`Connection error: ${error.message}`, 'error');
    throw error;
  }
};

const disconnectClients = async () => {
  try {
    await renderClient.end();
    await neonClient.end();
    log('Disconnected from databases');
  } catch (error) {
    log(`Disconnection error: ${error.message}`, 'error');
  }
};

const getTableSchema = async (tableName) => {
  try {
    const query = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `;
    
    const result = await renderClient.query(query, [tableName]);
    return result.rows;
  } catch (error) {
    log(`Error getting schema for ${tableName}: ${error.message}`, 'error');
    throw error;
  }
};

const createTableInNeon = async (tableName, schema) => {
  try {
    // This is a simplified table creation
    // In practice, you'd want to preserve exact schema
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await neonClient.query(createTableSQL);
    log(`Created table ${tableName} in Neon`);
  } catch (error) {
    log(`Error creating table ${tableName}: ${error.message}`, 'error');
    throw error;
  }
};

const migrateTableData = async (tableName) => {
  try {
    log(`Starting migration for table: ${tableName}`);
    
    // Get row count from Render
    const countQuery = `SELECT COUNT(*) as count FROM ${tableName}`;
    const countResult = await renderClient.query(countQuery);
    const rowCount = parseInt(countResult.rows[0].count);
    
    log(`Found ${rowCount} rows in ${tableName}`);
    
    if (rowCount === 0) {
      log(`No data to migrate in ${tableName}`);
      return;
    }
    
    // Migrate data in batches to avoid memory issues
    const batchSize = 1000;
    let migratedCount = 0;
    
    for (let offset = 0; offset < rowCount; offset += batchSize) {
      // Fetch batch from Render
      const dataQuery = `SELECT * FROM ${tableName} ORDER BY id LIMIT ${batchSize} OFFSET ${offset}`;
      const dataResult = await renderClient.query(dataQuery);
      
      if (dataResult.rows.length === 0) break;
      
      // Insert batch into Neon
      const columns = Object.keys(dataResult.rows[0]);
      const values = dataResult.rows.map(row => 
        columns.map(col => row[col] === null ? 'NULL' : `'${row[col]}'`).join(', ')
      );
      
      const insertQuery = `
        INSERT INTO ${tableName} (${columns.join(', ')}) 
        VALUES ${values.map((val, i) => `(${val})`).join(', ')}
        ON CONFLICT (id) DO NOTHING
      `;
      
      await neonClient.query(insertQuery);
      migratedCount += dataResult.rows.length;
      
      log(`Migrated ${migratedCount}/${rowCount} rows from ${tableName}`);
      
      // Small delay to avoid overwhelming Neon
      await sleep(100);
    }
    
    log(`Completed migration for ${tableName}: ${migratedCount} rows`);
  } catch (error) {
    log(`Error migrating table ${tableName}: ${error.message}`, 'error');
    throw error;
  }
};

const backupTable = async (tableName) => {
  try {
    const backupFile = path.join(BACKUP_DIR, `${tableName}-backup-${timestamp()}.sql`);
    
    // Export table data
    const query = `SELECT * FROM ${tableName}`;
    const result = await renderClient.query(query);
    
    // Create backup file
    const backupData = {
      table: tableName,
      timestamp: new Date().toISOString(),
      rowCount: result.rows.length,
      data: result.rows
    };
    
    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    log(`Backed up ${tableName} to ${backupFile}`);
    
    return backupFile;
  } catch (error) {
    log(`Error backing up table ${tableName}: ${error.message}`, 'error');
    throw error;
  }
};

const verifyMigration = async (tableName) => {
  try {
    // Get counts from both databases
    const renderCount = await renderClient.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const neonCount = await neonClient.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    
    const renderRows = parseInt(renderCount.rows[0].count);
    const neonRows = parseInt(neonCount.rows[0].count);
    
    log(`Verification for ${tableName}: Render=${renderRows}, Neon=${neonRows}`);
    
    if (renderRows === neonRows) {
      log(`Migration verified for ${tableName}: ${neonRows} rows`);
      return true;
    } else {
      log(`Migration mismatch for ${tableName}: expected ${renderRows}, got ${neonRows}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Error verifying migration for ${tableName}: ${error.message}`, 'error');
    return false;
  }
};

// Main migration function
const runMigration = async () => {
  const startTime = Date.now();
  let migrationSuccess = true;
  
  try {
    log('Starting database migration from Render to Neon');
    log(`Source: ${RENDER_DB_URL.replace(/\/\/.*@/, '//***@')}`);
    log(`Target: ${NEON_DB_URL.replace(/\/\/.*@/, '//***@')}`);
    
    // Connect to databases
    await connectClients();
    
    // Test Neon connection
    await neonClient.query('SELECT 1');
    log('Neon database connection test passed');
    
    // Migration results
    const migrationResults = [];
    
    // Migrate each table
    for (const tableName of TABLES_TO_MIGRATE) {
      try {
        log(`\n--- Processing table: ${tableName} ---`);
        
        // Backup table first
        await backupTable(tableName);
        
        // Get schema (simplified - you might need more complex schema handling)
        const schema = await getTableSchema(tableName);
        
        // Create table in Neon if needed
        await createTableInNeon(tableName, schema);
        
        // Migrate data
        await migrateTableData(tableName);
        
        // Verify migration
        const verified = await verifyMigration(tableName);
        
        migrationResults.push({
          table: tableName,
          success: true,
          verified
        });
        
        log(`Successfully migrated ${tableName}`);
        
      } catch (error) {
        log(`Failed to migrate ${tableName}: ${error.message}`, 'error');
        migrationResults.push({
          table: tableName,
          success: false,
          error: error.message
        });
        migrationSuccess = false;
      }
    }
    
    // Summary
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    log('\n=== Migration Summary ===');
    log(`Duration: ${duration} seconds`);
    log(`Tables processed: ${TABLES_TO_MIGRATE.length}`);
    
    migrationResults.forEach(result => {
      const status = result.success ? 'SUCCESS' : 'FAILED';
      const verification = result.verified ? 'VERIFIED' : 'NOT VERIFIED';
      log(`${result.table}: ${status} ${result.verified ? `(${verification})` : ''}`);
      if (!result.success && result.error) {
        log(`  Error: ${result.error}`);
      }
    });
    
    if (migrationSuccess) {
      log('\nMigration completed successfully!');
      log('You can now update your application to use the Neon database URL.');
    } else {
      log('\nMigration completed with errors. Please review the failed tables.');
    }
    
  } catch (error) {
    log(`Migration failed: ${error.message}`, 'error');
    migrationSuccess = false;
  } finally {
    await disconnectClients();
    
    if (migrationSuccess) {
      log('\nNext steps:');
      log('1. Update your Vercel environment variables to use NEON_DATABASE_URL');
      log('2. Test your application with the new database');
      log('3. Monitor for any issues');
      log('4. Consider decommissioning the Render database after testing');
    }
    
    process.exit(migrationSuccess ? 0 : 1);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  log('\nReceived SIGINT. Cleaning up...');
  await disconnectClients();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log('\nReceived SIGTERM. Cleaning up...');
  await disconnectClients();
  process.exit(0);
});

// Run migration
if (require.main === module) {
  runMigration().catch(error => {
    log(`Unhandled error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runMigration };
