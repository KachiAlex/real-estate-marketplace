#!/usr/bin/env node

/**
 * Firebase Credentials Setup Helper
 * 
 * This script helps set up Firebase Admin credentials.
 * It provides instructions and validates configuration.
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔧 Firebase Admin Credentials Setup Helper\n');
console.log('This script helps you configure Firebase Admin SDK credentials.\n');

// Check for existing credentials
const envFile = path.join(__dirname, '..', '.env');
const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const googleCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const projectId = process.env.FIREBASE_PROJECT_ID;

console.log('📋 Current Configuration:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (serviceAccountKey) {
  try {
    const parsed = JSON.parse(serviceAccountKey);
    console.log('✅ FIREBASE_SERVICE_ACCOUNT_KEY: Set');
    console.log(`   Project ID: ${parsed.project_id || 'Not specified'}`);
    console.log(`   Client Email: ${parsed.client_email || 'Not specified'}`);
  } catch (e) {
    console.log('⚠️  FIREBASE_SERVICE_ACCOUNT_KEY: Invalid JSON');
  }
} else {
  console.log('❌ FIREBASE_SERVICE_ACCOUNT_KEY: Not set');
}

if (googleCredentials) {
  const exists = fs.existsSync(googleCredentials);
  if (exists) {
    console.log(`✅ GOOGLE_APPLICATION_CREDENTIALS: Set (${googleCredentials})`);
  } else {
    console.log(`⚠️  GOOGLE_APPLICATION_CREDENTIALS: File not found (${googleCredentials})`);
  }
} else {
  console.log('❌ GOOGLE_APPLICATION_CREDENTIALS: Not set');
}

if (projectId) {
  console.log(`✅ FIREBASE_PROJECT_ID: ${projectId}`);
} else {
  console.log('❌ FIREBASE_PROJECT_ID: Not set (will use default: real-estate-marketplace-37544)');
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Instructions
console.log('📚 Setup Instructions:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. Go to Firebase Console:');
console.log('   https://console.firebase.google.com/project/real-estate-marketplace-37544');
console.log('   Login with: onyedika.akoma@gmail.com\n');
console.log('2. Navigate to Project Settings → Service Accounts\n');
console.log('3. Click "Generate new private key"\n');
console.log('4. Download the JSON file\n');
console.log('5. Choose one of the following options:\n');
console.log('   OPTION A: Environment Variable (Recommended for Production)');
console.log('   - Copy the entire JSON file content');
console.log('   - Remove all line breaks (make it one line)');
console.log('   - Set as FIREBASE_SERVICE_ACCOUNT_KEY environment variable\n');
console.log('   OPTION B: Service Account File (For Local Development)');
console.log('   - Save the JSON file as: backend/serviceAccountKey.json');
console.log('   - Set: GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json');
console.log('   - Add serviceAccountKey.json to .gitignore (already done)\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check for service account file
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  console.log('✅ Found serviceAccountKey.json file');
  try {
    const content = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log(`   Project ID: ${content.project_id}`);
    console.log(`   Client Email: ${content.client_email}`);
    console.log('\n   To use this file, set in your .env:');
    console.log('   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json\n');
  } catch (e) {
    console.log('⚠️  serviceAccountKey.json exists but is invalid JSON\n');
  }
} else {
  console.log('ℹ️  No serviceAccountKey.json file found');
  console.log('   (This is okay if you\'re using environment variables)\n');
}

// Validation
let isValid = false;
if (serviceAccountKey) {
  try {
    JSON.parse(serviceAccountKey);
    isValid = true;
  } catch (e) {
    console.log('⚠️  FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON\n');
  }
}

if (googleCredentials && fs.existsSync(googleCredentials)) {
  isValid = true;
}

if (isValid || serviceAccountKey || (googleCredentials && fs.existsSync(googleCredentials))) {
  console.log('✅ Configuration looks good!');
  console.log('   You can test it by running: npm start\n');
} else {
  console.log('❌ No valid Firebase credentials found');
  console.log('   Please follow the instructions above to set up credentials\n');
  process.exit(1);
}

console.log('📖 For more details, see: backend/FIRESTORE_SETUP.md\n');

