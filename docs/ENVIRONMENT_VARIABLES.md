# Environment Variables Reference

## Overview

This document provides a comprehensive reference for all environment variables used in PropertyArk mobile development. Environment variables allow you to configure the application for different environments (development, staging, production) without modifying code.

## Security Best Practices

### Do's

- ✅ Store sensitive data in environment variables
- ✅ Use `.env.local` for local development (git-ignored)
- ✅ Use EAS secrets for cloud builds
- ✅ Rotate credentials regularly
- ✅ Use strong, unique passwords for keystores
- ✅ Restrict file permissions on `.env.local` (chmod 600)
- ✅ Document all variables with examples

### Don'ts

- ❌ Commit `.env.local` to version control
- ❌ Hardcode API keys in source code
- ❌ Share credentials via email or chat
- ❌ Use weak passwords for keystores
- ❌ Log sensitive data to console
- ❌ Expose credentials in build artifacts
- ❌ Use same credentials across environments

## Setup Instructions

### Create .env.local

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your configuration
nano .env.local

# Restrict file permissions
chmod 600 .env.local
```

### Load Environment Variables

#### Local Development

```bash
# Bash/Zsh
export $(cat .env.local | grep -v '^#' | xargs)

# Or use build scripts (automatic)
./scripts/build-android-debug.sh
./scripts/build-ios-debug.sh
```

#### Cloud Builds (EAS)

```bash
# Set environment variable in EAS
eas secret:create --scope project --name VARIABLE_NAME

# Or add to eas.json
# "env": {
#   "VARIABLE_NAME": "value"
# }
```

## Environment Variables Reference

### Application Configuration

#### NODE_ENV
- **Type**: String
- **Values**: `development`, `staging`, `production`
- **Default**: `development`
- **Purpose**: Specifies the application environment
- **Example**: `NODE_ENV=development`

#### REACT_APP_ENVIRONMENT
- **Type**: String
- **Values**: `development`, `staging`, `production`
- **Default**: `development`
- **Purpose**: React app environment identifier
- **Example**: `REACT_APP_ENVIRONMENT=development`

#### REACT_APP_VERSION
- **Type**: String
- **Format**: Semantic versioning (X.Y.Z)
- **Default**: `1.0.1`
- **Purpose**: Application version number
- **Example**: `REACT_APP_VERSION=1.0.1`

### API Configuration

#### REACT_APP_API_URL
- **Type**: String (URL)
- **Required**: Yes
- **Purpose**: Backend API endpoint
- **Examples**:
  - Development: `http://localhost:5001`
  - Staging: `https://staging-api.propertyark.com`
  - Production: `https://api.propertyark.com`

### Database Configuration

#### DB_USER
- **Type**: String
- **Required**: For local development
- **Purpose**: PostgreSQL database username
- **Example**: `DB_USER=postgres`

#### DB_PASSWORD
- **Type**: String
- **Required**: For local development
- **Purpose**: PostgreSQL database password
- **Security**: Use strong password
- **Example**: `DB_PASSWORD=your-secure-password`

#### DB_HOST
- **Type**: String (hostname or IP)
- **Required**: For local development
- **Purpose**: PostgreSQL database host
- **Example**: `DB_HOST=localhost`

#### DB_PORT
- **Type**: Integer
- **Default**: `5432`
- **Purpose**: PostgreSQL database port
- **Example**: `DB_PORT=15432`

#### DB_NAME
- **Type**: String
- **Required**: For local development
- **Purpose**: PostgreSQL database name
- **Example**: `DB_NAME=real_estate_db`

#### DATABASE_URL
- **Type**: String (connection string)
- **Required**: For production
- **Format**: `postgresql://user:password@host:port/database`
- **Purpose**: Full database connection string
- **Example**: `postgresql://user:pass@db.example.com:5432/propertyark`

### Authentication & Security

#### JWT_SECRET
- **Type**: String
- **Required**: Yes
- **Security**: Use strong, random secret
- **Purpose**: JWT token signing secret
- **Example**: `JWT_SECRET=your-secret-key-min-32-chars`

#### JWT_REFRESH_SECRET
- **Type**: String
- **Required**: Yes
- **Security**: Use strong, random secret
- **Purpose**: JWT refresh token signing secret
- **Example**: `JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars`

### Firebase Configuration

#### REACT_APP_FIREBASE_API_KEY
- **Type**: String
- **Required**: If using Firebase
- **Purpose**: Firebase API key
- **Example**: `REACT_APP_FIREBASE_API_KEY=AIzaSyD...`

