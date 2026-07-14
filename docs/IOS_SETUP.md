# iOS Development Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the iOS development environment for PropertyArk. By the end of this guide, you'll have a fully configured iOS development environment capable of building and testing the PropertyArk application on simulators and physical devices.

**Note**: iOS development requires macOS. If you're on Windows or Linux, skip this guide and proceed with Android development.

## Prerequisites

Before starting, ensure you have:
- macOS 12.0 or higher
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git 2.30.0 or higher
- 30GB of free disk space
- Apple Developer Account (for device testing and distribution)

## Step 1: Install Xcode

### Install from App Store

```bash
# Open App Store and search for Xcode
# Or use command line
mas install 497799835  # Xcode App Store ID

# This will take 30-45 minutes to download and install
```

### Install Command Line Tools

```bash
# Install Xcode command line tools
xcode-select --install

# Verify installation
xcode-select --print-path
# Output: /Applications/Xcode.app/Contents/Developer

# Accept Xcode license
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```

### Verify Xcode Installation

```bash
# Check Xcode version
xcode-select --version
# Output: xcode-select version 2396.

# Check Xcode path
xcode-select -p
# Output: /Applications/Xcode.app/Contents/Developer

# Verify Xcode works
xcodebuild -version
# Output: Xcode 15.0 or higher
```

## Step 2: Install CocoaPods

### Install CocoaPods

```bash
# Install via gem (Ruby package manager)
sudo gem install cocoapods

# Verify installation
pod --version
# Output: 1.12.0 or higher
```

### Update CocoaPods Repository

```bash
# Update pod repository
pod repo update

# This may take a few minutes
```

## Step 3: Install iOS SDK

### Verify iOS SDK Installation

```bash
# List installed iOS SDKs
xcode-select -p
# Should show: /Applications/Xcode.app/Contents/Developer

# List available iOS versions
xcrun simctl list runtimes

# You should see iOS 14.0 or higher
```

### Install Additional iOS SDKs (if needed)

```bash
# Open Xcode and go to Preferences
# Xcode → Preferences → Locations → Command Line Tools
# Select the latest Xcode version

# Or use command line
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

## Step 4: Create iOS Simulator

### List Available Simulators

```bash
# List all simulators
xcrun simctl list devices

# Example output:
# iPhone 15 (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX) (Shutdown)
# iPhone 15 Pro (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX) (Shutdown)
```

### Create New Simulator

```bash
# Create simulator for iPhone 15 with iOS 17
xcrun simctl create "PropertyArk iPhone 15" \
  com.apple.CoreSimulator.SimDeviceType.iPhone-15 \
  com.apple.CoreSimulator.SimRuntime.iOS-17-0

# Verify creation
xcrun simctl list devices | grep PropertyArk
```

### Launch Simulator

```bash
# Get simulator ID
SIMULATOR_ID=$(xcrun simctl list devices | grep "PropertyArk iPhone 15" | grep -oE '\([A-F0-9-]+\)' | tr -d '()')

# Launch simulator
xcrun simctl boot $SIMULATOR_ID

# Or use Xcode
# Xcode → Window → Devices and Simulators → Select simulator → Boot
```

## Step 5: Set Up Development Certificate

### Create Certificate Signing Request (CSR)

```bash
# Open Keychain Access
open /Applications/Utilities/Keychain\ Access.app

# Menu: Keychain Access → Certificate Assistant → Request a Certificate from a Certificate Authority
# Fill in:
# - Email Address: your-email@example.com
# - Common Name: Your Name
# - Request is: Saved to disk
# - Save as: CertificateSigningRequest.certSigningRequest
```

### Create Development Certificate

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Sign in with your Apple ID
3. Navigate to Certificates, Identifiers & Profiles
4. Click "Certificates" → "+" to create new certificate
5. Select "iOS App Development"
6. Upload your CSR file
7. Download the certificate
8. Double-click to install in Keychain

### Verify Certificate Installation

```bash
# List certificates in keychain
security find-identity -v -p codesigning

