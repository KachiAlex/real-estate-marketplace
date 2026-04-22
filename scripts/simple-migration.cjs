#!/usr/bin/env node

/**
 * Simple Database Migration Script: Render PostgreSQL to Neon
 * Uses pg_dump and psql for reliable migration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Environment variables
const RENDER_DB_URL = process.env.RENDER_DATABASE_URL;
const NEON_DB_URL = process.env.NEON_DATABASE_URL;

if (!RENDER_DB_URL || !NEON_DB_URL) {
  console.error('ERROR: Both RENDER_DATABASE_URL and NEON_DATABASE_URL environment variables are required');
  console.log('Set them with:');
  console.log('$env:RENDER_DATABASE_URL="your-render-url"');
  console.log('$env:NEON_DATABASE_URL="your-neon-url"');
  process.exit(1);
}

// Backup directory
const BACKUP_DIR = path.join(__dirname, '../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(BACKUP_DIR, `migration-backup-${timestamp}.sql`);

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
};

const runCommand = (command, description) => {
  try {
    log(`Running: ${description}`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    log(`Success: ${description}`);
    return result;
  } catch (error) {
    log(`Failed: ${description} - ${error.message}`, 'error');
    throw error;
  }
};

// Test connections first
const testConnections = () => {
  try {
    log('Testing Render database connection...');
    runCommand(`psql "${RENDER_DB_URL}" -c "SELECT 1;"`, 'Render connection test');
    
    log('Testing Neon database connection...');
    runCommand(`psql "${NEON_DB_URL}" -c "SELECT 1;"`, 'Neon connection test');
    
    log('Both database connections successful!');
  } catch (error) {
    log('Database connection test failed. Please check your connection strings.', 'error');
    throw error;
  }
};

// Get table list from Render
const getTables = () => {
  try {
    log('Getting table list from Render...');
    const result = runCommand(
      `psql "${RENDER_DB_URL}" -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"`,
      'Get table list'
    );
    
    const tables = result.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    log(`Found ${tables.length} tables: ${tables.join(', ')}`);
    return tables;
  } catch (error) {
    log('Failed to get table list', 'error');
    throw error;
  }
};

// Export data from Render
const exportData = (tables) => {
  try {
    log('Exporting data from Render database...');
    
    // Create a comprehensive export script
    let exportScript = '-- Migration export from Render to Neon\n';
    exportScript += `-- Generated on: ${new Date().toISOString()}\n\n`;
    
    for (const table of tables) {
      log(`Exporting table: ${table}`);
      
      // Get table structure
      const createTable = runCommand(
        `pg_dump "${RENDER_DB_URL}" -s -t "${table}"`,
        `Export structure for ${table}`
      );
      
      exportScript += `-- Structure for ${table}\n`;
      exportScript += createTable + '\n\n';
      
      // Get table data
      try {
        const tableData = runCommand(
          `pg_dump "${RENDER_DB_URL}" -a -t "${table}" --inserts`,
          `Export data for ${table}`
        );
        
        exportScript += `-- Data for ${table}\n`;
        exportScript += tableData + '\n\n';
        
        log(`Exported ${table} successfully`);
      } catch (error) {
        log(`Warning: Could not export data for ${table} (table might be empty)`, 'warn');
        exportScript += `-- No data for ${table} or table is empty\n\n`;
      }
    }
    
    // Write backup file
    fs.writeFileSync(backupFile, exportScript);
    log(`Export saved to: ${backupFile}`);
    
    return backupFile;
  } catch (error) {
    log('Export failed', 'error');
    throw error;
  }
};

// Import data to Neon
const importData = (backupFile) => {
  try {
    log('Importing data to Neon database...');
    
    // Import the backup file
    const result = runCommand(
      `psql "${NEON_DB_URL}" < "${backupFile}"`,
      'Import data to Neon'
    );
    
    log('Data import completed successfully!');
    return result;
  } catch (error) {
    log('Import failed', 'error');
    throw error;
  }
};

// Verify migration
const verifyMigration = (tables) => {
  try {
    log('Verifying migration...');
    
    for (const table of tables) {
      try {
        // Get count from Render
        const renderCount = runCommand(
          `psql "${RENDER_DB_URL}" -t -c "SELECT COUNT(*) FROM ${table};"`,
          `Count ${table} in Render`
        ).trim();
        
        // Get count from Neon
        const neonCount = runCommand(
          `psql "${NEON_DB_URL}" -t -c "SELECT COUNT(*) FROM ${table};"`,
          `Count ${table} in Neon`
        ).trim();
        
        const renderNum = parseInt(renderCount) || 0;
        const neonNum = parseInt(neonCount) || 0;
        
        if (renderNum === neonNum) {
          log(`Verified ${table}: ${renderNum} rows`);
        } else {
          log(`Mismatch ${table}: Render=${renderNum}, Neon=${neonNum}`, 'warn');
        }
      } catch (error) {
        log(`Could not verify ${table}: ${error.message}`, 'warn');
      }
    }
    
    log('Verification completed!');
  } catch (error) {
    log('Verification failed', 'error');
    throw error;
  }
};

// Main migration function
const runMigration = async () => {
  const startTime = Date.now();
  
  try {
    log('Starting simple database migration from Render to Neon');
    log(`Source: ${RENDER_DB_URL.replace(/\/\/.*@/, '//***@')}`);
    log(`Target: ${NEON_DB_URL.replace(/\/\/.*@/, '//***@')}`);
    
    // Step 1: Test connections
    testConnections();
    
    // Step 2: Get table list
    const tables = getTables();
    
    // Step 3: Export data
    const backupFile = exportData(tables);
    
    // Step 4: Import data
    importData(backupFile);
    
    // Step 5: Verify migration
    verifyMigration(tables);
    
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    log('\n=== Migration Summary ===');
    log(`Duration: ${duration} seconds`);
    log(`Tables migrated: ${tables.length}`);
    log(`Backup file: ${backupFile}`);
    log('\nMigration completed successfully!');
    
    log('\nNext steps:');
    log('1. Update your Vercel environment variables to use NEON_DATABASE_URL');
    log('2. Test your application with the new database');
    log('3. Monitor for any issues');
    log('4. Keep the Render database for a few days as backup');
    
  } catch (error) {
    log(`Migration failed: ${error.message}`, 'error');
    process.exit(1);
  }
};

// Run migration
if (require.main === module) {
  runMigration().catch(error => {
    log(`Unhandled error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = { runMigration };