#### REACT_APP_FIREBASE_AUTH_DOMAIN
- **Type**: String
- **Required**: If using Firebase
- **Purpose**: Firebase authentication domain
- **Example**: `REACT_APP_FIREBASE_AUTH_DOMAIN=propertyark.firebaseapp.com`

#### REACT_APP_FIREBASE_PROJECT_ID
- **Type**: String
- **Required**: If using Firebase
- **Purpose**: Firebase project ID
- **Example**: `REACT_APP_FIREBASE_PROJECT_ID=propertyark-12345`

#### REACT_APP_FIREBASE_STORAGE_BUCKET
- **Type**: String
- **Required**: If using Firebase
- **Purpose**: Firebase storage bucket
- **Example**: `REACT_APP_FIREBASE_STORAGE_BUCKET=propertyark.appspot.com`

#### REACT_APP_FIREBASE_MESSAGING_SENDER_ID
- **Type**: String
- **Required**: If using Firebase
- **Purpose**: Firebase messaging sender ID
- **Example**: `REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789`

#### REACT_APP_FIREBASE_APP_ID
- **Type**: String
- **Required**: If using Firebase
- **Purpose**: Firebase app ID
- **Example**: `REACT_APP_FIREBASE_APP_ID=1:123456789:web:abc123def456`

### Mobile Build Configuration

#### CAPACITOR_ANDROID_STUDIO_PATH
- **Type**: String (file path)
- **Platform**: macOS
- **Purpose**: Path to Android Studio installation
- **Example**: `CAPACITOR_ANDROID_STUDIO_PATH=/Applications/Android\ Studio.app`

#### CAPACITOR_XCODE_PATH
- **Type**: String (file path)
- **Platform**: macOS
- **Purpose**: Path to Xcode installation
- **Example**: `CAPACITOR_XCODE_PATH=/Applications/Xcode.app`

