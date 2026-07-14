# PropertyArk Mobile Development Setup Guide

## Overview

This guide provides a platform-agnostic overview of setting up the PropertyArk mobile development environment. PropertyArk is a real estate marketplace application built with React Native and Capacitor, supporting both Android and iOS platforms.

The setup process involves:
1. Installing system prerequisites
2. Configuring development tools
3. Setting up environment variables
4. Validating your setup
5. Building and testing the application

## System Requirements

### Minimum Requirements

- **Operating System**: macOS 12+, Windows 10+, or Linux (Ubuntu 20.04+)
- **RAM**: 8GB minimum (16GB recommended)
- **Disk Space**: 50GB minimum (100GB recommended for emulators/simulators)
- **Internet Connection**: Required for downloading SDKs and dependencies

### Required Software

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher (or yarn 3.0.0+)
- **Git**: 2.30.0 or higher

### Platform-Specific Requirements

#### Android Development
- **Android SDK**: API level 34 or higher
- **Build Tools**: 34.0.0 or higher
- **Gradle**: 8.0 or higher
- **Java Development Kit (JDK)**: 11 or higher

#### iOS Development
- **Xcode**: 15.0 or higher (macOS only)
- **iOS SDK**: 14.0 or higher
- **CocoaPods**: 1.12.0 or higher
- **Apple Developer Account**: Required for device testing and distribution

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/propertyark/mobile-app.git
cd mobile-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local

# Edit .env.local with your configuration
# See docs/ENVIRONMENT_VARIABLES.md for detailed information
nano .env.local
```

### 4. Validate Your Setup

```bash
# Run the setup validation script
./scripts/validate-setup.sh
```

This script checks:
- System prerequisites
- Development tools installation
- Configuration files
- Environment variables
- Platform-specific setup (Android/iOS)

### 5. Build and Test

#### Android
```bash
# Debug build
./scripts/build-android-debug.sh

# Release build
./scripts/build-android-release.sh
```

#### iOS
```bash
# Debug build
./scripts/build-ios-debug.sh

# Release build
./scripts/build-ios-release.sh
```

#### Cloud Build (EAS)
```bash
# Submit to EAS for cloud build
./scripts/build-eas.sh
```

## Platform-Specific Setup

### Android Setup

For detailed Android setup instructions, see [docs/ANDROID_SETUP.md](./ANDROID_SETUP.md).

Quick checklist:
- [ ] Android SDK installed with API 34+
- [ ] Build Tools 34.0.0+ installed
- [ ] ANDROID_SDK_ROOT or ANDROID_HOME environment variable set
- [ ] Gradle wrapper available in android/ directory
- [ ] Android emulator created and tested

### iOS Setup

For detailed iOS setup instructions, see [docs/IOS_SETUP.md](./IOS_SETUP.md).

Quick checklist:
- [ ] Xcode 15.0+ installed
- [ ] iOS SDK 14.0+ available
- [ ] CocoaPods installed
- [ ] Development certificate installed in keychain
- [ ] Provisioning profile installed
- [ ] iOS simulator available

## Development Workflow

### 1. Sync Web Assets to Native Projects

```bash
./scripts/sync-capacitor.sh
```

This command:
- Compiles the web application
- Copies web assets to native projects
- Installs Capacitor plugins in native code

### 2. Build for Local Testing

```bash
# Android debug build
./scripts/build-android-debug.sh

# iOS debug build
./scripts/build-ios-debug.sh
```

### 3. Deploy to Emulator/Simulator

```bash
# Android emulator
adb install android/app/build/outputs/apk/debug/app-debug.apk

# iOS simulator
xcrun simctl install booted ios/App/build/Debug-iphonesimulator/App.app
```

### 4. Test on Physical Device

```bash
# Android device
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# iOS device (requires provisioning profile)
# Use Xcode to deploy to device
```

## Build Guides

### Local Builds

For detailed local build instructions, see [docs/BUILD_GUIDE.md](./BUILD_GUIDE.md).

### Cloud Builds (EAS)

For detailed EAS build instructions, see [docs/EAS_GUIDE.md](./EAS_GUIDE.md).

## Environment Variables

All environment variables are documented in [docs/ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).

Key variables to configure:
- `REACT_APP_API_URL`: Backend API endpoint
- `ANDROID_SDK_ROOT`: Android SDK installation path
- `ANDROID_KEYSTORE_PATH`: Path to Android signing keystore
- `IOS_TEAM_ID`: Apple Developer Team ID
- `IOS_BUNDLE_ID`: iOS app bundle identifier

## Troubleshooting

For common issues and solutions, see [docs/TROUBLESHOOTING.md](./TROUBLESHOOTING.md).

Common issues:
- Android SDK not found
- Xcode command line tools not installed
- CocoaPods dependency conflicts
- Capacitor sync failures
- Build signing errors

## Emulator and Simulator Setup

For detailed device setup instructions, see [docs/EMULATOR_SIMULATOR.md](./EMULATOR_SIMULATOR.md).

### Android Emulator

```bash
# Create emulator
android create avd -n PropertyArk -k "system-images;android-34;google_apis;x86_64"

# Launch emulator
emulator -avd PropertyArk
```

### iOS Simulator

```bash
# List available simulators
xcrun simctl list devices

# Launch simulator
xcrun simctl boot <simulator-id>
```

## Dependency Compatibility

For version compatibility information, see [docs/DEPENDENCIES.md](./DEPENDENCIES.md).

Supported versions:
- Capacitor: 5.0+
- Android SDK: API 34+
- iOS SDK: 14.0+
- Gradle: 8.0+
- CocoaPods: 1.12.0+

## Build Scripts Reference

For detailed build script documentation, see [docs/BUILD_SCRIPTS.md](./BUILD_SCRIPTS.md).

Available scripts:
- `build-android-debug.sh`: Build Android debug APK
- `build-android-release.sh`: Build Android release APK
- `build-ios-debug.sh`: Build iOS debug app
- `build-ios-release.sh`: Build iOS release app
- `build-eas.sh`: Submit build to EAS cloud service
- `sync-capacitor.sh`: Sync web assets to native projects
- `validate-setup.sh`: Validate development environment

## Next Steps

1. **Choose your platform**: Start with [Android Setup](./ANDROID_SETUP.md) or [iOS Setup](./IOS_SETUP.md)
2. **Configure environment**: Follow [Environment Variables](./ENVIRONMENT_VARIABLES.md) guide
3. **Validate setup**: Run `./scripts/validate-setup.sh`
4. **Build the app**: Follow [Build Guide](./BUILD_GUIDE.md)
5. **Test on device**: Follow [Emulator/Simulator Setup](./EMULATOR_SIMULATOR.md)

## Getting Help

### Documentation
- [Android Setup Guide](./ANDROID_SETUP.md)
- [iOS Setup Guide](./IOS_SETUP.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [Build Scripts Reference](./BUILD_SCRIPTS.md)

### External Resources
- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/docs)
- [iOS Developer Guide](https://developer.apple.com/documentation/)
- [EAS Documentation](https://docs.expo.dev/eas/)

### Support
- Check [Troubleshooting Guide](./TROUBLESHOOTING.md) for common issues
- Review build script output for specific error messages
- Consult official platform documentation for platform-specific issues

## Version Information

- **PropertyArk Version**: 1.0.1
- **Capacitor Version**: 5.0+
- **React Native**: 0.72+
- **Node.js**: 18.0.0+
- **Last Updated**: 2024

---

**Ready to get started?** Begin with the [Quick Start](#quick-start) section above, then proceed to your platform-specific setup guide.
