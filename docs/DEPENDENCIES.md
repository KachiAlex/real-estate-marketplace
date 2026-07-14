# Dependency Compatibility Matrix

## Overview

This document provides a comprehensive compatibility matrix for all dependencies used in PropertyArk mobile development. It ensures that all tools, SDKs, and libraries work together correctly.

## Supported Versions

### Core Dependencies

| Dependency | Minimum | Recommended | Maximum | Status |
|-----------|---------|-------------|---------|--------|
| Node.js | 18.0.0 | 20.0.0 | Latest | ✅ Supported |
| npm | 9.0.0 | 10.0.0 | Latest | ✅ Supported |
| Capacitor | 5.0.0 | 5.4.0 | 5.x | ✅ Supported |
| React | 18.0.0 | 18.2.0 | 18.x | ✅ Supported |
| React Native | 0.72.0 | 0.73.0 | 0.73.x | ✅ Supported |
| TypeScript | 4.9.0 | 5.2.0 | 5.x | ✅ Supported |

### Android Dependencies

| Dependency | Minimum | Recommended | Maximum | Status |
|-----------|---------|-------------|---------|--------|
| Android SDK | API 34 | API 34 | Latest | ✅ Required |
| Build Tools | 34.0.0 | 34.0.0 | 34.x | ✅ Required |
| Gradle | 8.0 | 8.2 | 8.x | ✅ Supported |
| Java | 11 | 17 | 21 | ✅ Supported |
| Android Gradle Plugin | 8.0.0 | 8.1.0 | 8.x | ✅ Supported |

### iOS Dependencies

| Dependency | Minimum | Recommended | Maximum | Status |
|-----------|---------|-------------|---------|--------|
| Xcode | 15.0 | 15.1 | Latest | ✅ Required |
| iOS SDK | 14.0 | 17.0 | Latest | ✅ Supported |
| CocoaPods | 1.12.0 | 1.13.0 | 1.x | ✅ Supported |
| Swift | 5.8 | 5.9 | 5.x | ✅ Supported |

### Build Tools

| Tool | Minimum | Recommended | Maximum | Status |
|------|---------|-------------|---------|--------|
| Git | 2.30.0 | 2.42.0 | Latest | ✅ Supported |
| EAS CLI | 16.28.0 | Latest | Latest | ✅ Supported |
| Expo CLI | 6.0.0 | Latest | Latest | ✅ Supported |

## Compatibility Rules

### Capacitor Compatibility

```
Capacitor 5.x requires:
├─ Android SDK API 34+
├─ iOS SDK 14.0+
├─ Gradle 8.0+
├─ CocoaPods 1.12.0+
└─ Node.js 18.0.0+
```

### Android Compatibility

```
Android SDK API 34 requires:
├─ Build Tools 34.0.0+
├─ Gradle 8.0+
├─ Java 11+
└─ Android Gradle Plugin 8.0.0+
```

### iOS Compatibility

```
iOS SDK 17.0 requires:
├─ Xcode 15.0+
├─ CocoaPods 1.12.0+
├─ Swift 5.8+
└─ macOS 12.0+
```

## Version Compatibility Matrix

### Capacitor × Android SDK

| Capacitor | Android SDK | Build Tools | Gradle | Status |
|-----------|------------|-------------|--------|--------|
| 5.0.x | API 34+ | 34.0.0+ | 8.0+ | ✅ Compatible |
| 5.1.x | API 34+ | 34.0.0+ | 8.0+ | ✅ Compatible |
| 5.2.x | API 34+ | 34.0.0+ | 8.0+ | ✅ Compatible |
| 5.3.x | API 34+ | 34.0.0+ | 8.0+ | ✅ Compatible |
| 5.4.x | API 34+ | 34.0.0+ | 8.0+ | ✅ Compatible |

### Capacitor × iOS SDK

| Capacitor | iOS SDK | Xcode | CocoaPods | Status |
|-----------|---------|-------|-----------|--------|
| 5.0.x | 14.0+ | 15.0+ | 1.12.0+ | ✅ Compatible |
| 5.1.x | 14.0+ | 15.0+ | 1.12.0+ | ✅ Compatible |
| 5.2.x | 14.0+ | 15.0+ | 1.12.0+ | ✅ Compatible |
| 5.3.x | 14.0+ | 15.0+ | 1.12.0+ | ✅ Compatible |
| 5.4.x | 14.0+ | 15.0+ | 1.12.0+ | ✅ Compatible |

### Node.js × npm

| Node.js | npm | Status |
|---------|-----|--------|
| 18.0.0+ | 9.0.0+ | ✅ Compatible |
| 19.0.0+ | 9.0.0+ | ✅ Compatible |
| 20.0.0+ | 10.0.0+ | ✅ Compatible |
| 21.0.0+ | 10.0.0+ | ✅ Compatible |

## Known Issues and Workarounds

### Issue 1: Gradle Sync Fails with Capacitor 5.x

**Symptoms**: `Could not find com.android.tools.build:gradle:8.0.0`

**Root Cause**: Gradle cache corrupted or network issue

**Workaround**:
```bash
# Clear Gradle cache
rm -rf ~/.gradle/caches

# Rebuild
cd android && ./gradlew clean assembleDebug && cd ..
```

### Issue 2: CocoaPods Dependency Conflicts

**Symptoms**: `[!] CocoaPods could not find compatible versions`

**Root Cause**: Pod repository outdated or version conflicts

**Workaround**:
```bash
# Update CocoaPods
sudo gem install cocoapods

# Update pod repository
pod repo update

# Reinstall pods
cd ios/App
rm -rf Pods Podfile.lock
pod install
cd ../../
```

