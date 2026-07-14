# Build Scripts Reference

## Overview

This document provides a comprehensive reference for all build scripts used in PropertyArk mobile development. Build scripts automate the build process and ensure consistency across environments.

## Script Locations

All build scripts are located in the `scripts/` directory:

```
scripts/
├── build-utils.sh              # Common utilities and functions
├── build-android-debug.sh      # Build Android debug APK
├── build-android-release.sh    # Build Android release APK
├── build-ios-debug.sh          # Build iOS debug app
├── build-ios-release.sh        # Build iOS release app
├── build-eas.sh                # Submit build to EAS cloud service
├── sync-capacitor.sh           # Sync web assets to native projects
└── validate-setup.sh           # Validate development environment
```

## Common Utilities (build-utils.sh)

### Purpose

Provides common functions and utilities used by all build scripts.

### Functions

#### Logging Functions

```bash
log_info "Message"          # Info message (blue)
log_success "Message"       # Success message (green)
log_warning "Message"       # Warning message (yellow)
log_error "Message"         # Error message (red)
```

#### Environment Functions

```bash
validate_env_file           # Check if .env.local exists
load_env_file              # Load environment variables from .env.local
validate_required_env_vars # Validate required environment variables
```

#### Capacitor Functions

```bash
validate_capacitor_config  # Validate Capacitor configuration
sync_capacitor             # Sync web assets to native projects
```

#### Android Functions

```bash
validate_android_sdk       # Validate Android SDK installation
validate_gradle            # Validate Gradle installation
build_android_debug        # Build Android debug APK
build_android_release      # Build Android release APK
```

#### iOS Functions

```bash
validate_xcode             # Validate Xcode installation
validate_cocoapods         # Validate CocoaPods installation
build_ios_debug            # Build iOS debug app
build_ios_release          # Build iOS release app
```

#### Artifact Functions

```bash
collect_android_artifacts  # Collect Android build artifacts
collect_ios_artifacts      # Collect iOS build artifacts
```

## Android Build Scripts

### build-android-debug.sh

**Purpose**: Build Android debug APK for testing

**Usage**:
```bash
./scripts/build-android-debug.sh
```

**What it does**:
1. Validates environment setup
2. Loads environment variables from .env.local
3. Validates Android SDK and Gradle
4. Runs Capacitor sync
5. Builds debug APK using Gradle
6. Collects and reports build artifacts

**Output**:
```
[INFO] Building Android debug APK...
[SUCCESS] Android SDK found at: /Users/username/Library/Android/sdk
[SUCCESS] Gradle is available
[SUCCESS] Capacitor sync completed successfully
[SUCCESS] Android debug APK built successfully
[SUCCESS] Found debug APK: android/app/build/outputs/apk/debug/app-debug.apk
```

**Environment Variables Required**:
- `ANDROID_SDK_ROOT` or `ANDROID_HOME`
- `REACT_APP_API_URL`
- `REACT_APP_ENVIRONMENT`

**Artifacts Generated**:
- `android/app/build/outputs/apk/debug/app-debug.apk`

**Troubleshooting**:
```bash
# If build fails, check logs
cat android/app/build/outputs/logs/build.log

# Clear Gradle cache and retry
rm -rf ~/.gradle/caches
./scripts/build-android-debug.sh
```

### build-android-release.sh

**Purpose**: Build Android release APK for distribution

**Usage**:
```bash
./scripts/build-android-release.sh
```

**What it does**:
1. Validates environment setup
2. Loads environment variables from .env.local
3. Validates Android SDK, Gradle, and keystore
4. Runs Capacitor sync
5. Builds release APK using Gradle with signing
6. Collects and reports build artifacts

**Output**:
```
[INFO] Building Android release APK...
[SUCCESS] Android SDK found at: /Users/username/Library/Android/sdk
[SUCCESS] Gradle is available
[SUCCESS] Keystore found at: /Users/username/.propertyark/propertyark.jks
[SUCCESS] Capacitor sync completed successfully
[SUCCESS] Android release APK built successfully
[SUCCESS] Found release APK: android/app/build/outputs/apk/release/app-release.apk
```