# You should see your development certificate:
# 1) XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX "iPhone Developer: Your Name (XXXXXXXXXX)"
```

## Step 6: Create App ID and Provisioning Profile

### Create App ID

1. Go to [Apple Developer Portal](https://developer.apple.com/account)
2. Navigate to Certificates, Identifiers & Profiles → Identifiers
3. Click "+" to create new identifier
4. Select "App IDs"
5. Fill in:
   - App Type: App
   - Description: PropertyArk
   - Bundle ID: com.propertyark.app (or your custom ID)
6. Click "Continue" and "Register"

### Create Provisioning Profile

1. Navigate to Certificates, Identifiers & Profiles → Profiles
2. Click "+" to create new profile
3. Select "iOS App Development"
4. Select your App ID (com.propertyark.app)
5. Select your development certificate
6. Select devices for testing
7. Name the profile: PropertyArk Development
8. Download the profile
9. Double-click to install

### Verify Provisioning Profile

```bash
# List provisioning profiles
ls ~/Library/MobileDevice/Provisioning\ Profiles/

# You should see your profile:
# PropertyArk_Development.mobileprovision
```

## Step 7: Configure Environment Variables

### Create .env.local

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your configuration
nano .env.local
```

### Required iOS Variables

```bash
# iOS Development Team ID
IOS_TEAM_ID=XXXXXXXXXX  # From Apple Developer Account

# iOS Bundle Identifier
IOS_BUNDLE_ID=com.propertyark.app

# iOS Deployment Target
IOS_DEPLOYMENT_TARGET=14.0

# iOS Code Signing Configuration
IOS_CERTIFICATE_ID=your-certificate-id
IOS_PROVISIONING_PROFILE_ID=your-provisioning-profile-id
```

