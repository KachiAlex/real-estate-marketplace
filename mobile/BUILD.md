# PropertyArk Mobile APK Build Guide

## Overview

This document provides comprehensive instructions for building the PropertyArk mobile application as an Android APK. The build process uses Expo 54.0.33 with React Native 0.81.5 and supports both local builds and EAS cloud builds.

## Prerequisites

### System Requirements

- **Node.js**: Version 16.0.0 or later
- **npm**: Version 8.0.0 or later (comes with Node.js)
- **Java Development Kit (JDK)**: Version 11 or later
- **Android SDK**: API level 34 (target) and 24 (minimum)
- **Gradle**: Version 8.0 or later (managed by Expo)
- **Disk Space**: Minimum 10GB free space
- **RAM**: Minimum 4GB available for build process
- **Operating System**: Windows, macOS, or Linux

### Verify Prerequisites

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Java version
java -version

# Check available disk space
# Windows: Check C: drive properties
# macOS/Linux: df -h
```

## Installation

### 1. Install Dependencies

```bash
cd mobile
npm install
```

This installs all required dependencies including:
- Expo 54.0.33
- React Native 0.81.5
- Expo Router 6.0.23
- React Navigation
- TypeScript support

### 2. Verify Installation

```bash
# Verify React Native version
npm list react-native

# Expected output: react-native@0.81.5
```

## Local Build Process

### Step 1: Prepare Build Environment

```bash
# Clear previous build artifacts
npm run clean-build

# Or manually:
rm -rf node_modules/.cache
rm -rf android/build
rm -rf android/.gradle
```

### Step 2: Configure Environment Variables

Environment variables are configured using `.env` files. The application supports environment-specific configurations for development, staging, and production.

#### Environment Files

The following environment files are provided:

- **`.env.example`**: Template with all available environment variables
- **`.env.development`**: Development environment configuration (local testing)
- **`.env.production`**: Production environment configuration (release builds)

#### Using Environment Files

For development builds, use `.env.development`:
```bash
cp .env.development .env
```

For production builds, use `.env.production`:
```bash
cp .env.production .env
```

#### Environment Variables Reference

See the [Environment Configuration](#environment-configuration) section below for detailed documentation of all available environment variables.

### Step 3: Build APK Locally

```bash
# Build for Android
npm run android

# Or use Expo CLI directly:
npx expo build:android --local
```

### Step 4: Verify Build Output

The signed APK will be generated at:
```
android/app/build/outputs/apk/release/app-release.apk
```

Verify the APK:
```bash
# Check APK file exists and has reasonable size (>50MB)
ls -lh android/app/build/outputs/apk/release/app-release.apk

# Verify APK signature
jarsigner -verify -verbose android/app/build/outputs/apk/release/app-release.apk
```

## EAS Cloud Build Process

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Authenticate with EAS

```bash
eas login
```

Follow the prompts to authenticate with your Expo account.

### Step 3: Configure EAS Build

The `eas.json` file is already configured with:
- Development build for testing
- Preview build for staging
- Production build for release

### Step 4: Build APK in Cloud

```bash
# Build production APK
eas build --platform android --profile production

# Build preview APK
eas build --platform android --profile preview

# Build development APK
eas build --platform android --profile development
```

### Step 5: Download APK

After the build completes, EAS will provide a download link. Download the APK from the link or use:

```bash
# List recent builds
eas build:list

# Download specific build
eas build:download <build-id>
```

## Build Configuration Details

### app.json Configuration

The `app.json` file contains:

```json
{
  "expo": {
    "name": "PropertyArk",
    "slug": "propertyark-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "scheme": "propertyark",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": false,
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.propertyark.mobile",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.propertyark.mobile",
      "versionCode": 1,
      "permissions": [
        "android.permission.INTERNET",
        "android.permission.ACCESS_NETWORK_STATE"
      ]
    }
  }
}
```

### TypeScript Configuration

The `tsconfig.json` file extends Expo's base configuration:

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Gradle Configuration

Gradle is automatically configured by Expo with:
- Target SDK: 34
- Minimum SDK: 24
- Architecture: ARM64
- Heap Memory: 4GB (configurable)

## Memory Configuration

### Set Heap Memory for Build

```bash
# Windows (PowerShell)
$env:GRADLE_OPTS = "-Xmx4g -XX:MaxPermSize=512m"

