#!/usr/bin/env node

/**
 * Convert JSON data to SQL INSERT statements for Neon migration
 */

const fs = require('fs');
const path = require('path');

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
};

const convertPropertiesToSQL = (propertiesData) => {
  let sql = '-- Properties data import\n';
  sql += 'INSERT INTO properties (id, title, description, price, type, status, location, city, state, ownerId, createdAt, updatedAt) VALUES\n';
  
  const values = propertiesData.map(property => {
    const id = property.id || 'gen_random_uuid()';
    const title = property.title ? `'${property.title.replace(/'/g, "''")}'` : 'NULL';
    const description = property.description ? `'${property.description.replace(/'/g, "''")}'` : 'NULL';
    const price = property.price || 0;
    const type = property.type ? `'${property.type}'` : "'residential'";
    const status = property.status ? `'${property.status}'` : "'active'";
    const location = property.location ? `'${JSON.stringify(property.location).replace(/'/g, "''")}'` : 'NULL';
    const city = property.city || property.location?.city || 'NULL';
    const state = property.state || property.location?.state || 'NULL';
    const ownerId = property.ownerId || "'550e8400-e29b-41d4-a716-446655440001'";
    const createdAt = property.createdAt || 'CURRENT_TIMESTAMP';
    const updatedAt = property.updatedAt || 'CURRENT_TIMESTAMP';
    
    return `(${id}, ${title}, ${description}, ${price}, ${type}, ${status}, ${location}, ${city}, ${state}, ${ownerId}, ${createdAt}, ${updatedAt})`;
  });
  
  sql += values.join(',\n') + ';\n\n';
  return sql;
};

const convertUsersToSQL = (usersData) => {
  let sql = '-- Users data import\n';
  sql += 'INSERT INTO users (id, firstName, lastName, email, password, role, isActive, isVerified, createdAt, updatedAt) VALUES\n';
  
  const values = usersData.map(user => {
    const id = user.id || 'gen_random_uuid()';
    const firstName = user.firstName ? `'${user.firstName.replace(/'/g, "''")}'` : 'NULL';
    const lastName = user.lastName ? `'${user.lastName.replace(/'/g, "''")}'` : 'NULL';
    const email = user.email ? `'${user.email}'` : 'NULL';
    const password = user.password ? `'${user.password}'` : 'NULL';
    const role = user.role ? `'${user.role}'` : "'user'";
    const isActive = user.isActive !== undefined ? user.isActive : true;
    const isVerified = user.isVerified !== undefined ? user.isVerified : false;
    const createdAt = user.createdAt || 'CURRENT_TIMESTAMP';
    const updatedAt = user.updatedAt || 'CURRENT_TIMESTAMP';
    
    return `(${id}, ${firstName}, ${lastName}, ${email}, ${password}, ${role}, ${isActive}, ${isVerified}, ${createdAt}, ${updatedAt})`;
  });
  
  sql += values.join(',\n') + ';\n\n';
  return sql;
};

const createMigrationSQL = () => {
  try {
    log('Converting JSON data to SQL...');
    
    // Read properties data
    let propertiesData = [];
    if (fs.existsSync('properties.json')) {
      const propertiesContent = fs.readFileSync('properties.json', 'utf8');
      propertiesData = JSON.parse(propertiesContent);
      log(`Loaded ${propertiesData.length} properties`);
    }
    
    // Read users data (if exists)
    let usersData = [];
    if (fs.existsSync('users.json')) {
      const usersContent = fs.readFileSync('users.json', 'utf8');
      usersData = JSON.parse(usersContent);
      log(`Loaded ${usersData.length} users`);
    } else {
      // Create mock user data
      usersData = [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          firstName: 'Mock',
          lastName: 'Vendor',
          email: 'mock.vendor@propertyark.com',
          password: 'hashed_password_here',
          role: 'vendor',
          isActive: true,
          isVerified: true
        }
      ];
      log('Created mock user data');
    }
    
    // Create SQL content
    let sql = '-- Neon Database Migration Script\n';
    sql += `-- Generated on: ${new Date().toISOString()}\n\n`;
    
    // Drop and recreate tables
    sql += '-- Drop existing tables\n';
    sql += 'DROP TABLE IF EXISTS properties CASCADE;\n';
    sql += 'DROP TABLE IF EXISTS users CASCADE;\n\n';
    
    // Create tables
    sql += '-- Create tables\n';
    sql += `CREATE TABLE users (
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

CREATE TABLE properties (
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

`;
    
    // Insert data
    if (usersData.length > 0) {
      sql += convertUsersToSQL(usersData);
    }
    
    if (propertiesData.length > 0) {
      sql += convertPropertiesToSQL(propertiesData);
    }
    
    // Create indexes
    sql += '-- Create indexes\n';
    sql += 'CREATE INDEX IF NOT EXISTS idx_properties_ownerId ON properties(ownerId);\n';
    sql += 'CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);\n';
    sql += 'CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);\n';
    sql += 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);\n';
    sql += 'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);\n\n';
    
    // Grant permissions
    sql += '-- Grant permissions\n';
    sql += 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO neondb_owner;\n';
    sql += 'GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO neondb_owner;\n\n';
    
    // Verification queries
    sql += '-- Verification queries\n';
    sql += 'SELECT COUNT(*) as user_count FROM users;\n';
    sql += 'SELECT COUNT(*) as property_count FROM properties;\n';
    sql += 'SELECT title, city, price FROM properties LIMIT 5;\n';
    
    // Write SQL file
    const sqlFile = 'neon-migration.sql';
    fs.writeFileSync(sqlFile, sql);
    
    log(`Migration SQL created: ${sqlFile}`);
    log(`Ready to import to Neon with: psql "NEON_DATABASE_URL" < ${sqlFile}`);
    
    return sqlFile;
    
  } catch (error) {
    log(`Conversion failed: ${error.message}`, 'error');
    throw error;
  }
};

if (require.main === module) {
  createMigrationSQL();
}

module.exports = { createMigrationSQL };
