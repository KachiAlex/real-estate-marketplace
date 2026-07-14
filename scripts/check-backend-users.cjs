#!/usr/bin/env node

/**
 * Check users through backend's database connection
 */

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
};

const checkUsers = async () => {
  try {
    // Use the backend's database configuration
    const { sequelize } = require('../backend/config/sequelizeDb');
    const { User } = require('../backend/config/sequelizeDb');
    
    log('Connecting to database through backend config...');
    await sequelize.authenticate();
    log('Database connected successfully');
    
    // Check database name
    const [dbInfo] = await sequelize.query('SELECT current_database()');
    log(`Connected to database: ${dbInfo[0].current_database}`);
    
    // Get all users
    const users = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'isActive', 'isVerified', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'ASC']]
    });
    
    log(`Found ${users.length} users in database`);
    
    if (users.length > 0) {
      // Display users
      console.log('\n=== Users Found ===');
      users.forEach((user, index) => {
        const userData = user.get({ plain: true });
        console.log(`${index + 1}. ${userData.firstName} ${userData.lastName} - ${userData.email} (${userData.role}) - Active: ${userData.isActive} - Verified: ${userData.isVerified}`);
      });
      
      // Look for specific users
      const adminUser = users.find(u => u.email === 'admin@propertyark.com');
      const onyedikaUser = users.find(u => u.email === 'onyedika.akoma@gmail.com');
      
      console.log('\n=== Specific Users Check ===');
      console.log(`admin@propertyark.com: ${adminUser ? 'FOUND' : 'NOT FOUND'}`);
      console.log(`onyedika.akoma@gmail.com: ${onyedikaUser ? 'FOUND' : 'NOT FOUND'}`);
      
      if (adminUser) {
        console.log(`Admin details: ${adminUser.firstName} ${adminUser.lastName} - Role: ${adminUser.role}`);
      }
      
      if (onyedikaUser) {
        console.log(`Onyedika details: ${onyedikaUser.firstName} ${onyedikaUser.lastName} - Role: ${onyedikaUser.role}`);
      }
      
      // Save to file
      const fs = require('fs');
      const usersData = users.map(user => user.get({ plain: true }));
      fs.writeFileSync('backend-users.json', JSON.stringify(usersData, null, 2));
      log('Users saved to backend-users.json');
      
      // Create migration SQL for real users
      if (users.length > 1) { // More than just mock vendor
        let sql = '-- Real users migration from backend to Neon\n';
        sql += `-- Generated on: ${new Date().toISOString()}\n\n`;
        
        // Drop existing users
        sql += 'DELETE FROM users;\n\n';
        
        // Insert real users
        sql += 'INSERT INTO users (id, firstName, lastName, email, password, role, isActive, isVerified, createdAt, updatedAt) VALUES\n';
        
        const values = usersData.map(user => {
          const id = user.id || 'gen_random_uuid()';
          const firstName = user.firstName || 'Unknown';
          const lastName = user.lastName || 'User';
          const email = user.email;
          const password = user.password || 'hashed_password_placeholder';
          const role = user.role || 'user';
          const isActive = user.isActive !== undefined ? user.isActive : true;
          const isVerified = user.isVerified !== undefined ? user.isVerified : false;
          const createdAt = user.createdAt || 'CURRENT_TIMESTAMP';
          const updatedAt = user.updatedAt || 'CURRENT_TIMESTAMP';
          
          return `('${id}', '${firstName}', '${lastName}', '${email}', '${password}', '${role}', ${isActive}, ${isVerified}, '${createdAt}', '${updatedAt}')`;
        });
        
        sql += values.join(',\n') + ';\n\n';
        
        sql += '-- Verification\n';
        sql += 'SELECT COUNT(*) as total_users FROM users;\n';
        sql += 'SELECT email, role FROM users ORDER BY createdAt;\n';
        
        fs.writeFileSync('migrate-backend-users.sql', sql);
        log('SQL migration script created: migrate-backend-users.sql');
      }
    } else {
      log('No users found in the database');
    }
    
    await sequelize.close();
    log('Database connection closed');
    
  } catch (error) {
    log(`Error: ${error.message}`, 'error');
    process.exit(1);
  }
};

if (require.main === module) {
  checkUsers();
}

module.exports = { checkUsers };