# macOS/Linux (Bash)
export GRADLE_OPTS="-Xmx4g -XX:MaxPermSize=512m"
```

### Verify Memory Allocation

```bash
# Check available memory
# Windows: Task Manager > Performance
# macOS: Activity Monitor
# Linux: free -h

# Verify Java heap settings
java -Xmx4g -version
```

## Troubleshooting

### Build Fails with "Out of Memory"

**Cause**: Insufficient heap memory during compilation

**Solution**:
```bash
# Increase heap memory
export GRADLE_OPTS="-Xmx6g -XX:MaxPermSize=1024m"

# Clear Gradle cache
rm -rf ~/.gradle/caches

# Retry build
npm run android
```

### Build Fails with "Gradle Sync Failed"

**Cause**: Dependency conflict or corrupted cache

**Solution**:
```bash
# Clear all caches
rm -rf node_modules
rm -rf android/.gradle
rm -rf ~/.gradle/caches

# Reinstall dependencies
npm install

# Retry build
npm run android
```

### Build Fails with "SDK Not Found"

**Cause**: Android SDK not installed or not in PATH

**Solution**:
1. Install Android SDK via Android Studio
2. Set ANDROID_HOME environment variable:
   ```bash
   # Windows
   setx ANDROID_HOME "C:\Users\[username]\AppData\Local\Android\Sdk"
   
   # macOS
   export ANDROID_HOME=~/Library/Android/Sdk
   
   # Linux
   export ANDROID_HOME=~/Android/Sdk
   ```
3. Add SDK tools to PATH:
   ```bash
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

### Build Fails with "Signing Failed"

**Cause**: Invalid keystore or missing keystore credentials

**Solution**:
1. Verify keystore file exists
2. Check keystore password is correct
3. Verify key alias and key password
4. Regenerate keystore if corrupted:
   ```bash
   keytool -genkey -v -keystore propertyark.keystore \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias propertyark
   ```

### Build Fails with "Permission Denied"

**Cause**: File permission issues

**Solution**:
```bash
# Fix file permissions
chmod -R 755 mobile/

# Clear build artifacts
rm -rf android/build

# Retry build
npm run android
```

### APK Installation Fails

**Cause**: APK not compatible with device or already installed

**Solution**:
```bash
# Uninstall existing app
adb uninstall com.propertyark.mobile

# Install APK
adb install android/app/build/outputs/apk/release/app-release.apk

# Verify installation
adb shell pm list packages | grep propertyark
```

## Dependency Compatibility

### Core Dependencies

| Package | Version | Compatibility |
|---------|---------|---|
| expo | 54.0.33 | ✓ Compatible with RN 0.81.5 |
| react-native | 0.81.5 | ✓ Latest stable |
| expo-router | 6.0.23 | ✓ Compatible with RN 0.81.5 |
| react | 19.1.0 | ✓ Latest stable |
| typescript | 5.9.2 | ✓ Latest stable |

### Dependency Validation

```bash
# Check for dependency conflicts
npm audit

# Check for outdated dependencies
npm outdated

# Validate React Native compatibility
npm list react-native
```

## Performance Optimization

### Build Performance

1. **Use Gradle Daemon**:
   ```bash
   export GRADLE_OPTS="-Xmx4g -XX:+UseG1GC"
   ```

2. **Enable Parallel Builds**:
   ```bash
   export GRADLE_OPTS="-Xmx4g -XX:+UseG1GC -Dorg.gradle.parallel=true"
   ```

3. **Use Build Cache**:
   ```bash
   export GRADLE_OPTS="-Xmx4g -XX:+UseG1GC -Dorg.gradle.caching=true"
   ```

### App Performance

1. **Monitor Memory Usage**:
   ```bash
   adb shell dumpsys meminfo com.propertyark.mobile
   ```

2. **Profile App Performance**:
   - Use Android Studio Profiler
   - Monitor CPU, Memory, Network usage
   - Identify performance bottlenecks

## Verification Checklist

Before releasing the APK, verify:

- [ ] React Native version is 0.81.5 or later
- [ ] All dependencies are compatible
- [ ] app.json has correct PropertyArk branding
- [ ] TypeScript configuration is valid
- [ ] APK is signed with valid keystore
- [ ] APK installs on Android 7.0+ devices
- [ ] App launches without crashes
- [ ] Backend connectivity verified
- [ ] All permissions are requested correctly
- [ ] Splash screen displays correctly