**Environment Variables Required**:
- `ANDROID_SDK_ROOT` or `ANDROID_HOME`
- `ANDROID_KEYSTORE_PATH`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`
- `REACT_APP_API_URL`
- `REACT_APP_ENVIRONMENT`

**Artifacts Generated**:
- `android/app/build/outputs/apk/release/app-release.apk`

**Troubleshooting**:
```bash
# If signing fails, verify keystore
keytool -list -v -keystore $ANDROID_KEYSTORE_PATH

# If password is wrong, update .env.local
nano .env.local
```

## iOS Build Scripts

### build-ios-debug.sh

**Purpose**: Build iOS debug app for simulator testing

**Usage**:
```bash
./scripts/build-ios-debug.sh
```

**What it does**:
1. Validates environment setup
2. Loads environment variables from .env.local
3. Validates Xcode and CocoaPods
4. Runs Capacitor sync
5. Builds debug app using Xcode
6. Collects and reports build artifacts

**Output**:
```
[INFO] Building iOS debug app...
[SUCCESS] Xcode found (xcode-select version 2396)
[SUCCESS] CocoaPods is installed
[SUCCESS] Capacitor sync completed successfully
[SUCCESS] iOS debug app built successfully
[SUCCESS] Found debug app: ios/App/build/Debug-iphonesimulator/App.app
```

**Environment Variables Required**:
- `REACT_APP_API_URL`
- `REACT_APP_ENVIRONMENT`
- `IOS_TEAM_ID` (optional)
- `IOS_BUNDLE_ID` (optional)

**Artifacts Generated**:
- `ios/App/build/Debug-iphonesimulator/App.app`

**Troubleshooting**:
```bash
# If build fails, check Xcode logs
cat ~/Library/Logs/Xcode/DerivedData/App-*/Logs/Build/Build.log

# Reinstall pods
cd ios/App
rm -rf Pods Podfile.lock
pod install
cd ../../
```

### build-ios-release.sh

**Purpose**: Build iOS release app for App Store distribution

**Usage**:
```bash
./scripts/build-ios-release.sh
```

**What it does**:
1. Validates environment setup
2. Loads environment variables from .env.local
3. Validates Xcode, CocoaPods, and certificates
4. Runs Capacitor sync
5. Builds release app using Xcode with code signing
6. Collects and reports build artifacts

**Output**:
```
[INFO] Building iOS release app...
[SUCCESS] Xcode found (xcode-select version 2396)
[SUCCESS] CocoaPods is installed
[SUCCESS] Development certificate found
[SUCCESS] Provisioning profile found
[SUCCESS] Capacitor sync completed successfully
[SUCCESS] iOS release app built successfully
[SUCCESS] Found release app: ios/App/build/Release-iphoneos/App.app
```

**Environment Variables Required**:
- `REACT_APP_API_URL`
- `REACT_APP_ENVIRONMENT`
- `IOS_TEAM_ID`
- `IOS_BUNDLE_ID`
- `IOS_CERTIFICATE_ID` (optional)
- `IOS_PROVISIONING_PROFILE_ID` (optional)

**Artifacts Generated**:
- `ios/App/build/Release-iphoneos/App.app`

**Troubleshooting**:
```bash
# If code signing fails, verify certificate
security find-identity -v -p codesigning

# If provisioning profile not found, update Xcode
# Xcode → Preferences → Accounts → Download Manual Profiles
```

## Cloud Build Scripts

### build-eas.sh

**Purpose**: Submit build to EAS cloud build service

**Usage**:
```bash
./scripts/build-eas.sh [profile] [platform]

