# Local Build Guide

## Overview

This guide explains how to build PropertyArk locally for Android and iOS platforms. Local builds are useful for development, testing, and debugging before submitting to cloud build services like EAS.

## Prerequisites

Before building, ensure:
1. Development environment is set up ([Android Setup](./ANDROID_SETUP.md) or [iOS Setup](./IOS_SETUP.md))
2. Environment variables are configured ([Environment Variables](./ENVIRONMENT_VARIABLES.md))
3. Setup validation passes: `./scripts/validate-setup.sh`
4. Dependencies are installed: `npm install`

## Build Process Overview

```
┌─────────────────────────────────────────────────────────┐
│ 1. Validate Environment                                 │
│    - Check SDKs installed                               │
│    - Check environment variables                        │
│    - Check configuration files                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Load Environment Variables                           │
│    - Load from .env.local                               │
│    - Load from system environment                       │
│    - Validate required variables                        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Sync Capacitor                                       │
│    - Compile web application                            │
│    - Copy web assets to native projects                 │
│    - Install Capacitor plugins                          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Build Native Application                             │
│    - Android: Gradle compile → sign → APK/AAB           │
│    - iOS: Xcode compile → sign → IPA                    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Collect Artifacts                                    │
│    - Verify build artifacts exist                       │
│    - Verify artifacts are signed                        │
│    - Report artifact locations                          │
└─────────────────────────────────────────────────────────┘
```

## Android Builds

### Debug Build

Debug builds are used for development and testing. They use debug signing credentials and include debugging symbols.

#### Using Build Script

```bash
./scripts/build-android-debug.sh
```

#### Manual Build

```bash
# Navigate to project root
cd /path/to/propertyark

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Sync Capacitor
npx capacitor sync android

# Build debug APK
cd android
./gradlew assembleDebug
cd ..

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

#### Build Output

```
BUILD SUCCESSFUL in 2m 45s
Built the following APK(s):
    android/app/build/outputs/apk/debug/app-debug.apk
```

### Release Build

Release builds are used for distribution. They use production signing credentials and are optimized for performance.

#### Using Build Script

```bash
./scripts/build-android-release.sh
```

#### Manual Build

```bash
# Navigate to project root
cd /path/to/propertyark

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Sync Capacitor
npx capacitor sync android

# Build release APK
cd android
./gradlew assembleRelease
cd ..

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

#### Build Output

```
BUILD SUCCESSFUL in 3m 15s
Built the following APK(s):
    android/app/build/outputs/apk/release/app-release.apk
```

### Build Variants

#### APK vs AAB

- **APK (Android Package)**: Traditional Android app format, suitable for direct installation
- **AAB (Android App Bundle)**: Modern format for Google Play Store, smaller downloads

```bash
# Build APK (debug)
cd android && ./gradlew assembleDebug && cd ..

# Build APK (release)
cd android && ./gradlew assembleRelease && cd ..

# Build AAB (release)
cd android && ./gradlew bundleRelease && cd ..
```

#### Build Variants

```bash
# List available build variants
cd android && ./gradlew tasks | grep assemble && cd ..

# Example output:
# assembleDebug - Assembles all Debug builds
# assembleRelease - Assembles all Release builds
# assembleAndroidTest - Assembles the androidTest build
```

### Signing Configuration

#### Debug Signing

Debug builds are automatically signed with the debug keystore:

```bash
# Debug keystore location
~/.android/debug.keystore

# Debug keystore password
android

# Debug key alias
androiddebugkey

# Debug key password
android
```

#### Release Signing

Release builds use the production keystore configured in `.env.local`:

```bash
# Environment variables
ANDROID_KEYSTORE_PATH=~/.propertyark/propertyark.jks
ANDROID_KEYSTORE_PASSWORD=your-keystore-password
ANDROID_KEY_ALIAS=propertyark-key
ANDROID_KEY_PASSWORD=your-key-password
```

