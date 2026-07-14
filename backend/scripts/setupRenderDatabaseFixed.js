#!/usr/bin/env node

/**
 * Render Database Setup Script
 * 
 * This script helps configure your application to use Render PostgreSQL database
 * instead of local PostgreSQL.
 * 
 * Usage: node setupRenderDatabaseFixed.js
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ask(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset}: `, resolve);
  });
}

function parseDatabaseUrl(url) {
  try {
    const urlObj = new URL(url);
    return {
      user: urlObj.username,
      password: urlObj.password,
      host: urlObj.hostname,
      port: urlObj.port || '5432',
      database: urlObj.pathname.substring(1) // Remove leading /
    };
  } catch (error) {
    log('Invalid DATABASE_URL format', 'red');
    return null;
  }
}

async function updateEnvFile(config) {
  const envPath = path.join(__dirname, '..', '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '..', '.env.example');
  
  let envContent = '';
  
  // Try to read existing .env file
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    log('Found existing .env file', 'yellow');
  } else if (fs.existsSync(envExamplePath)) {
    envContent = fs.readFileSync(envExamplePath, 'utf8');
    log('Using .env.example as template', 'yellow');
  } else {
    // Create basic .env content
    envContent = `# Environment Variables
NODE_ENV=development
PORT=5001
FRONTEND_URL=http://localhost:3000

# Database Configuration
DATABASE_URL=${config.databaseUrl}
DB_USER=${config.user}
DB_PASSWORD=${config.password}
DB_HOST=${config.host}
DB_PORT=${config.port}
DB_NAME=${config.database}
DB_REQUIRE_SSL=true
DB_REJECT_UNAUTHORIZED=false

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRY=24h
JWT_REFRESH_EXPIRY=7d

# Firebase (if needed)
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key-here
FIREBASE_API_KEY=your-firebase-api-key-here

# Feature Flags
ALLOW_MOCK_AUTH=true
`;
  }
  
  // Update database-related variables
  const lines = envContent.split('\n');
  const updatedLines = [];
  
  for (const line of lines) {
    if (line.startsWith('DATABASE_URL=')) {
      updatedLines.push(`DATABASE_URL=${config.databaseUrl}`);
    } else if (line.startsWith('DB_USER=')) {
      updatedLines.push(`DB_USER=${config.user}`);
    } else if (line.startsWith('DB_PASSWORD=')) {
      updatedLines.push(`DB_PASSWORD=${config.password}`);
    } else if (line.startsWith('DB_HOST=')) {
      updatedLines.push(`DB_HOST=${config.host}`);
    } else if (line.startsWith('DB_PORT=')) {
      updatedLines.push(`DB_PORT=${config.port}`);
    } else if (line.startsWith('DB_NAME=')) {
      updatedLines.push(`DB_NAME=${config.database}`);
    } else if (line.startsWith('DB_REQUIRE_SSL=')) {
      updatedLines.push('DB_REQUIRE_SSL=true');
    } else if (line.startsWith('DB_REJECT_UNAUTHORIZED=')) {
      updatedLines.push('DB_REJECT_UNAUTHORIZED=false');
    } else {
      updatedLines.push(line);
    }
  }
  
  // Write updated .env file
  fs.writeFileSync(envPath, updatedLines.join('\n'));
  log(`✅ Updated .env file at: ${envPath}`, 'green');
}

async function testConnection(config) {
  log('\n🔍 Testing database connection...', 'yellow');
  
  try {
    // Try to load and test database connection
    const db = require('../config/sequelizeDb');
    
    // Temporarily update environment variables
    process.env.DATABASE_URL = config.databaseUrl;
    process.env.DB_USER = config.user;
    process.env.DB_PASSWORD = config.password;
    process.env.DB_HOST = config.host;
    process.env.DB_PORT = config.port;
    process.env.DB_NAME = config.database;
    process.env.DB_REQUIRE_SSL = 'true';
    process.env.DB_REJECT_UNAUTHORIZED = 'false';
    
    // Test authentication
    await db.sequelize.authenticate();
    log('✅ Database connection successful!', 'green');
    
    // Test basic query
    await db.sequelize.query('SELECT version()');
    log('✅ Database query test successful!', 'green');
    
    return true;
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function createBackup() {
  const envPath = path.join(__dirname, '..', '..', '.env');
  if (fs.existsSync(envPath)) {
    const backupPath = `${envPath}.backup.${Date.now()}`;
    fs.copyFileSync(envPath, backupPath);
    log(`📋 Created backup: ${backupPath}`, 'yellow');
  }
}

async function main() {
  log('\n🚀 Render Database Setup Script', 'bright');
  log('=====================================', 'bright');
  log('\nThis script will help you configure your application to use Render PostgreSQL database.\n', 'cyan');
  
  log('📋 Prerequisites:', 'yellow');
  log('1. You must have created a PostgreSQL database on Render.com');
  log('2. You need the database connection details from Render dashboard\n');
  
  // Get database URL from user
  const databaseUrl = await ask(
    '\nEnter your Render DATABASE_URL (external database URL from Render dashboard)\n' +
    'Example: postgresql://user:password@host:port/database'
  );
  
  if (!databaseUrl) {
    log('❌ DATABASE_URL is required', 'red');
    process.exit(1);
  }
  
  // Parse database URL
  const config = parseDatabaseUrl(databaseUrl);
  if (!config) {
    log('❌ Invalid DATABASE_URL format', 'red');
    process.exit(1);
  }
  
  log('\n📊 Parsed Database Configuration:', 'blue');
  log(`   Host: ${config.host}`, 'blue');
  log(`   Port: ${config.port}`, 'blue');
  log(`   Database: ${config.database}`, 'blue');
  log(`   User: ${config.user}`, 'blue');
  log(`   Password: ${'*'.repeat(config.password.length)}`, 'blue');
  
  // Confirm configuration
  const confirm = await ask('\nIs this configuration correct? (y/n)');
  if (confirm.toLowerCase() !== 'y') {
    log('❌ Setup cancelled', 'red');
    process.exit(0);
  }
  
  // Create backup of existing .env
  await createBackup();
  
  // Update .env file
  config.databaseUrl = databaseUrl;
  await updateEnvFile(config);
  
  // Test connection
  const connectionSuccess = await testConnection(config);
  
  if (connectionSuccess) {
    log('\n🎉 Setup completed successfully!', 'green');
    log('\n📝 Next steps:', 'yellow');
    log('1. Restart your backend server: npm run dev', 'yellow');
    log('2. Run database migrations if needed', 'yellow');
    log('3. Test your application endpoints', 'yellow');
    log('\n💡 Your application is now configured to use Render PostgreSQL!', 'green');
  } else {
    log('\n❌ Setup failed. Please check your database credentials and try again.', 'red');
    log('\n🔧 Troubleshooting tips:', 'yellow');
    log('1. Verify DATABASE_URL is correct (copy from Render dashboard)', 'yellow');
    log('2. Check if database is "Available" on Render dashboard', 'yellow');
    log('3. Ensure no IP restrictions on database', 'yellow');
    log('4. Try connecting with psql command first', 'yellow');
  }
  
  rl.close();
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  log('\n\n❌ Setup cancelled by user', 'red');
  rl.close();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main().catch(error => {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    rl.close();
    process.exit(1);
  });
}

module.exports = { parseDatabaseUrl, updateEnvFile, testConnection };
