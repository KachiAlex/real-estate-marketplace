/**
 * Phase 3 Database Connection Test
 * Tests Sequelize database configuration without needing PostgreSQL
 * Use this to verify migration script structure
 */

const path = require('path');

// Test 1: Check models load
console.log('\n=== Phase 3 Database Tests ===\n');

try {
  console.log('📦 Test 1: Loading Sequelize models...');
  const models = require('./backend/models');
  console.log('✅ Models module loaded');
  
  const modelNames = Object.keys(models).filter(k => k !== 'module' && k !== 'exports');
  console.log(`✅ Found ${modelNames.length} model definitions`);
  console.log('   Models:', modelNames.join(', '));
} catch (error) {
  console.error('❌ Model loading failed:', error.message);
  process.exit(1);
}

// Test 2: Check JWT utilities
try {
  console.log('\n📦 Test 2: Loading JWT utilities...');
  const jwt = require('./backend/utils/jwt');
  console.log('✅ JWT module loaded');
  console.log('   Functions:', Object.keys(jwt).join(', '));
} catch (error) {
  console.error('❌ JWT loading failed:', error.message);
  process.exit(1);
}

// Test 3: Check auth middleware
try {
  console.log('\n📦 Test 3: Loading auth middleware...');
  const auth = require('./backend/middleware/auth');
  console.log('✅ Auth middleware loaded');
  console.log('   Exports:', Object.keys(auth).join(', '));
} catch (error) {
  console.error('❌ Auth middleware loading failed:', error.message);
  process.exit(1);
}

// Test 4: Check auth routes
try {
  console.log('\n📦 Test 4: Loading PostgreSQL auth routes...');
  const authRoutes = require('./backend/routes/authPostgres');
  console.log('✅ PostgreSQL auth routes loaded');
} catch (error) {
  console.error('❌ Auth routes loading failed:', error.message);
  process.exit(1);
}

// Test 5: Check migration script
try {
  console.log('\n📦 Test 5: Checking migration script...');
  const fs = require('fs');
  const migrationPath = path.join(__dirname, 'backend', 'migration', 'migrate.js');
  if (fs.existsSync(migrationPath)) {
    console.log('✅ Migration script found');
    const size = fs.statSync(migrationPath).size;
    console.log(`   Size: ${(size / 1024).toFixed(2)} KB`);
  } else {
    throw new Error('Migration script not found');
  }
} catch (error) {
  console.error('❌ Migration script check failed:', error.message);
  process.exit(1);
}

// Test 6: Check environment configuration
try {
  console.log('\n📦 Test 6: Checking environment configuration...');
  require('dotenv').config();
  
  const required = ['DATABASE_URL', 'JWT_SECRET_POSTGRES', 'JWT_REFRESH_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing environment variables:', missing.join(', '));
    console.warn('   Note: This is normal for local development');
    console.warn('   Add to .env file before running migration');
  } else {
    console.log('✅ All required environment variables set');
  }
  
  console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
  console.log(`   JWT_SECRET_POSTGRES: ${process.env.JWT_SECRET_POSTGRES ? '✅ Set' : '❌ Missing'}`);
  console.log(`   JWT_REFRESH_SECRET: ${process.env.JWT_REFRESH_SECRET ? '✅ Set' : '❌ Missing'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   PORT: ${process.env.PORT || '5000'}`);
} catch (error) {
  console.error('❌ Environment check failed:', error.message);
  process.exit(1);
}

console.log('\n=== All Tests Passed ✅ ===\n');
console.log('Next steps:');
console.log('1. Install PostgreSQL (if not already installed)');
console.log('2. Create database: createdb real_estate_db');
console.log('3. Run migration: node backend/migration/migrate.js');
console.log('\n');

process.exit(0);