## Version Management

### Update Version

```bash
# Update version in app.json
{
  "expo": {
    "version": "1.0.1"
  }
}

# Update version code for Android
{
  "android": {
    "versionCode": 2
  }
}
```

### Build Version History

| Version | Build Date | Status | Notes |
|---------|-----------|--------|-------|
| 1.0.0 | 2024-01-XX | ✓ Released | Initial release |

## Support and Resources

- **Expo Documentation**: https://docs.expo.dev/
- **React Native Documentation**: https://reactnative.dev/
- **Android Documentation**: https://developer.android.com/
- **Expo Community**: https://chat.expo.dev/

## Additional Commands

```bash
# Start development server
npm start

# Start Android emulator
npm run android

# Start iOS simulator
npm run ios

# Run linter
npm run lint

# Clean build
npm run clean-build

# Reset project
npm run reset-project
```

## Environment-Specific Builds

### Development Build

```bash
# Build for development
eas build --platform android --profile development

# Configuration in eas.json:
{
  "development": {
    "developmentClient": true,
    "distribution": "internal"
  }
}
```

### Staging Build

```bash
# Build for staging
eas build --platform android --profile preview

# Configuration in eas.json:
{
  "preview": {
    "distribution": "internal"
  }
}
```

### Production Build

```bash
# Build for production
eas build --platform android --profile production

# Configuration in eas.json:
{
  "production": {
    "autoIncrement": true
  }
}
```

## Security Considerations

1. **Keystore Security**:
   - Store keystore file securely (not in version control)
   - Use strong passwords for keystore and key
   - Back up keystore in secure location

2. **Environment Variables**:
   - Never commit `.env` file to version control
   - Use `.env.example` as template
   - Store sensitive values in secure environment

3. **Dependency Security**:
   - Run `npm audit` regularly
   - Update dependencies promptly
   - Monitor security advisories

## Environment Configuration

### Overview

The PropertyArk mobile app supports environment-specific configuration through environment variables. This allows the same codebase to connect to different backends (development, staging, production) without code changes.

### Environment Files

Three environment files are provided:

1. **`.env.example`**: Template with all available variables and descriptions
2. **`.env.development`**: Development environment configuration
3. **`.env.production`**: Production environment configuration

### Environment-Specific Configuration

#### Development Environment

**File**: `.env.development`

**Configuration**:
- **API URL**: `http://localhost:5001` (local development server)
- **Certificate Pinning**: Disabled (for local testing)
- **Logging**: Debug level with console output
- **Cache TTL**: 1 hour (faster iteration during development)
- **Debug Mode**: Enabled

**Usage**:
```bash
cp .env.development .env
npm run android
```

#### Production Environment

**File**: `.env.production`

**Configuration**:
- **API URL**: `https://propertyark-backend.onrender.com/api` (Render backend)
- **Certificate Pinning**: Enabled (security)
- **Logging**: Error level only (minimal logs)
- **Cache TTL**: 24 hours (standard caching)
- **Debug Mode**: Disabled

**Usage**:
```bash
cp .env.production .env
eas build --platform android --profile production
```

### Available Environment Variables

#### API Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_API_URL` | `https://propertyark-backend.onrender.com/api` | Backend API endpoint URL |
| `REACT_APP_API_TIMEOUT` | `30000` | API request timeout in milliseconds |

#### Authentication Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_AUTH_LOGIN_ENDPOINT` | `/auth/login` | Login endpoint path |
| `REACT_APP_AUTH_LOGOUT_ENDPOINT` | `/auth/logout` | Logout endpoint path |
| `REACT_APP_AUTH_REFRESH_ENDPOINT` | `/auth/refresh` | Token refresh endpoint path |

#### Cache Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_CACHE_TTL` | `86400000` | Cache time-to-live in milliseconds (24 hours) |
| `REACT_APP_CACHE_MAX_SIZE` | `104857600` | Maximum cache size in bytes (100MB) |

#### Build Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_BUILD_ENV` | `production` | Build environment (development, staging, production) |
| `REACT_APP_VERSION` | `1.0.0` | Application version |

#### Security Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_CERTIFICATE_PINNING` | `true` | Enable HTTPS certificate pinning |
| `REACT_APP_SECURE_STORAGE` | `true` | Enable secure storage for sensitive data |

#### Logging Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_LOG_LEVEL` | `info` | Log level (error, warn, info, debug) |
| `REACT_APP_CONSOLE_LOGGING` | `true` | Enable console logging |

#### Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `REACT_APP_OFFLINE_MODE` | `true` | Enable offline mode with caching |
| `REACT_APP_DEBUG_MODE` | `false` | Enable debug mode for development |

#### Build System Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `GRADLE_OPTS` | `-Xmx4g -XX:MaxPermSize=512m` | Gradle JVM options |
| `ANDROID_SDK_ROOT` | (system dependent) | Android SDK installation path |
| `ANDROID_HOME` | (system dependent) | Android SDK home directory |
| `JAVA_HOME` | (system dependent) | Java installation path |

### Loading Environment Variables

The application loads environment variables at startup through `constants/config.ts`:

```typescript
const ENV = process.env.REACT_APP_BUILD_ENV || 'production';

export const CONFIG = {
  API_URL:
    ENV === 'development'
      ? 'http://localhost:5001'
      : process.env.REACT_APP_API_URL || 'https://propertyark-backend.onrender.com/api',
  API_TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000', 10),
  // ... other configuration
};
```

### Setting Environment Variables

#### Option 1: Using .env Files (Recommended)

```bash
# Copy environment file
cp .env.development .env

# Build with environment variables
npm run android
```

#### Option 2: Command Line

```bash
# Set environment variables before build
export REACT_APP_API_URL=http://localhost:5001
export REACT_APP_BUILD_ENV=development

npm run android
```

#### Option 3: EAS Build

For EAS cloud builds, environment variables can be set in `eas.json`:

```json
{
  "build": {
    "development": {
      "env": {
        "REACT_APP_API_URL": "http://localhost:5001",
        "REACT_APP_BUILD_ENV": "development"
      }
    },
    "production": {
      "env": {
        "REACT_APP_API_URL": "https://propertyark-backend.onrender.com/api",
        "REACT_APP_BUILD_ENV": "production"
      }
    }
  }
}
```

### Environment Variable Best Practices

1. **Never Commit `.env` Files**: Add `.env*` to `.gitignore` to prevent committing sensitive values
2. **Use `.env.example`**: Commit `.env.example` as a template for other developers
3. **Document Variables**: Keep environment variable documentation up-to-date
4. **Validate on Startup**: The app validates required variables at startup
5. **Use Secure Storage**: Store sensitive values (API keys, tokens) in secure device storage, not environment variables
6. **Environment-Specific Values**: Use different values for development, staging, and production

### Troubleshooting Environment Variables

#### Variables Not Loading

**Problem**: Environment variables are not being loaded

**Solution**:
1. Verify `.env` file exists in `mobile/` directory
2. Check file format (should be `KEY=VALUE` on each line)
3. Restart development server: `npm start`
4. Clear cache: `npm run clean-build`

#### Wrong API URL Being Used

**Problem**: App is connecting to wrong backend

**Solution**:
1. Check which `.env` file is being used
2. Verify `REACT_APP_API_URL` is set correctly
3. Check `REACT_APP_BUILD_ENV` matches expected environment
4. Verify no conflicting environment variables are set globally

#### Build Fails with Environment Variables

**Problem**: Build fails when using environment variables

**Solution**:
1. Verify all required variables are set
2. Check variable values are valid (URLs, numbers, booleans)
3. Ensure no special characters in values (use quotes if needed)
4. Clear build cache: `rm -rf android/build`

## Maintenance

### Regular Tasks

- [ ] Check for dependency updates monthly
- [ ] Run security audits monthly
- [ ] Monitor build success rates
- [ ] Review error logs for issues
- [ ] Update documentation as needed

### Backup and Recovery

```bash
# Backup keystore
cp propertyark.keystore propertyark.keystore.backup

# Backup node_modules (optional)
tar -czf node_modules.tar.gz node_modules/

# Backup build artifacts
cp -r android/app/build/outputs android/app/build/outputs.backup
```

---

**Last Updated**: 2024
**Maintained By**: PropertyArk Development Team
**Version**: 1.0.0