# Examples
./scripts/build-eas.sh development android
./scripts/build-eas.sh staging ios
./scripts/build-eas.sh production all
```

**Parameters**:
- `profile`: Build profile (development, staging, production) - default: development
- `platform`: Platform to build (android, ios, all) - default: all

**What it does**:
1. Validates environment setup
2. Authenticates with EAS service
3. Validates EAS configuration
4. Submits build to EAS with specified profile
5. Monitors build progress
6. Downloads build artifacts when complete

**Output**:
```
[INFO] Submitting build to EAS...
[SUCCESS] Authenticated with EAS
[SUCCESS] Build submitted successfully
Build ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
Platform: android
Status: QUEUED

[INFO] Monitoring build progress...
Status: BUILDING (2 minutes elapsed)
Status: FINISHED (5 minutes elapsed)

[SUCCESS] Build completed successfully
[INFO] Downloading artifacts...
[SUCCESS] Artifacts downloaded to: ./app-release.aab
```

**Environment Variables Required**:
- `EAS_PROJECT_ID`
- `EAS_BUILD_PROFILE`
- `REACT_APP_API_URL`
- `REACT_APP_ENVIRONMENT`

**Artifacts Generated**:
- Android: `app-release.aab` or `app-release.apk`
- iOS: `App.ipa`

**Troubleshooting**:
```bash
# If authentication fails
eas login

# If build fails, check EAS logs
eas build:log <build-id>

# If credentials not found
eas credentials --platform android
eas credentials --platform ios
```

## Capacitor Sync Script

### sync-capacitor.sh

**Purpose**: Sync web assets to native projects

**Usage**:
```bash
./scripts/sync-capacitor.sh
```

**What it does**:
1. Validates Capacitor configuration
2. Compiles web application
3. Copies web assets to native projects
4. Installs Capacitor plugins in native code
5. Reports sync status

**Output**:
```
[INFO] Syncing Capacitor web assets to native projects...
[SUCCESS] Capacitor configuration is valid
[INFO] Compiling web application...
[SUCCESS] Web application compiled successfully
[INFO] Syncing to Android...
[SUCCESS] Android sync completed successfully
[INFO] Syncing to iOS...
[SUCCESS] iOS sync completed successfully
```

**Environment Variables Required**:
- None (uses default configuration)

**When to use**:
- After making changes to web code
- Before building native apps
- When adding new Capacitor plugins

**Troubleshooting**:
```bash
# If sync fails, check Capacitor config
cat capacitor.config.ts

# If web build fails
npm run build

# If plugin sync fails
npx capacitor sync --force
```

## Validation Script

### validate-setup.sh

**Purpose**: Validate complete mobile development environment setup

**Usage**:
```bash
./scripts/validate-setup.sh
```

**What it does**:
1. Validates environment variables
2. Checks system prerequisites (Node.js, npm, Git)
3. Validates configuration files
4. Checks dependencies (npm, Capacitor, EAS)
5. Validates Android setup (SDK, Gradle, emulator)
6. Validates iOS setup (Xcode, CocoaPods, simulator)
7. Validates build scripts
8. Generates validation report

**Output**:
```
PropertyArk Mobile Development Setup Validation
Project root: /path/to/propertyark

==========================================
Environment Validation
==========================================
✓ .env.local file exists
✓ Node.js installed (v20.0.0)
✓ npm installed (10.0.0)
✓ Git installed (git version 2.42.0)

==========================================
Configuration Validation
==========================================
✓ capacitor.config.ts exists
✓ eas.json exists
✓ app.json exists
✓ package.json exists

==========================================
Dependency Validation
==========================================
✓ node_modules directory exists
✓ Capacitor CLI available
✓ EAS CLI installed

==========================================
Android Development Environment
==========================================
✓ Android SDK found at: /Users/username/Library/Android/sdk
✓ Gradle installed (Gradle 8.0)
✓ Android project directory exists

==========================================
iOS Development Environment
==========================================
✓ Xcode found (xcode-select version 2396)
✓ CocoaPods installed (1.13.0)
✓ iOS project directory exists
✓ Podfile exists