See [docs/ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for complete reference.

## Step 8: Configure Xcode Project

### Update Bundle Identifier

```bash
# Open Xcode project
open ios/App/App.xcodeproj

# In Xcode:
# 1. Select "App" target
# 2. Go to Build Settings
# 3. Search for "Bundle Identifier"
# 4. Set to: com.propertyark.app
```

### Configure Code Signing

```bash
# In Xcode:
# 1. Select "App" target
# 2. Go to Signing & Capabilities
# 3. Select Team: Your Apple Developer Team
# 4. Provisioning Profile: PropertyArk Development
# 5. Code Signing Identity: iPhone Developer
```

### Set Deployment Target

```bash
# In Xcode:
# 1. Select "App" target
# 2. Go to Build Settings
# 3. Search for "Deployment Target"
# 4. Set to: 14.0 or higher
```

## Step 9: Install CocoaPods Dependencies

### Install Pods

```bash
# Navigate to iOS project
cd ios/App

# Install CocoaPods dependencies
pod install

# This may take several minutes
cd ../..
```

### Verify Pod Installation

```bash
# Check if Pods directory exists
ls -la ios/App/Pods

# Check if Podfile.lock exists
ls -la ios/App/Podfile.lock
```

## Step 10: Validate iOS Setup

### Run Validation Script

```bash
# Run setup validation
./scripts/validate-setup.sh
```

### Expected Output

```
✓ Xcode found (xcode-select version 2396)
✓ CocoaPods installed (1.12.0)
✓ iOS project directory exists
✓ Podfile exists
✓ iOS SDK 14.0+ available
```

### Manual Verification

```bash
# Verify Xcode
xcode-select --version

# Verify CocoaPods
pod --version

# Verify iOS SDK
xcrun simctl list runtimes

# Verify simulator
xcrun simctl list devices | grep iPhone

# Verify certificate
security find-identity -v -p codesigning

# Verify provisioning profile
ls ~/Library/MobileDevice/Provisioning\ Profiles/
```

## Step 11: Build and Test

### Build Debug App

```bash
# Using build script
./scripts/build-ios-debug.sh

# Or manually
cd ios/App
xcodebuild -scheme App -configuration Debug -derivedDataPath build
cd ../..

# App location: ios/App/build/Debug-iphonesimulator/App.app
```

### Build Release App

```bash
# Using build script
./scripts/build-ios-release.sh

# Or manually
cd ios/App
xcodebuild -scheme App -configuration Release -derivedDataPath build
cd ../..

# App location: ios/App/build/Release-iphoneos/App.app
```

### Install on Simulator

```bash
# Get simulator ID
SIMULATOR_ID=$(xcrun simctl list devices | grep "PropertyArk iPhone 15" | grep -oE '\([A-F0-9-]+\)' | tr -d '()')

# Boot simulator if not running
xcrun simctl boot $SIMULATOR_ID

# Install app
xcrun simctl install $SIMULATOR_ID ios/App/build/Debug-iphonesimulator/App.app

# Launch app
xcrun simctl launch $SIMULATOR_ID com.propertyark.app
```

### Install on Physical Device

```bash
# Connect device via USB
# Trust the computer on your device

# Build for device
cd ios/App
xcodebuild -scheme App -configuration Debug \
  -destination 'generic/platform=iOS' \
  -derivedDataPath build
cd ../..

# Install using Xcode or Xcode command line tools
# Or use ios-deploy:
npm install -g ios-deploy
ios-deploy -b ios/App/build/Debug-iphoneos/App.app
```

## Troubleshooting

### Xcode Command Line Tools Not Found

**Error**: `xcode-select: error: tool 'xcodebuild' not found`

**Solution**:
```bash
# Install command line tools
xcode-select --install

# Or reset to default path
sudo xcode-select --reset
```

### CocoaPods Dependency Conflicts

**Error**: `[!] CocoaPods could not find compatible versions for pod "Capacitor"`

**Solution**:
```bash
# Update CocoaPods
sudo gem install cocoapods

# Update pod repository
pod repo update

# Remove Pods and reinstall
cd ios/App
rm -rf Pods Podfile.lock
pod install
cd ../..
```

### Certificate Not Found

**Error**: `Code Signing Error: "iPhone Developer" identity not found`

**Solution**:
```bash
# Verify certificate in keychain
security find-identity -v -p codesigning

# If not found, create new certificate:
# 1. Go to Apple Developer Portal
# 2. Create new development certificate
# 3. Download and install in Keychain
```

### Provisioning Profile Not Found

**Error**: `No provisioning profiles found that match the bundle identifier`

**Solution**:
```bash
# Verify provisioning profile
ls ~/Library/MobileDevice/Provisioning\ Profiles/

# If not found:
# 1. Go to Apple Developer Portal
# 2. Create new provisioning profile
# 3. Download and install
# 4. Update Xcode project settings
```

### Simulator Won't Boot

**Error**: `Unable to boot simulator`

**Solution**:
```bash
# Erase simulator
xcrun simctl erase all

# Or erase specific simulator
SIMULATOR_ID=$(xcrun simctl list devices | grep "PropertyArk iPhone 15" | grep -oE '\([A-F0-9-]+\)' | tr -d '()')
xcrun simctl erase $SIMULATOR_ID

# Restart simulator
xcrun simctl boot $SIMULATOR_ID
```

### Build Fails with Pod Error

**Error**: `ld: library not found for -lPods-App`

**Solution**:
```bash
# Reinstall pods
cd ios/App
rm -rf Pods Podfile.lock
pod install
cd ../..

# Clean Xcode build
cd ios/App
xcodebuild clean -scheme App
cd ../..

# Rebuild
./scripts/build-ios-debug.sh
```

### Team ID Not Set

**Error**: `No team ID found in Xcode project`

**Solution**:
```bash
# In Xcode:
# 1. Select "App" target
# 2. Go to Signing & Capabilities
# 3. Click "Team" dropdown
# 4. Select your Apple Developer Team

# Or set in environment:
export IOS_TEAM_ID=XXXXXXXXXX
```

## Next Steps

1. **Build the app**: Run `./scripts/build-ios-debug.sh`
2. **Test on simulator**: Follow [Simulator Setup](./EMULATOR_SIMULATOR.md)
3. **Configure environment**: See [Environment Variables](./ENVIRONMENT_VARIABLES.md)
4. **Learn build process**: See [Build Guide](./BUILD_GUIDE.md)
5. **Troubleshoot issues**: See [Troubleshooting Guide](./TROUBLESHOOTING.md)

## External Resources

- [Apple Developer Guide](https://developer.apple.com/documentation/)
- [Xcode Documentation](https://developer.apple.com/xcode/)
- [iOS Development Guide](https://developer.apple.com/ios/)
- [CocoaPods Documentation](https://cocoapods.org/)
- [Capacitor iOS Guide](https://capacitorjs.com/docs/ios)
- [Apple Developer Account](https://developer.apple.com/account)

## Verification Checklist

- [ ] Xcode 15.0+ installed
- [ ] Xcode command line tools installed
- [ ] CocoaPods installed and updated
- [ ] iOS SDK 14.0+ available
- [ ] Development certificate created and installed
- [ ] App ID created in Apple Developer Portal
- [ ] Provisioning profile created and installed
- [ ] iOS simulator created and tested
- [ ] .env.local configured with iOS variables
- [ ] Xcode project configured with bundle ID
- [ ] Code signing configured in Xcode
- [ ] CocoaPods dependencies installed
- [ ] Setup validation script passes
- [ ] Debug app builds successfully
- [ ] App installs on simulator

---

**Completed iOS setup?** Proceed to [Building](./BUILD_GUIDE.md) or [Emulator/Simulator Setup](./EMULATOR_SIMULATOR.md).
