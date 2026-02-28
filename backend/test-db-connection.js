/**
 * Test PostgreSQL Database Connection
 * Verifies connectivity to the Render PostgreSQL database
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const { Sequelize } = require('sequelize');

let DATABASE_URL;
if (process.env.DATABASE_URL) {
  DATABASE_URL = process.env.DATABASE_URL;
} else if (process.env.DB_USER && process.env.DB_PASSWORD && process.env.DB_HOST && process.env.DB_NAME) {
  DATABASE_URL = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME}`;
} else {
  console.error('Missing DATABASE_URL and incomplete DB_* env vars. Set DATABASE_URL or DB_USER/DB_PASSWORD/DB_HOST/DB_NAME.');
  throw new Error('DATABASE configuration missing: set DATABASE_URL or DB_USER/DB_PASSWORD/DB_HOST/DB_NAME');
}

console.log('🔍 Testing PostgreSQL Database Connection...\n');
console.log(`📍 Database: ${process.env.DB_NAME || 'propertyark'}`);
console.log(`🔗 Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`👤 User: ${process.env.DB_USER || 'postgres'}\n`);

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function testConnection() {
  try {
    console.log('⏳ Attempting to connect to PostgreSQL database...');
    await sequelize.authenticate();
    console.log('✅ Connection successful!\n');

    // Get database info
    const result = await sequelize.query("SELECT current_database(), current_user, version();");
    const info = result[0][0];
    
    console.log('📊 Database Information:');
    console.log(`   Current Database: ${info.current_database}`);
    console.log(`   Current User: ${info.current_user}`);
    console.log(`   PostgreSQL Version: ${info.version.split(',')[0]}`);
    
    // List existing tables
    const tables = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log(`\n📋 Existing Tables (${tables[0].length}):`);
    if (tables[0].length === 0) {
      console.log('   (No tables yet - migration will create them)');
    } else {
      tables[0].forEach(t => console.log(`   - ${t.table_name}`));
    }
    
    console.log('\n✅ Database is ready for migration!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error(`Error: ${error.message}\n`);
    
    if (error.original) {
      console.error('Details:', error.original.message);
    }
    
    process.exit(1);
  }
}

testConnection();
