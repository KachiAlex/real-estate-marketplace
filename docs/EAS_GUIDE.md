# EAS Cloud Build Guide

## Overview

This guide explains how to use EAS (Expo Application Services) for cloud builds of PropertyArk. EAS provides a managed build service that eliminates the need for local build infrastructure while maintaining full control over your build process.

## What is EAS?

EAS is a cloud build and submission service that:
- Builds your app in the cloud without requiring local SDKs
- Supports multiple build profiles (development, staging, production)
- Manages signing credentials securely
- Provides build artifacts for distribution
- Integrates with app stores for submission

## Prerequisites

Before using EAS, ensure:
1. EAS CLI is installed: `npm install -g eas-cli`
2. You have an Expo account: [expo.dev](https://expo.dev)
3. Environment variables are configured ([Environment Variables](./ENVIRONMENT_VARIABLES.md))
4. `eas.json` is configured in project root
5. You have valid signing credentials (Android keystore, iOS certificates)

## Step 1: Install EAS CLI

### Install Globally

```bash
# Install EAS CLI
npm install -g eas-cli

# Verify installation
eas --version
# Output: eas-cli/16.28.0 or higher
```

### Update EAS CLI

```bash
# Update to latest version
npm install -g eas-cli@latest

# Check for updates
eas update-check
```

## Step 2: Authenticate with EAS

### Login to Expo Account

```bash
# Login to Expo
eas login

# You'll be prompted to:
# 1. Enter your Expo username or email
# 2. Enter your password
# 3. Optionally save credentials
```

### Verify Authentication

```bash
# Check current user
eas whoami

# Output: You are logged in as: your-username
```

### Logout (if needed)

```bash
# Logout from Expo
eas logout
```

## Step 3: Configure EAS Project

### Initialize EAS Project

```bash
# Initialize EAS for your project
eas init

# You'll be prompted to:
# 1. Create new Expo project or link existing
# 2. Confirm project ID
```

### Verify eas.json Configuration

```bash
# Check eas.json structure
cat eas.json

# Expected structure:
# {
#   "cli": { "version": ">= 16.28.0" },
#   "build": {
#     "development": { ... },
#     "staging": { ... },
#     "production": { ... }
#   }
# }
```

## Step 4: Configure Build Profiles

### Development Profile

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "env": {
        "NODE_ENV": "development",
        "REACT_APP_API_URL": "https://dev-api.propertyark.com",
        "REACT_APP_ENVIRONMENT": "development"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleDebug"
      },
      "ios": {
        "buildConfiguration": "Debug"
      }
    }
  }
}
```

### Staging Profile

```json
{
  "build": {
    "staging": {
      "distribution": "internal",
      "channel": "staging",
      "env": {
        "NODE_ENV": "staging",
        "REACT_APP_API_URL": "https://staging-api.propertyark.com",
        "REACT_APP_ENVIRONMENT": "staging"
      },
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

### Production Profile

```json
{
  "build": {
    "production": {
      "autoIncrement": true,
      "distribution": "store",
      "channel": "production",
      "env": {
        "NODE_ENV": "production",
        "REACT_APP_API_URL": "https://api.propertyark.com",
        "REACT_APP_ENVIRONMENT": "production"
      },
      "android": {
        "buildType": "aab",
        "gradleCommand": ":app:bundleRelease"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

## Step 5: Configure Signing Credentials

### Android Signing

#### Upload Keystore to EAS

```bash
# Configure Android signing
eas credentials

# Follow prompts to:
# 1. Select Android
# 2. Choose "Upload a new keystore"
# 3. Provide keystore file path
# 4. Provide keystore password
# 5. Provide key alias
# 6. Provide key password
```

#### Verify Android Credentials

```bash
# List Android credentials
eas credentials --platform android

# Output:
# Android Keystore
# ├─ Keystore ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# ├─ Key Alias: propertyark-key
# └─ Updated: 2024-01-15
```

### iOS Signing

#### Upload Certificates to EAS

```bash
# Configure iOS signing
eas credentials

# Follow prompts to:
# 1. Select iOS
# 2. Choose "Upload a new certificate"
# 3. Provide certificate file (.p12)
# 4. Provide certificate password
# 5. Provide provisioning profile
```

#### Verify iOS Credentials

```bash
# List iOS credentials
eas credentials --platform ios

# Output:
# iOS Distribution Certificate
# ├─ Certificate ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# ├─ Team ID: XXXXXXXXXX
# └─ Updated: 2024-01-15
```

## Step 6: Submit Build to EAS

### Build for Development

```bash
# Build for development profile
eas build --platform android --profile development

# Or for iOS
eas build --platform ios --profile development

# Or for both platforms
eas build --platform all --profile development
```

### Build for Staging

```bash
# Build for staging profile
eas build --platform android --profile staging

# Or for iOS
eas build --platform ios --profile staging

# Or for both platforms
eas build --platform all --profile staging
```

### Build for Production

```bash
# Build for production profile
eas build --platform android --profile production

# Or for iOS
eas build --platform ios --profile production

# Or for both platforms
eas build --platform all --profile production
```

### Using Build Script

```bash
# Use provided build script
./scripts/build-eas.sh

# Script will:
# 1. Validate environment
# 2. Load environment variables
# 3. Submit build to EAS
# 4. Monitor build progress
# 5. Download artifacts
```

## Step 7: Monitor Build Progress

### View Build Status

```bash
# List recent builds
eas build:list

# Output:
# Build ID                             Platform  Status    Created
# xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx android   FINISHED  2024-01-15 10:30:00
# xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx ios       FINISHED  2024-01-15 10:35:00
```

### View Build Details

```bash
# Get details for specific build
eas build:view <build-id>

# Output:
# Build ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# Platform: android
# Status: FINISHED
# Created: 2024-01-15 10:30:00
# Completed: 2024-01-15 10:45:00
# Artifacts: app-release.aab
```

### View Build Logs

```bash
# Stream build logs
eas build:log <build-id>

# Or view logs for latest build
eas build:log --latest
```

## Step 8: Download Build Artifacts

### Download Artifacts

```bash
# Download artifacts for specific build
eas build:download <build-id>

# Or download latest build
eas build:download --latest

# Artifacts will be saved to current directory:
# - Android: app-release.aab or app-release.apk
# - iOS: App.ipa
```

### Verify Artifacts

```bash
# List downloaded artifacts
ls -lh *.aab *.apk *.ipa

# Verify artifact integrity
file app-release.aab
file app-release.apk
file App.ipa
```

## Step 9: Submit to App Stores

### Android Play Store Submission

#### Configure Play Store Credentials

```bash
# Configure Play Store submission
eas submit --platform android

# Follow prompts to:
# 1. Select "Google Play"
# 2. Provide service account JSON
# 3. Confirm submission settings
```

#### Submit Build

```bash
# Submit to Play Store
eas submit --platform android --latest

# Or submit specific build
eas submit --platform android --id <build-id>
```

### iOS App Store Submission

#### Configure App Store Credentials

```bash
# Configure App Store submission
eas submit --platform ios

# Follow prompts to:
# 1. Select "App Store"
# 2. Provide Apple ID
# 3. Provide app-specific password
# 4. Confirm submission settings
```

#### Submit Build

```bash
# Submit to App Store
eas submit --platform ios --latest

# Or submit specific build
eas submit --platform ios --id <build-id>
```

## Build Profiles Reference

### Profile Options

```json
{
  "build": {
    "profile-name": {
      // Build distribution
      "distribution": "internal|store",
      
      // Development client (for Expo Go)
      "developmentClient": true|false,
      
      // Update channel
      "channel": "development|staging|production",
      
      // Environment variables
      "env": {
        "NODE_ENV": "development",
        "REACT_APP_API_URL": "https://api.example.com"
      },
      
      // Android-specific options
      "android": {
        "buildType": "apk|aab",
        "gradleCommand": ":app:assembleDebug"
      },
      
      // iOS-specific options
      "ios": {
        "buildConfiguration": "Debug|Release"
      }
    }
  }
}
```

## Environment Variables in EAS

### Set Environment Variables

```bash
# Set environment variable for build
eas secret:create --scope project --name REACT_APP_API_URL

# You'll be prompted to enter the value
# Value: https://api.propertyark.com
```

### List Environment Variables

```bash
# List all secrets
eas secret:list

# Output:
# Name                    Scope
# REACT_APP_API_URL       project
# REACT_APP_ENVIRONMENT   project
```

### Delete Environment Variable

```bash
# Delete secret
eas secret:delete --name REACT_APP_API_URL
```

## Troubleshooting

### Build Fails with Credential Error

**Error**: `Credentials not found for platform`

**Solution**:
```bash
# Configure credentials
eas credentials

# Or upload credentials
eas credentials --platform android
eas credentials --platform ios
```

### Build Fails with Signing Error

**Error**: `Code signing failed`

**Solution**:
```bash
# Verify credentials are correct
eas credentials --platform ios

# Re-upload credentials if needed
eas credentials --platform ios --clear
eas credentials --platform ios
```

### Build Fails with Environment Variable Error

**Error**: `Environment variable not found`

**Solution**:
```bash
# Set missing environment variable
eas secret:create --scope project --name MISSING_VAR

# Or add to eas.json
# "env": {
#   "MISSING_VAR": "value"
# }
```

### Build Timeout

**Error**: `Build timed out after 60 minutes`

**Solution**:
```bash
# Check build logs for errors
eas build:log <build-id>

# Optimize build:
# 1. Remove unnecessary dependencies
# 2. Enable build cache
# 3. Use faster build configuration
```

### Artifact Download Fails

**Error**: `Failed to download artifact`

**Solution**:
```bash
# Verify build completed successfully
eas build:view <build-id>

# Check build status is "FINISHED"
# If status is "FAILED", check build logs

# Retry download
eas build:download <build-id>
```

## Best Practices

### Build Profiles

1. **Use separate profiles** for development, staging, and production
2. **Configure environment variables** per profile
3. **Use different signing credentials** for each profile
4. **Test staging builds** before production

### Credentials Management

1. **Store credentials securely** in EAS
2. **Never commit credentials** to version control
3. **Rotate credentials** regularly
4. **Use separate credentials** for each platform

### Build Optimization

1. **Enable build cache** to speed up builds
2. **Minimize dependencies** to reduce build size
3. **Use appropriate build types** (APK for testing, AAB for store)
4. **Monitor build logs** for errors and warnings

## Next Steps

1. **Build locally**: See [Build Guide](./BUILD_GUIDE.md)
2. **Deploy to device**: See [Emulator/Simulator Setup](./EMULATOR_SIMULATOR.md)
3. **Troubleshoot issues**: See [Troubleshooting Guide](./TROUBLESHOOTING.md)
4. **Configure environment**: See [Environment Variables](./ENVIRONMENT_VARIABLES.md)

## External Resources

- [EAS Documentation](https://docs.expo.dev/eas/)
- [EAS Build Guide](https://docs.expo.dev/eas-update/introduction/)
- [EAS Submit Guide](https://docs.expo.dev/submit/introduction/)
- [Expo Account](https://expo.dev)

---

**Ready to use EAS?** Run `eas login` to get started.