## iOS Builds

### Debug Build

Debug builds are used for development and testing on simulators and devices.

#### Using Build Script

```bash
./scripts/build-ios-debug.sh
```

#### Manual Build

```bash
# Navigate to project root
cd /path/to/propertyark

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Sync Capacitor
npx capacitor sync ios

# Build debug app
cd ios/App
xcodebuild -scheme App -configuration Debug -derivedDataPath build
cd ../../

# App location: ios/App/build/Debug-iphonesimulator/App.app
```

#### Build Output

```
Build complete! (2m 30s)
Build settings from command line:
    CONFIGURATION = Debug
    PLATFORM_NAME = iphonesimulator
    SDKROOT = iphonesimulator17.0

The following build commands were executed:
    Compiling Swift source files
    Linking App
    Copying bundle resources
```

### Release Build

Release builds are used for distribution to the App Store.

#### Using Build Script

```bash
./scripts/build-ios-release.sh
```

#### Manual Build

```bash
# Navigate to project root
cd /path/to/propertyark

# Load environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Sync Capacitor
npx capacitor sync ios

# Build release app
cd ios/App
xcodebuild -scheme App -configuration Release -derivedDataPath build
cd ../../

# App location: ios/App/build/Release-iphoneos/App.app
```

#### Build Output

```
Build complete! (3m 45s)
Build settings from command line:
    CONFIGURATION = Release
    PLATFORM_NAME = iphoneos
    SDKROOT = iphoneos17.0

The following build commands were executed:
    Compiling Swift source files
    Linking App
    Copying bundle resources
    Code signing
```

### Build Destinations

#### Simulator Build

```bash
# Build for simulator
xcodebuild -scheme App -configuration Debug \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath build
```

#### Device Build

```bash
# Build for physical device
xcodebuild -scheme App -configuration Debug \
  -destination 'generic/platform=iOS' \
  -derivedDataPath build
```

### Code Signing

#### Debug Signing

Debug builds use development certificate and provisioning profile:

```bash
# Configured in Xcode project:
# - Code Signing Identity: iPhone Developer
# - Provisioning Profile: PropertyArk Development
```

#### Release Signing

Release builds use distribution certificate and provisioning profile:

```bash
# Configured in Xcode project:
# - Code Signing Identity: iPhone Distribution
# - Provisioning Profile: PropertyArk Distribution
```

## Build Troubleshooting

### Android Build Fails

#### Gradle Sync Error

**Error**: `Could not resolve all dependencies for configuration ':app:debugRuntimeClasspath'`

**Solution**:
```bash
# Clear Gradle cache
rm -rf ~/.gradle/caches

# Rebuild
cd android && ./gradlew clean assembleDebug && cd ..
```

#### Compilation Error

**Error**: `error: cannot find symbol`

**Solution**:
```bash
# Ensure Capacitor sync completed
npx capacitor sync android

# Clean and rebuild
cd android && ./gradlew clean assembleDebug && cd ..
```

#### Signing Error

**Error**: `Keystore was tampered with, or password was incorrect`

**Solution**:
```bash
# Verify keystore path and password in .env.local
cat .env.local | grep ANDROID_KEYSTORE

# Verify keystore file exists
ls -la $ANDROID_KEYSTORE_PATH

# Test keystore
keytool -list -v -keystore $ANDROID_KEYSTORE_PATH
```

### iOS Build Fails

#### Xcode Build Error

**Error**: `error: unable to find a matching provisioning profile`

**Solution**:
```bash
# Verify provisioning profile installed
ls ~/Library/MobileDevice/Provisioning\ Profiles/

# Update Xcode project settings
# 1. Open ios/App/App.xcodeproj in Xcode
# 2. Select "App" target
# 3. Go to Signing & Capabilities
# 4. Select correct provisioning profile
```

#### Pod Installation Error