#### EAS_PROJECT_ID
- **Type**: String (UUID)
- **Required**: For EAS builds
- **Purpose**: Expo Application Services project ID
- **Example**: `EAS_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

#### EAS_BUILD_PROFILE
- **Type**: String
- **Values**: `development`, `staging`, `production`
- **Default**: `development`
- **Purpose**: EAS build profile to use
- **Example**: `EAS_BUILD_PROFILE=development`

### Android Build Configuration

#### ANDROID_SDK_ROOT
- **Type**: String (file path)
- **Required**: Yes
- **Purpose**: Android SDK installation directory
- **Examples**:
  - macOS: `$HOME/Library/Android/sdk`
  - Windows: `C:\Users\<username>\AppData\Local\Android\Sdk`
  - Linux: `$HOME/Android/Sdk`

#### ANDROID_HOME
- **Type**: String (file path)
- **Required**: Yes (alternative to ANDROID_SDK_ROOT)
- **Purpose**: Android SDK home directory
- **Example**: `ANDROID_HOME=$HOME/Library/Android/sdk`

#### ANDROID_NDK_HOME
- **Type**: String (file path)
- **Purpose**: Android NDK installation directory
- **Example**: `ANDROID_NDK_HOME=$HOME/Library/Android/sdk/ndk/25.1.8937393`

#### ANDROID_KEYSTORE_PATH
- **Type**: String (file path)
- **Required**: For release builds
- **Purpose**: Path to Android keystore file
- **Security**: Store in secure location
- **Example**: `ANDROID_KEYSTORE_PATH=$HOME/.propertyark/propertyark.jks`

#### ANDROID_KEYSTORE_PASSWORD
- **Type**: String
- **Required**: For release builds
- **Security**: Use strong password
- **Purpose**: Password for Android keystore
- **Example**: `ANDROID_KEYSTORE_PASSWORD=your-keystore-password`

#### ANDROID_KEY_ALIAS
- **Type**: String
- **Required**: For release builds
- **Purpose**: Key alias in Android keystore
- **Example**: `ANDROID_KEY_ALIAS=propertyark-key`

#### ANDROID_KEY_PASSWORD
- **Type**: String
- **Required**: For release builds
- **Security**: Use strong password
- **Purpose**: Password for Android key
- **Example**: `ANDROID_KEY_PASSWORD=your-key-password`

#### ANDROID_MIN_SDK_VERSION
- **Type**: Integer
- **Default**: `21`
- **Purpose**: Minimum Android API level
- **Example**: `ANDROID_MIN_SDK_VERSION=21`

#### ANDROID_TARGET_SDK_VERSION
- **Type**: Integer
- **Default**: `34`
- **Purpose**: Target Android API level
- **Example**: `ANDROID_TARGET_SDK_VERSION=34`

#### ANDROID_BUILD_TOOLS_VERSION
- **Type**: String
- **Default**: `34.0.0`
- **Purpose**: Android build tools version
- **Example**: `ANDROID_BUILD_TOOLS_VERSION=34.0.0`

### iOS Build Configuration

#### IOS_TEAM_ID
- **Type**: String
- **Required**: For iOS builds
- **Purpose**: Apple Developer Team ID
- **Example**: `IOS_TEAM_ID=XXXXXXXXXX`

#### IOS_BUNDLE_ID
- **Type**: String
- **Required**: For iOS builds
- **Format**: Reverse domain notation
- **Purpose**: iOS app bundle identifier
- **Example**: `IOS_BUNDLE_ID=com.propertyark.app`

#### IOS_DEPLOYMENT_TARGET
- **Type**: String
- **Default**: `14.0`
- **Purpose**: Minimum iOS version
- **Example**: `IOS_DEPLOYMENT_TARGET=14.0`

#### IOS_CERTIFICATE_ID
- **Type**: String
- **Purpose**: iOS certificate identifier
- **Example**: `IOS_CERTIFICATE_ID=your-certificate-id`

#### IOS_PROVISIONING_PROFILE_ID
- **Type**: String
- **Purpose**: iOS provisioning profile identifier
- **Example**: `IOS_PROVISIONING_PROFILE_ID=your-profile-id`

### Third-Party Services

#### REACT_APP_GOOGLE_MAPS_API_KEY
- **Type**: String
- **Required**: If using Google Maps
- **Purpose**: Google Maps API key
- **Security**: Restrict to mobile apps
- **Example**: `REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyD...`

#### REACT_APP_GOOGLE_CLIENT_ID
- **Type**: String
- **Required**: If using Google OAuth
- **Purpose**: Google OAuth client ID
- **Example**: `REACT_APP_GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com`

#### REACT_APP_GOOGLE_CLIENT_SECRET
- **Type**: String
- **Required**: If using Google OAuth
- **Security**: Keep secret
- **Purpose**: Google OAuth client secret
- **Example**: `REACT_APP_GOOGLE_CLIENT_SECRET=your-client-secret`

#### SENDGRID_API_KEY
- **Type**: String
- **Required**: If using SendGrid
- **Security**: Keep secret
- **Purpose**: SendGrid email API key
- **Example**: `SENDGRID_API_KEY=SG.your-api-key`

#### SENDGRID_FROM_EMAIL
- **Type**: String (email)
- **Required**: If using SendGrid
- **Purpose**: Default sender email address
- **Example**: `SENDGRID_FROM_EMAIL=noreply@propertyark.com`

#### REACT_APP_PAYSTACK_PUBLIC_KEY
- **Type**: String
- **Required**: If using Paystack
- **Purpose**: Paystack public key
- **Example**: `REACT_APP_PAYSTACK_PUBLIC_KEY=pk_live_...`

#### PAYSTACK_SECRET_KEY
- **Type**: String
- **Required**: If using Paystack
- **Security**: Keep secret
- **Purpose**: Paystack secret key
- **Example**: `PAYSTACK_SECRET_KEY=sk_live_...`

### Analytics & Monitoring

#### REACT_APP_SENTRY_DSN
- **Type**: String (URL)
- **Required**: If using Sentry
- **Purpose**: Sentry error tracking DSN
- **Example**: `REACT_APP_SENTRY_DSN=https://key@sentry.io/project-id`

#### SENTRY_AUTH_TOKEN
- **Type**: String
- **Required**: If using Sentry
- **Security**: Keep secret
- **Purpose**: Sentry authentication token
- **Example**: `SENTRY_AUTH_TOKEN=your-auth-token`

#### REACT_APP_ANALYTICS_TOKEN
- **Type**: String
- **Purpose**: Analytics service token
- **Example**: `REACT_APP_ANALYTICS_TOKEN=your-analytics-token`

### Development Server Configuration

#### PORT
- **Type**: Integer
- **Default**: `5001`
- **Purpose**: Backend server port
- **Example**: `PORT=5001`

#### FRONTEND_URL
- **Type**: String (URL)
- **Default**: `http://localhost:3000`
- **Purpose**: Frontend application URL
- **Example**: `FRONTEND_URL=http://localhost:3000`

#### BACKEND_URL
- **Type**: String (URL)
- **Default**: `http://localhost:5001`
- **Purpose**: Backend API URL
- **Example**: `BACKEND_URL=http://localhost:5001`

### Feature Flags

#### REACT_APP_ENABLE_LIVE_CHAT
- **Type**: Boolean
- **Values**: `true`, `false`
- **Default**: `true`
- **Purpose**: Enable/disable live chat feature
- **Example**: `REACT_APP_ENABLE_LIVE_CHAT=true`

#### REACT_APP_ENABLE_ANALYTICS
- **Type**: Boolean
- **Values**: `true`, `false`
- **Default**: `true`
- **Purpose**: Enable/disable analytics
- **Example**: `REACT_APP_ENABLE_ANALYTICS=true`

#### REACT_APP_ENABLE_ERROR_TRACKING
- **Type**: Boolean
- **Values**: `true`, `false`
- **Default**: `true`
- **Purpose**: Enable/disable error tracking
- **Example**: `REACT_APP_ENABLE_ERROR_TRACKING=true`

### Logging Configuration

#### LOG_LEVEL
- **Type**: String
- **Values**: `debug`, `info`, `warn`, `error`
- **Default**: `debug`
- **Purpose**: Backend logging level
- **Example**: `LOG_LEVEL=debug`

#### REACT_APP_LOG_LEVEL
- **Type**: String
- **Values**: `debug`, `info`, `warn`, `error`
- **Default**: `debug`
- **Purpose**: Frontend logging level
- **Example**: `REACT_APP_LOG_LEVEL=debug`

### Build Artifact Configuration

#### BUILD_OUTPUT_DIR
- **Type**: String (file path)
- **Default**: `./build`
- **Purpose**: Output directory for web build
- **Example**: `BUILD_OUTPUT_DIR=./build`

#### APK_OUTPUT_DIR
- **Type**: String (file path)
- **Default**: `./android/app/build/outputs/apk`
- **Purpose**: Output directory for Android APK
- **Example**: `APK_OUTPUT_DIR=./android/app/build/outputs/apk`

#### AAB_OUTPUT_DIR
- **Type**: String (file path)
- **Default**: `./android/app/build/outputs/bundle`
- **Purpose**: Output directory for Android AAB
- **Example**: `AAB_OUTPUT_DIR=./android/app/build/outputs/bundle`

#### IPA_OUTPUT_DIR
- **Type**: String (file path)
- **Default**: `./ios/build/outputs`
- **Purpose**: Output directory for iOS IPA
- **Example**: `IPA_OUTPUT_DIR=./ios/build/outputs`

## Environment-Specific Examples

### Development Environment

```bash
NODE_ENV=development
REACT_APP_ENVIRONMENT=development
REACT_APP_API_URL=http://localhost:5001
REACT_APP_LOG_LEVEL=debug
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ERROR_TRACKING=true
EAS_BUILD_PROFILE=development
```

### Staging Environment

```bash
NODE_ENV=staging
REACT_APP_ENVIRONMENT=staging
REACT_APP_API_URL=https://staging-api.propertyark.com
REACT_APP_LOG_LEVEL=info
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ERROR_TRACKING=true
EAS_BUILD_PROFILE=staging
```

### Production Environment

```bash
NODE_ENV=production
REACT_APP_ENVIRONMENT=production
REACT_APP_API_URL=https://api.propertyark.com
REACT_APP_LOG_LEVEL=warn
REACT_APP_ENABLE_ANALYTICS=true
REACT_APP_ENABLE_ERROR_TRACKING=true
EAS_BUILD_PROFILE=production
```

## Validation

### Validate Environment Variables

```bash
# Check if all required variables are set
./scripts/validate-setup.sh

# Or manually check
echo $REACT_APP_API_URL
echo $ANDROID_SDK_ROOT
echo $IOS_TEAM_ID
```

### Common Issues

#### Variable Not Found

```bash
# Ensure .env.local is loaded
export $(cat .env.local | grep -v '^#' | xargs)

# Verify variable is set
echo $VARIABLE_NAME
```

#### Wrong Value

```bash
# Check current value
echo $VARIABLE_NAME

# Update in .env.local
nano .env.local

# Reload environment
export $(cat .env.local | grep -v '^#' | xargs)
```

## Next Steps

1. **Create .env.local**: `cp .env.example .env.local`
2. **Configure variables**: Edit `.env.local` with your values
3. **Validate setup**: Run `./scripts/validate-setup.sh`
4. **Build app**: Run `./scripts/build-android-debug.sh` or `./scripts/build-ios-debug.sh`

## External Resources

- [Environment Variables Best Practices](https://12factor.net/config)
- [Capacitor Environment Variables](https://capacitorjs.com/docs/basics/environment-variables)
- [React Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)

---

**Need help?** See [Troubleshooting Guide](./TROUBLESHOOTING.md) for common issues.