==========================================
Build Scripts Validation
==========================================
✓ scripts/build-utils.sh exists and is executable
✓ scripts/build-android-debug.sh exists and is executable
✓ scripts/build-android-release.sh exists and is executable
✓ scripts/build-ios-debug.sh exists and is executable
✓ scripts/build-ios-release.sh exists and is executable
✓ scripts/build-eas.sh exists and is executable
✓ scripts/sync-capacitor.sh exists and is executable
✓ scripts/validate-setup.sh exists and is executable

==========================================
Validation Summary
==========================================
Total checks: 32
✓ Passed: 32
⚠ Warnings: 0
✗ Failed: 0

Setup validation completed successfully!
```

**Exit Codes**:
- `0`: All checks passed
- `1`: One or more checks failed

**When to use**:
- Before starting development
- After installing new tools
- Before committing code
- In CI/CD pipelines

## Script Execution Flow

### Build Script Flow

```
┌─────────────────────────────────────────┐
│ 1. Source build-utils.sh                │
│    - Load common functions              │
│    - Set up logging                     │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 2. Validate Environment                 │
│    - Check .env.local exists            │
│    - Load environment variables         │
│    - Validate required variables        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 3. Validate Platform Setup              │
│    - Check SDK installation             │
│    - Check build tools                  │
│    - Check configuration files          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 4. Sync Capacitor                       │
│    - Compile web application            │
│    - Copy web assets                    │
│    - Install plugins                    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 5. Build Native Application             │
│    - Compile native code                │
│    - Link dependencies                  │
│    - Sign application                   │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ 6. Collect Artifacts                    │
│    - Verify artifacts exist             │
│    - Report artifact locations          │
│    - Clean up temporary files           │
└─────────────────────────────────────────┘
```

## Error Handling

### Common Errors

#### Build Script Not Executable

```bash
# Error: Permission denied
chmod +x ./scripts/build-android-debug.sh

# Or make all scripts executable
chmod +x ./scripts/*.sh
```

#### Environment Variable Not Found

```bash
# Error: Environment variable not found
# Solution: Create .env.local
cp .env.example .env.local
nano .env.local
```

#### Build Fails

```bash
# Check build logs
cat android/app/build/outputs/logs/build.log

# Or for iOS
cat ~/Library/Logs/Xcode/DerivedData/App-*/Logs/Build/Build.log

# Clear cache and retry
rm -rf ~/.gradle/caches
./scripts/build-android-debug.sh
```

## Best Practices

### Script Usage

1. **Always run validation first**: `./scripts/validate-setup.sh`
2. **Use appropriate build script**: Debug for development, release for distribution
3. **Check environment variables**: Ensure .env.local is configured
4. **Monitor build output**: Check for warnings and errors
5. **Verify artifacts**: Ensure build artifacts are generated correctly

### Script Development

1. **Use build-utils.sh functions**: Reuse common functions
2. **Add error handling**: Use trap for error handling
3. **Log all steps**: Use logging functions for visibility
4. **Validate inputs**: Check environment and configuration
5. **Clean up**: Remove temporary files after build

## Next Steps

1. **Make scripts executable**: `chmod +x ./scripts/*.sh`
2. **Validate setup**: `./scripts/validate-setup.sh`
3. **Build app**: `./scripts/build-android-debug.sh` or `./scripts/build-ios-debug.sh`
4. **Deploy to device**: See [Emulator/Simulator Setup](./EMULATOR_SIMULATOR.md)

## External Resources

- [Bash Scripting Guide](https://www.gnu.org/software/bash/manual/)
- [Gradle Build Guide](https://gradle.org/docs/)
- [Xcode Build Documentation](https://developer.apple.com/documentation/xcode)
- [EAS Build Documentation](https://docs.expo.dev/eas-update/introduction/)

---

**Ready to build?** Run `./scripts/validate-setup.sh` first, then use the appropriate build script.
