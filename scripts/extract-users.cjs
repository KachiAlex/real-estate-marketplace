#!/usr/bin/env node

/**
 * Extract real users from backend database
 */

const { sequelize } = require('../backend/config/sequelizeDb');
const { User } = require('../backend/config/sequelizeDb');

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
};

const extractUsers = async () => {
  try {
    log('Connecting to database...');
    await sequelize.authenticate();
    log('Database connected successfully');
    
    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive', 'isVerified', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'ASC']]
    });
    
    log(`Found ${users.length} users`);
    
    // Convert to JSON
    const usersData = users.map(user => user.get({ plain: true }));
    
    // Save to file
    const fs = require('fs');
    fs.writeFileSync('real-users.json', JSON.stringify(usersData, null, 2));
    
    log('Users saved to real-users.json');
    
    // Display users
    console.log('\n=== Users Found ===');
    usersData.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} - ${user.email} (${user.role})`);
    });
    
    // Create SQL insert statements
    let sql = '-- Real users migration to Neon\n';
    sql += `-- Generated on: ${new Date().toISOString()}\n\n`;
    
    sql += 'INSERT INTO users (id, firstName, lastName, email, password, role, isActive, isVerified, createdAt, updatedAt) VALUES\n';
    
    const values = usersData.map(user => {
      return `('${user.id}', '${user.firstName}', '${user.lastName}', '${user.email}', 'hashed_password_placeholder', '${user.role}', ${user.isActive}, ${user.isVerified}, '${user.createdAt}', '${user.updatedAt}')`;
    });
    
    sql += values.join(',\n') + ';\n\n';
    
    sql += '-- Verification\n';
    sql += 'SELECT COUNT(*) as total_users FROM users;\n';
    sql += 'SELECT email, role FROM users ORDER BY createdAt;\n';
    
    fs.writeFileSync('migrate-users.sql', sql);
    log('SQL migration script created: migrate-users.sql');
    
    await sequelize.close();
    log('Database connection closed');
    
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    process.exit(1);
  }
};

if (require.main === module) {
  extractUsers();
}

module.exports = { extractUsers };
