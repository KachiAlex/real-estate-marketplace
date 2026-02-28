#!/usr/bin/env node

/**
 * Setup Render Database Configuration
 * This script helps configure your local environment to use Render PostgreSQL
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

function setupRenderDatabase() {
  console.log('🚀 Setting up Render PostgreSQL configuration...\n');
  
  // Check if .env file exists
  const envPath = path.resolve(__dirname, '../../.env');
  const envTemplatePath = path.resolve(__dirname, '../../.env.render-template');
  
  if (!fs.existsSync(envPath)) {
    console.log('📋 Creating .env file from template...');
    
    if (fs.existsSync(envTemplatePath)) {
      fs.copyFileSync(envTemplatePath, envPath);
      console.log('✅ .env file created from template');
    } else {
      // Create basic .env file
      const basicEnv = `# Environment
NODE_ENV=development

# Database Configuration (Render PostgreSQL)
# Get these values from your Render PostgreSQL service
DATABASE_URL=postgresql://username:password@host:5432/database_name

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email (development - uses mock)
EMAIL_SERVICE=json

# File Upload (optional - for production)
# CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
# CLOUDINARY_API_KEY=your_cloudinary_api_key
# CLOUDINARY_API_SECRET=your_cloudinary_api_secret
`;
      fs.writeFileSync(envPath, basicEnv);
      console.log('✅ Basic .env file created');
    }
  }
  
  console.log('\n📝 Next Steps:');
  console.log('1. Get your Render PostgreSQL credentials:');
  console.log('   - Go to your Render dashboard');
  console.log('   - Select your PostgreSQL service');
  console.log('   - Click "Connect" to get the connection string');
  console.log('');
  console.log('2. Update your .env file with:');
  console.log('   DATABASE_URL=postgresql://user:pass@host:5432/dbname');
  console.log('');
  console.log('3. Test the connection:');
  console.log('   npm run test-db');
  console.log('');
  console.log('4. Start the server:');
  console.log('   npm run dev');
  console.log('');
  
  // Check current DATABASE_URL
  const currentDbUrl = process.env.DATABASE_URL;
  if (currentDbUrl && !currentDbUrl.includes('localhost')) {
    console.log('✅ DATABASE_URL is configured for external database');
    console.log(`📍 Current: ${currentDbUrl.replace(/:[^:]+@/, ':*****@')}`);
  } else {
    console.log('⚠️  DATABASE_URL is not configured or pointing to localhost');
    console.log('🔧 Please update your .env file with Render PostgreSQL credentials');
  }
}

// Run if called directly
if (require.main === module) {
  setupRenderDatabase();
}

module.exports = { setupRenderDatabase };
