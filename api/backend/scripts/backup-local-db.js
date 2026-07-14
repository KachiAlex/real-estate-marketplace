#!/usr/bin/env node

/**
 * Local Database Backup Script
 * Creates a complete backup of your local PostgreSQL database
 */

require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(__dirname, `../backups/real-estate-backup-${timestamp}.sql`);
  
  // Ensure backups directory exists
  const backupsDir = path.dirname(backupFile);
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }
  
  // Extract connection details from DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('💡 Set DATABASE_URL in your .env file or run with DATABASE_URL=...');
    return;
  }
  
  const url = new URL(dbUrl);
  
  const host = url.hostname;
  const port = url.port || 5432;
  const database = url.pathname.substring(1);
  const username = url.username;
  const password = url.password;
  
  const pgDumpCommand = `PGPASSWORD="${password}" pg_dump -h ${host} -p ${port} -U ${username} -d ${database} > "${backupFile}"`;
  
  console.log('📦 Creating database backup...');
  console.log(`📍 Backup file: ${backupFile}`);
  
  exec(pgDumpCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Backup failed:', error);
      return;
    }
    
    if (stderr) {
      console.warn('⚠️  Warning:', stderr);
    }
    
    console.log('✅ Backup completed successfully!');
    console.log(`📁 File size: ${fs.statSync(backupFile).size} bytes`);
    
    console.log('\n📋 To restore on Render:');
    console.log('1. Upload this SQL file to your Render instance');
    console.log('2. Run: psql $RENDER_DATABASE_URL < backup-file.sql');
  });
}

// Run if called directly
if (require.main === module) {
  createBackup();
}

module.exports = { createBackup };
