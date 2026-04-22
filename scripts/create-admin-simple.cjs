#!/usr/bin/env node

/**
 * Create admin account with proper password hash
 */

const bcrypt = require('bcrypt');

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
};

const createAdmin = async () => {
  try {
    // Hash the password
    const plainPassword = 'admin123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    
    log(`Password hash created for admin123: ${hashedPassword}`);
    
    // Create SQL to update admin user
    const sql = `
      -- Update admin user with proper password hash
      UPDATE users 
      SET password = '${hashedPassword}', isActive = true, isVerified = true
      WHERE email = 'admin@propertyark.com';
      
      -- Verify update
      SELECT email, role, isActive, isVerified FROM users WHERE email = 'admin@propertyark.com';
    `;
    
    // Save SQL to file
    const fs = require('fs');
    fs.writeFileSync('update-admin-password.sql', sql);
    
    log('SQL update script created: update-admin-password.sql');
    log('Ready to execute on Neon database');
    
    // Also create a test script
    const testScript = `
-- Test admin login
-- This script tests if the admin account can be authenticated

-- First, let's see the current admin user
SELECT * FROM users WHERE email = 'admin@propertyark.com';

-- The password hash for 'admin123' should be:
-- ${hashedPassword}

-- To verify, you can use this in Node.js:
-- const bcrypt = require('bcrypt');
-- const isValid = await bcrypt.compare('admin123', '${hashedPassword}');
-- console.log('Password valid:', isValid);
    `;
    
    fs.writeFileSync('test-admin-login.js', testScript);
    log('Test script created: test-admin-login.js');
    
    console.log('\n=== Admin Account Setup ===');
    console.log(`Email: admin@propertyark.com`);
    console.log(`Password: ${plainPassword}`);
    console.log(`Password Hash: ${hashedPassword}`);
    console.log('\nFiles created:');
    console.log('- update-admin-password.sql (SQL update script)');
    console.log('- test-admin-login.js (Test script)');
    
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    process.exit(1);
  }
};

if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin };
