const { Sequelize } = require('sequelize');
require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL;

console.log('Testing PostgreSQL connection...');
console.log('DATABASE_URL:', DATABASE_URL ? 'Set' : 'Not set');

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection successful!');
    console.log('Database details:');
    console.log('- Host:', sequelize.config.host);
    console.log('- Database:', sequelize.config.database);
    console.log('- User:', sequelize.config.username);
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:');
    console.error('Error:', error.message);
    if (error.original) {
      console.error('Original error:', error.original.message);
    }
  } finally {
    await sequelize.close();
  }
}

testConnection();