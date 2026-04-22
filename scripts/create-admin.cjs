#!/usr/bin/env node

/**
 * Create admin account with proper password hash
 */

const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
};

const createAdmin = async () => {
  try {
    // Connect to Neon database
    const sequelize = new Sequelize(
      'postgresql://neondb_owner:npg_xUZQWBfyGt79@ep-noisy-resonance-am77s3ty-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
      {
        dialect: 'postgres',
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized: false
          }
        },
        logging: false
      }
    );
    
    await sequelize.authenticate();
    log('Connected to Neon database');
    
    // Hash the password
    const plainPassword = 'admin123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    
    log(`Password hash created for admin123: ${hashedPassword}`);
    
    // Delete existing admin user if exists
    await sequelize.query(`
      DELETE FROM users WHERE email = 'admin@propertyark.com'
    `);
    
    // Insert admin user with proper password hash
    const [result] = await sequelize.query(`
      INSERT INTO users (id, firstName, lastName, email, password, role, isActive, isVerified, createdAt, updatedAt)
      VALUES ('admin-uuid-001', 'Admin', 'User', 'admin@propertyark.com', :password, 'admin', true, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, firstName, lastName, email, role, isActive, isVerified, createdAt, updatedAt
    `, {
      replacements: {
        password: hashedPassword
      }
    });
    
    const adminUser = result[0];
    
    log('Admin user created successfully!');
    console.log('\n=== Admin User Details ===');
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: ${plainPassword}`);
    console.log(`Role: ${adminUser.role}`);
    console.log(`Active: ${adminUser.isactive}`);
    console.log(`Verified: ${adminUser.isverified}`);
    
    // Test login
    const loginTest = await sequelize.query(`
      SELECT * FROM users WHERE email = 'admin@propertyark.com'
    `);
    
    if (loginTest.length > 0) {
      log('Login test: SUCCESS - Admin user found in database');
      
      // Verify password
      const isValid = await bcrypt.compare(plainPassword, loginTest[0].password);
      if (isValid) {
        log('Password verification: SUCCESS - Password hash is correct');
      } else {
        log('Password verification: FAILED - Password hash is incorrect', 'error');
      }
    }
    
    await sequelize.close();
    log('Database connection closed');
    
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    process.exit(1);
  }
};

if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin };
