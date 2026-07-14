#!/usr/bin/env node

/**
 * Extract data from existing backend and prepare for Neon migration
 * Uses your existing backend connection to export data
 */

const fs = require('fs');
const path = require('path');

// Backup directory
const BACKUP_DIR = path.join(__dirname, '../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const exportFile = path.join(BACKUP_DIR, `data-export-${timestamp}.json`);

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
};

// Create a simple data extraction using your existing backend
const extractData = async () => {
  try {
    log('Starting data extraction from backend...');
    
    // Start your backend server if not running
    log('Please ensure your backend server is running on localhost:5001');
    log('Then run: curl http://localhost:5001/api/properties > properties.json');
    log('And: curl http://localhost:5001/api/users > users.json');
    
    // For now, create a sample export structure
    const exportData = {
      timestamp: new Date().toISOString(),
      tables: {
        properties: {
          structure: {
            id: 'UUID PRIMARY KEY',
            title: 'VARCHAR(255)',
            description: 'TEXT',
            price: 'DECIMAL(15,2)',
            type: 'VARCHAR(50)',
            status: 'VARCHAR(50)',
            location: 'TEXT',
            city: 'VARCHAR(100)',
            state: 'VARCHAR(100)',
            ownerId: 'UUID',
            createdAt: 'TIMESTAMP',
            updatedAt: 'TIMESTAMP'
          },
          data: [] // Will be populated by curl command
        },
        users: {
          structure: {
            id: 'UUID PRIMARY KEY',
            firstName: 'VARCHAR(100)',
            lastName: 'VARCHAR(100)',
            email: 'VARCHAR(255) UNIQUE',
            password: 'VARCHAR(255)',
            role: 'VARCHAR(50)',
            isActive: 'BOOLEAN',
            isVerified: 'BOOLEAN',
            createdAt: 'TIMESTAMP',
            updatedAt: 'TIMESTAMP'
          },
          data: [] // Will be populated by curl command
        }
      },
      instructions: [
        '1. Start your backend server: npm start',
        '2. Export properties: curl http://localhost:5001/api/properties > properties.json',
        '3. Export users: curl http://localhost:5001/api/users > users.json',
        '4. Import to Neon: pql "NEON_DATABASE_URL" < import-script.sql'
      ]
    };
    
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));
    log(`Export template created: ${exportFile}`);
    
    return exportFile;
  } catch (error) {
    log(`Data extraction failed: ${error.message}`, 'error');
    throw error;
  }
};

// Create import script for Neon
const createImportScript = () => {
  const importScript = `
-- Neon Database Import Script
-- Run this after exporting data from your backend

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    firstName VARCHAR(100),
    lastName VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    isActive BOOLEAN DEFAULT true,
    isVerified BOOLEAN DEFAULT false,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255),
    description TEXT,
    price DECIMAL(15,2),
    type VARCHAR(50),
    status VARCHAR(50),
    location TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    ownerId UUID REFERENCES users(id),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert your exported data here
-- Example:
-- INSERT INTO properties (id, title, description, price, type, status, location, city, state, ownerId)
-- VALUES ('uuid-here', 'Property Title', 'Description', 100000.00, 'residential', 'active', 'Address', 'City', 'State', 'user-uuid');

-- You can import JSON data using a script or manually
`;

  const scriptFile = path.join(BACKUP_DIR, `import-script-${timestamp}.sql`);
  fs.writeFileSync(scriptFile, importScript);
  log(`Import script created: ${scriptFile}`);
  
  return scriptFile;
};

// Main function
const runExtraction = async () => {
  try {
    log('Creating data extraction tools...');
    
    const exportFile = await extractData();
    const scriptFile = createImportScript();
    
    log('\n=== Data Extraction Ready ===');
    log('Export template: ' + exportFile);
    log('Import script: ' + scriptFile);
    
    log('\nNext steps:');
    log('1. Start your backend: npm start');
    log('2. Export data:');
    log('   curl http://localhost:5001/api/properties > properties.json');
    log('   curl http://localhost:5001/api/users > users.json');
    log('3. Convert JSON to SQL INSERT statements');
    log('4. Import to Neon: psql "NEON_DATABASE_URL" < import-script.sql');
    
  } catch (error) {
    log(`Extraction failed: ${error.message}`, 'error');
    process.exit(1);
  }
};

if (require.main === module) {
  runExtraction();
}

module.exports = { runExtraction };