**Error**: `[!] CocoaPods could not find compatible versions`

**Solution**:
```bash
# Update CocoaPods
sudo gem install cocoapods

# Reinstall pods
cd ios/App
rm -rf Pods Podfile.lock
pod install
cd ../../
```

#### Code Signing Error

**Error**: `Code Signing Error: "iPhone Developer" identity not found`

**Solution**:
```bash
# Verify certificate in keychain
security find-identity -v -p codesigning

# If not found, create new certificate in Apple Developer Portal
# Then update Xcode project settings
```

## Build Optimization

### Android Optimization

#### Reduce Build Time

```bash
# Use Gradle daemon
export GRADLE_OPTS="-Xmx2048m"

# Enable parallel builds
cd android && ./gradlew assembleDebug --parallel && cd ..

# Use incremental compilation
cd android && ./gradlew assembleDebug --build-cache && cd ..
```

#### Reduce APK Size

```bash
# Enable ProGuard/R8 minification
# In android/app/build.gradle:
# buildTypes {
#   release {
#     minifyEnabled true
#     proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
#   }
# }

# Build optimized APK
cd android && ./gradlew assembleRelease && cd ..
```

### iOS Optimization

#### Reduce Build Time

```bash
# Use Xcode build cache
defaults write com.apple.dt.Xcode IDEBuildOperationMaxNumberOfConcurrentCompileTasks 8

# Enable parallel compilation
xcodebuild -scheme App -configuration Debug \
  -derivedDataPath build \
  -parallelizeTargets
```

#### Reduce App Size

```bash
# Enable bitcode
# In Xcode: Build Settings → Enable Bitcode → Yes

# Strip debug symbols
# In Xcode: Build Settings → Strip Debug Symbols During Copy → Yes
```

## Build Artifacts

### Android Artifacts

#### Debug APK

```bash
# Location
android/app/build/outputs/apk/debug/app-debug.apk

# Size: ~50-100 MB
# Signing: Debug keystore
# Installation: adb install app-debug.apk
```

#### Release APK

```bash
# Location
android/app/build/outputs/apk/release/app-release.apk

# Size: ~30-50 MB
# Signing: Production keystore
# Installation: adb install app-release.apk
```

#### Release AAB

```bash
# Location
android/app/build/outputs/bundle/release/app-release.aab

# Size: ~20-40 MB
# Signing: Production keystore
# Distribution: Google Play Store
```

### iOS Artifacts

#### Debug App

```bash
# Location
ios/App/build/Debug-iphonesimulator/App.app

# Size: ~100-200 MB
# Signing: Development certificate
# Installation: xcrun simctl install <simulator-id> App.app
```

#### Release App

```bash
# Location
ios/App/build/Release-iphoneos/App.app

# Size: ~50-100 MB
# Signing: Distribution certificate
# Distribution: App Store
```

#### Release IPA

```bash
# Location
ios/App/build/Release-iphoneos/App.ipa

# Size: ~30-60 MB
# Signing: Distribution certificate
# Distribution: App Store
```

## Next Steps

1. **Deploy to device**: See [Emulator/Simulator Setup](./EMULATOR_SIMULATOR.md)
2. **Use cloud builds**: See [EAS Guide](./EAS_GUIDE.md)
3. **Troubleshoot issues**: See [Troubleshooting Guide](./TROUBLESHOOTING.md)
4. **Configure environment**: See [Environment Variables](./ENVIRONMENT_VARIABLES.md)

## External Resources

- [Android Build Documentation](https://developer.android.com/studio/build)
- [Gradle Documentation](https://gradle.org/docs/)
- [Xcode Build Documentation](https://developer.apple.com/documentation/xcode)
- [Capacitor Build Guide](https://capacitorjs.com/docs/basics/building-your-app)

---

**Ready to build?** Run `./scripts/build-android-debug.sh` or `./scripts/build-ios-debug.sh` to get started.
