#!/usr/bin/env node

/**
 * Extract real users from Render database
 */

const { Sequelize } = require('sequelize');

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
};

const extractUsers = async () => {
  try {
    // Connect to Render database
    const sequelize = new Sequelize(
      'postgresql://propertyark_user:oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej@dpg-d61qns24d50c7380u57g-a.oregon-postgres.render.com/propertyark',
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
    
    log('Connecting to Render database...');
    await sequelize.authenticate();
    log('Render database connected successfully');
    
    // Check what tables exist
    const [tables] = await sequelize.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    log('Tables found:');
    tables.forEach(table => {
      log(`  - ${table.tablename}`);
    });
    
    // Try to get users from different possible table names
    let users = [];
    const possibleTables = ['users', 'User', 'user', 'accounts', 'profiles'];
    
    for (const tableName of possibleTables) {
      try {
        const [result] = await sequelize.query(`
          SELECT COUNT(*) as count FROM ${tableName}
        `);
        
        if (parseInt(result[0].count) > 0) {
          log(`Found ${result[0].count} records in ${tableName} table`);
          
          // Get sample data
          const [sample] = await sequelize.query(`
            SELECT * FROM ${tableName} LIMIT 5
          `);
          
          log(`Sample data from ${tableName}:`);
          sample.forEach((row, index) => {
            log(`  ${index + 1}. ${JSON.stringify(row)}`);
          });
          
          // Get all users if this looks like the right table
          if (row.email || row.Email || row.EMAIL) {
            const [allUsers] = await sequelize.query(`
              SELECT * FROM ${tableName}
            `);
            users = allUsers;
            break;
          }
        }
      } catch (error) {
        // Table doesn't exist, continue
      }
    }
    
    if (users.length === 0) {
      log('No users found in any table');
      
      // Try direct SQL to find any user-like records
      const [searchResult] = await sequelize.query(`
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE column_name ILIKE '%email%' 
        AND table_schema = 'public'
      `);
      
      if (searchResult.length > 0) {
        log('Found tables with email columns:');
        searchResult.forEach(item => {
          log(`  - ${item.table_name}.${item.column_name}`);
        });
        
        // Try to get data from the first table with email
        const firstTable = searchResult[0].table_name;
        const [emailData] = await sequelize.query(`
          SELECT * FROM ${firstTable} LIMIT 10
        `);
        
        log(`Data from ${firstTable}:`);
        emailData.forEach((row, index) => {
          log(`  ${index + 1}. ${JSON.stringify(row)}`);
        });
      }
    } else {
      log(`Found ${users.length} users total`);
      
      // Save users to file
      const fs = require('fs');
      fs.writeFileSync('render-users.json', JSON.stringify(users, null, 2));
      log('Users saved to render-users.json');
      
      // Create migration SQL
      let sql = '-- Real users migration from Render to Neon\n';
      sql += `-- Generated on: ${new Date().toISOString()}\n\n`;
      
      // Drop existing users
      sql += 'DELETE FROM users;\n\n';
      
      // Insert real users
      sql += 'INSERT INTO users (id, firstName, lastName, email, password, role, isActive, isVerified, createdAt, updatedAt) VALUES\n';
      
      const values = users.map(user => {
        const id = user.id || 'gen_random_uuid()';
        const firstName = user.firstName || user.first_name || user.FirstName || 'Unknown';
        const lastName = user.lastName || user.last_name || user.LastName || 'User';
        const email = user.email || user.Email;
        const password = user.password || 'hashed_password_placeholder';
        const role = user.role || 'user';
        const isActive = user.isActive !== undefined ? user.isActive : true;
        const isVerified = user.isVerified !== undefined ? user.isVerified : false;
        const createdAt = user.createdAt || user.created_at || 'CURRENT_TIMESTAMP';
        const updatedAt = user.updatedAt || user.updated_at || 'CURRENT_TIMESTAMP';
        
        return `('${id}', '${firstName}', '${lastName}', '${email}', '${password}', '${role}', ${isActive}, ${isVerified}, '${createdAt}', '${updatedAt}')`;
      });
      
      sql += values.join(',\n') + ';\n\n';
      
      sql += '-- Verification\n';
      sql += 'SELECT COUNT(*) as total_users FROM users;\n';
      sql += 'SELECT email, role FROM users ORDER BY createdAt;\n';
      
      fs.writeFileSync('migrate-real-users.sql', sql);
      log('SQL migration script created: migrate-real-users.sql');
    }
    
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