### Issue 3: Xcode Build Fails with iOS 17

**Symptoms**: `error: unable to find a matching provisioning profile`

**Root Cause**: Provisioning profile not updated for iOS 17

**Workaround**:
```bash
# Update provisioning profile in Apple Developer Portal
# 1. Go to Certificates, Identifiers & Profiles
# 2. Select your provisioning profile
# 3. Click "Edit" and regenerate
# 4. Download and install in Xcode
```

### Issue 4: Android Emulator Slow with API 34

**Symptoms**: Emulator runs slowly, high CPU usage

**Root Cause**: GPU acceleration not enabled or insufficient resources

**Workaround**:
```bash
# Enable GPU acceleration
emulator -avd PropertyArk -gpu on

# Increase RAM allocation
# Edit ~/.android/avd/PropertyArk/config.ini
# hw.ramSize=8192
```

### Issue 5: React Native Metro Bundler Crashes

**Symptoms**: `Metro bundler crashed with error`

**Root Cause**: Node.js version incompatible or cache corrupted

**Workaround**:
```bash
# Clear Metro cache
rm -rf node_modules/.cache

# Clear npm cache
npm cache clean --force

# Reinstall dependencies
npm install

# Restart Metro bundler
npx react-native start --reset-cache
```

## Upgrade Guide

### Upgrade Node.js

```bash
# Check current version
node --version

# Install new version using nvm (recommended)
nvm install 20.0.0
nvm use 20.0.0

# Or download from nodejs.org
# https://nodejs.org/
```

### Upgrade Capacitor

```bash
# Check current version
npx capacitor --version

# Update Capacitor
npm install @capacitor/core@latest @capacitor/cli@latest

# Update Capacitor plugins
npm install @capacitor/camera@latest @capacitor/geolocation@latest

# Sync to native projects
npx capacitor sync
```

### Upgrade Android SDK

```bash
# Install new API level
sdkmanager "platforms;android-35"

# Install new build tools
sdkmanager "build-tools;35.0.0"

# Update build.gradle
# android/app/build.gradle
# targetSdkVersion 35
# buildToolsVersion "35.0.0"
```

### Upgrade iOS SDK

```bash
# Update Xcode
# App Store → Updates → Xcode

# Or use command line
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# Update CocoaPods
sudo gem install cocoapods

# Update pods
cd ios/App
pod repo update
pod install
cd ../../
```

### Upgrade Gradle

```bash
# Update Gradle wrapper
cd android
./gradlew wrapper --gradle-version 8.2
cd ..

# Verify update
cd android && ./gradlew --version && cd ..
```

## Dependency Checking

### Validate Compatibility

```bash
# Run setup validation
./scripts/validate-setup.sh

# Check specific versions
node --version
npm --version
npx capacitor --version
java -version
gradle --version
xcode-select --version
pod --version
```

### Check for Conflicts

```bash
# Check npm dependencies
npm ls

# Check for duplicate packages
npm ls --depth=0

# Check for outdated packages
npm outdated

# Check for security vulnerabilities
npm audit
```

### Update Dependencies

```bash
# Update all dependencies
npm update

# Update specific package
npm install package-name@latest

# Update to latest major version
npm install package-name@next
```

## Lock Files

### Purpose

Lock files ensure consistent builds across environments by pinning exact dependency versions.

### Committed Lock Files

```bash
# Always commit these files
git add package-lock.json
git add ios/App/Podfile.lock
git add android/gradle.lock

# These ensure reproducible builds
```

### Regenerate Lock Files

```bash
# npm
rm package-lock.json
npm install

# CocoaPods
cd ios/App
rm Podfile.lock
pod install
cd ../../

# Gradle
cd android
rm gradle.lock
./gradlew build
cd ..
```

## Performance Optimization

### Reduce Build Time

```bash
# Enable Gradle daemon
export GRADLE_OPTS="-Xmx2048m"

# Enable parallel builds
cd android && ./gradlew assembleDebug --parallel && cd ..

# Use build cache
cd android && ./gradlew assembleDebug --build-cache && cd ..
```

### Reduce App Size

```bash
# Enable ProGuard/R8 minification
# android/app/build.gradle
# buildTypes {
#   release {
#     minifyEnabled true
#     proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
#   }
# }

# Enable bitcode (iOS)
# Xcode: Build Settings → Enable Bitcode → Yes
```

## Troubleshooting

### Dependency Resolution Fails

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# For iOS
cd ios/App
rm -rf Pods Podfile.lock
pod install
cd ../../
```

### Version Conflict

```bash
# Check conflicting packages
npm ls package-name

# Update to compatible version
npm install package-name@compatible-version

# Or use npm audit fix
npm audit fix
```

### Build Fails After Update

```bash
# Revert to previous version
npm install package-name@previous-version

# Or check compatibility matrix above
# and update to compatible version
```

## Next Steps

1. **Check current versions**: Run `./scripts/validate-setup.sh`
2. **Update if needed**: Follow upgrade guide above
3. **Validate compatibility**: Ensure all versions are compatible
4. **Build and test**: Run `./scripts/build-android-debug.sh` or `./scripts/build-ios-debug.sh`

## External Resources

- [Node.js Releases](https://nodejs.org/en/about/releases/)
- [Capacitor Releases](https://github.com/ionic-team/capacitor/releases)
- [Android SDK Releases](https://developer.android.com/studio/releases)
- [Xcode Releases](https://developer.apple.com/download/)
- [Gradle Releases](https://gradle.org/releases/)
- [CocoaPods Releases](https://github.com/CocoaPods/CocoaPods/releases)

---

**Need to update dependencies?** Follow the [Upgrade Guide](#upgrade-guide) above.
