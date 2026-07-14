# Troubleshooting Guide

## Overview

This guide provides solutions for common issues encountered during PropertyArk mobile development setup and building. Each issue includes symptoms, root causes, and step-by-step solutions.

## Android Troubleshooting

### Android SDK Not Found

**Symptoms**:
- Error: `ANDROID_SDK_ROOT not set`
- Error: `Could not find Android SDK`
- Gradle build fails with SDK error

**Root Causes**:
- Android SDK not installed
- Environment variable not set
- Incorrect SDK path

**Solutions**:

1. **Verify Android SDK Installation**
   ```bash
   # Check if SDK exists
   ls -la $ANDROID_SDK_ROOT
   
   # If not found, install Android SDK
   # See docs/ANDROID_SETUP.md for installation steps
   ```

2. **Set Environment Variable**
   ```bash
   # Add to .env.local
   ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
   ANDROID_HOME=$HOME/Library/Android/sdk
   
   # Or add to shell profile
   echo 'export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk' >> ~/.zshrc
   source ~/.zshrc
   ```

3. **Verify Path**
   ```bash
   # Check if path is correct
   ls $ANDROID_SDK_ROOT/platforms/android-34
   
   # If not found, adjust path
   export ANDROID_SDK_ROOT=/correct/path/to/sdk
   ```

### Gradle Build Fails

**Symptoms**:
- Error: `Could not find com.android.tools.build:gradle`
- Error: `Gradle sync failed`
- Build hangs or times out

**Root Causes**:
- Gradle cache corrupted
- Gradle version incompatible
- Network connectivity issue
- Insufficient disk space

**Solutions**:

1. **Clear Gradle Cache**
   ```bash
   # Remove Gradle cache
   rm -rf ~/.gradle/caches
   
   # Rebuild
   cd android && ./gradlew clean assembleDebug && cd ..
   ```

2. **Update Gradle Wrapper**
   ```bash
   # Update to latest Gradle version
   cd android
   ./gradlew wrapper --gradle-version 8.0
   cd ..
   ```

3. **Check Network Connectivity**
   ```bash
   # Test internet connection
   ping google.com
   
   # If offline, connect to network and retry
   ```

4. **Free Disk Space**
   ```bash
   # Check available disk space
   df -h
   
   # If low on space, delete unnecessary files
   # Gradle cache: rm -rf ~/.gradle/caches
   # Android SDK: Remove unused SDK versions
   ```

### Build Tools Not Found

**Symptoms**:
- Error: `Could not find build-tools version 34.0.0`
- Error: `Build tools not installed`

**Root Causes**:
- Build tools not installed
- Incorrect version specified
- SDK path incorrect

**Solutions**:

1. **Install Build Tools**
   ```bash
   # Install specific version
   sdkmanager "build-tools;34.0.0"
   
   # Verify installation
   ls $ANDROID_SDK_ROOT/build-tools/
   ```

2. **Update build.gradle**
   ```bash
   # Check android/app/build.gradle
   cat android/app/build.gradle | grep buildToolsVersion
   
   # Update if necessary
   # buildToolsVersion "34.0.0"
   ```

### Emulator Won't Start

**Symptoms**:
- Error: `emulator: ERROR: x86 emulation currently requires hardware acceleration`
- Emulator crashes on startup
- Emulator hangs

**Root Causes**:
- Hardware acceleration not enabled
- Emulator configuration incorrect
- Insufficient resources

**Solutions**:

1. **Enable Hardware Acceleration**
   ```bash
   # macOS: Already enabled by default
   
   # Windows: Enable Hyper-V
   # Settings → Apps → Apps & features → Programs and Features
   # → Turn Windows features on or off → Hyper-V
   
   # Linux: Enable KVM
   sudo apt-get install qemu-kvm libvirt-daemon-system
   sudo usermod -a -G kvm $USER
   ```

2. **Increase Emulator Resources**
   ```bash
   # Edit ~/.android/avd/PropertyArk/config.ini
   hw.ramSize=4096
   hw.gpu.enabled=yes
   hw.gpu.mode=auto
   ```

3. **Restart Emulator**
   ```bash
   # Kill all emulator processes
   pkill -f emulator
   
   # Restart emulator
   emulator -avd PropertyArk
   ```

### APK Installation Fails

**Symptoms**:
- Error: `adb: command not found`
- Error: `device not found`
- Error: `INSTALL_FAILED_INVALID_APK`

**Root Causes**:
- ADB not in PATH
- Device not connected
- APK corrupted or invalid

**Solutions**:

1. **Verify ADB Installation**
   ```bash
   # Check if adb is available
   which adb
   
   # If not found, add to PATH
   export PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools
   ```

2. **Check Connected Devices**
   ```bash
   # List connected devices
   adb devices
   
   # If no devices, restart ADB
   adb kill-server
   adb start-server
   ```

3. **Verify APK**
   ```bash
   # Check if APK exists
   ls -lh android/app/build/outputs/apk/debug/app-debug.apk
   
   # Verify APK integrity
   file android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Keystore Password Incorrect

**Symptoms**:
- Error: `Keystore was tampered with, or password was incorrect`
- Error: `Could not sign the APK`

**Root Causes**:
- Wrong password entered
- Keystore file corrupted
- Keystore path incorrect

**Solutions**:

1. **Verify Keystore**
   ```bash
   # List keystore contents
   keytool -list -v -keystore $ANDROID_KEYSTORE_PATH
   
   # You'll be prompted for password
   ```

2. **Update .env.local**
   ```bash
   # Verify credentials in .env.local
   cat .env.local | grep ANDROID_KEYSTORE
   
   # Update if necessary
   ANDROID_KEYSTORE_PATH=$HOME/.propertyark/propertyark.jks
   ANDROID_KEYSTORE_PASSWORD=correct-password
   ```

3. **Regenerate Keystore**
   ```bash
   # If password is lost, regenerate keystore
   keytool -genkey -v -keystore propertyark.jks \
     -keyalg RSA -keysize 2048 -validity 10000 \
     -alias propertyark-key
   ```

## iOS Troubleshooting

### Xcode Command Line Tools Not Found

**Symptoms**:
- Error: `xcode-select: error: tool 'xcodebuild' not found`
- Error: `xcrun: error: unable to find utility`

**Root Causes**:
- Xcode not installed
- Command line tools not installed
- Xcode path incorrect

**Solutions**:

1. **Install Command Line Tools**
   ```bash
   # Install Xcode command line tools
   xcode-select --install
   
   # Accept Xcode license
   sudo xcodebuild -license accept
   ```

2. **Reset Xcode Path**
   ```bash
   # Reset to default path
   sudo xcode-select --reset
   
   # Or set specific path
   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
   ```

3. **Verify Installation**
   ```bash
   # Check Xcode version
   xcode-select --version
   
   # Check Xcode path
   xcode-select -p
   ```

### CocoaPods Dependency Conflicts

**Symptoms**:
- Error: `[!] CocoaPods could not find compatible versions`
- Error: `Podfile.lock conflicts`
- Pod installation fails

**Root Causes**:
- CocoaPods version incompatible
- Pod repository outdated
- Dependency version conflicts

**Solutions**:

1. **Update CocoaPods**
   ```bash
   # Update CocoaPods
   sudo gem install cocoapods
   
   # Update pod repository
   pod repo update
   ```

2. **Reinstall Pods**
   ```bash
   # Remove Pods and lock file
   cd ios/App
   rm -rf Pods Podfile.lock
   
   # Reinstall
   pod install
   cd ../../
   ```

3. **Check Podfile**
   ```bash
   # Verify Podfile syntax
   cd ios/App
   pod install --verbose
   cd ../../
   ```

### Certificate Not Found

**Symptoms**:
- Error: `Code Signing Error: "iPhone Developer" identity not found`
- Error: `No matching provisioning profiles found`

**Root Causes**:
- Certificate not installed in keychain
- Provisioning profile not installed
- Certificate expired

**Solutions**:

1. **Verify Certificate Installation**
   ```bash
   # List certificates in keychain
   security find-identity -v -p codesigning
   
   # If not found, create new certificate
   # See docs/IOS_SETUP.md for certificate creation
   ```

2. **Install Provisioning Profile**
   ```bash
   # List provisioning profiles
   ls ~/Library/MobileDevice/Provisioning\ Profiles/
   
   # If not found, download from Apple Developer Portal
   # Double-click to install
   ```

3. **Update Xcode Project**
   ```bash
   # In Xcode:
   # 1. Select "App" target
   # 2. Go to Signing & Capabilities
   # 3. Select correct Team and Provisioning Profile
   ```

### Provisioning Profile Not Found

**Symptoms**:
- Error: `No provisioning profiles found that match the bundle identifier`
- Error: `Provisioning profile is invalid`

**Root Causes**:
- Provisioning profile not created
- Bundle ID mismatch
- Provisioning profile expired

**Solutions**:

1. **Create Provisioning Profile**
   ```bash
   # Go to Apple Developer Portal
   # 1. Certificates, Identifiers & Profiles → Profiles
   # 2. Click "+" to create new profile
   # 3. Select "iOS App Development"
   # 4. Select App ID and certificate
   # 5. Download and install
   ```

2. **Verify Bundle ID**
   ```bash
   # Check bundle ID in Xcode
   # Build Settings → Bundle Identifier
   
   # Should match App ID in Apple Developer Portal
   # Example: com.propertyark.app
   ```

3. **Refresh Provisioning Profiles**
   ```bash
   # In Xcode:
   # Xcode → Preferences → Accounts
   # Select Apple ID → Download Manual Profiles
   ```

### Simulator Won't Boot

**Symptoms**:
- Error: `Unable to boot simulator`
- Simulator hangs on startup
- Simulator crashes

**Root Causes**:
- Simulator corrupted
- Insufficient resources
- Xcode issue

**Solutions**:

1. **Erase Simulator**
   ```bash
   # Erase all simulators
   xcrun simctl erase all
   
   # Or erase specific simulator
   SIMULATOR_ID=$(xcrun simctl list devices | grep "PropertyArk iPhone 15" | grep -oE '\([A-F0-9-]+\)' | tr -d '()')
   xcrun simctl erase $SIMULATOR_ID
   ```

2. **Restart Simulator**
   ```bash
   # Kill all simulator processes
   pkill -f "iPhone Simulator"
   
   # Restart Xcode
   killall Xcode
   open /Applications/Xcode.app
   ```

3. **Increase Resources**
   ```bash
   # Allocate more RAM to simulator
   # Xcode → Preferences → Locations
   # Derived Data → Delete
   ```

### Build Fails with Pod Error

**Symptoms**:
- Error: `ld: library not found for -lPods-App`
- Error: `Undefined symbols for architecture arm64`

**Root Causes**:
- Pods not linked correctly
- Pod cache corrupted
- Build settings incorrect

**Solutions**:

1. **Reinstall Pods**
   ```bash
   # Remove and reinstall pods
   cd ios/App
   rm -rf Pods Podfile.lock
   pod install
   cd ../../
   ```

2. **Clean Xcode Build**
   ```bash
   # Clean build folder
   cd ios/App
   xcodebuild clean -scheme App
   cd ../../
   
   # Rebuild
   ./scripts/build-ios-debug.sh
   ```

3. **Update Build Settings**
   ```bash
   # In Xcode:
   # 1. Select "App" target
   # 2. Build Settings → Search Paths
   # 3. Verify Pod paths are correct
   ```

### Team ID Not Set

**Symptoms**:
- Error: `No team ID found in Xcode project`
- Error: `Code signing identity not found`

**Root Causes**:
- Team ID not configured
- Team ID incorrect
- Xcode project not updated

**Solutions**:

1. **Set Team ID in Xcode**
   ```bash
   # In Xcode:
   # 1. Select "App" target
   # 2. Go to Signing & Capabilities
   # 3. Click "Team" dropdown
   # 4. Select your Apple Developer Team
   ```

2. **Set Team ID in Environment**
   ```bash
   # Add to .env.local
   IOS_TEAM_ID=XXXXXXXXXX
   
   # Verify
   echo $IOS_TEAM_ID
   ```

## Capacitor Troubleshooting

### Capacitor Sync Fails

**Symptoms**:
- Error: `Capacitor sync failed`
- Error: `Could not find Capacitor CLI`
- Web assets not copied to native projects

**Root Causes**:
- Capacitor not installed
- Web build failed
- Native project not found

**Solutions**:

1. **Install Capacitor**
   ```bash
   # Install Capacitor CLI
   npm install -g @capacitor/cli
   
   # Or use npx
   npx capacitor sync
   ```

2. **Build Web Application**
   ```bash
   # Build web assets
   npm run build
   
   # Verify build output
   ls -la build/
   ```

3. **Verify Native Projects**
   ```bash
   # Check if native projects exist
   ls -la android/
   ls -la ios/
   
   # If not found, add platforms
   npx capacitor add android
   npx capacitor add ios
   ```

### Plugin Not Available

**Symptoms**:
- Error: `Plugin not found`
- Error: `Undefined is not an object (evaluating 'Capacitor.Plugins')`

**Root Causes**:
- Plugin not installed
- Plugin not synced to native projects
- Plugin not imported correctly

**Solutions**:

1. **Install Plugin**
   ```bash
   # Install plugin via npm
   npm install @capacitor/camera
   
   # Sync to native projects
   npx capacitor sync
   ```

2. **Verify Plugin Installation**
   ```bash
   # Check if plugin is in node_modules
   ls node_modules/@capacitor/camera
   
   # Check if plugin is in native projects
   ls android/app/src/main/java/com/getcapacitor/community/
   ls ios/App/Pods/CapacitorCamera/
   ```

3. **Import Plugin Correctly**
   ```typescript
   // Correct import
   import { Camera } from '@capacitor/camera';
   
   // Use plugin
   const photo = await Camera.getPhoto({
     quality: 90,
     allowEditing: true,
     resultType: CameraResultType.Uri
   });
   ```

## Environment Variable Troubleshooting

### Environment Variable Not Found

**Symptoms**:
- Error: `Environment variable not found`
- Build fails with missing variable
- Variable is undefined

**Root Causes**:
- .env.local not created
- Variable not set in .env.local
- Environment not loaded

**Solutions**:

1. **Create .env.local**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit with your values
   nano .env.local
   ```

2. **Load Environment Variables**
   ```bash
   # Load from .env.local
   export $(cat .env.local | grep -v '^#' | xargs)
   
   # Verify variable is set
   echo $VARIABLE_NAME
   ```

3. **Check Variable Value**
   ```bash
   # Print variable value
   echo $REACT_APP_API_URL
   
   # If empty, update .env.local
   nano .env.local
   ```

### Wrong Environment Variable Value

**Symptoms**:
- App connects to wrong API endpoint
- Build uses wrong configuration
- Feature flags not working

**Root Causes**:
- Wrong value in .env.local
- Environment not reloaded
- Variable overridden elsewhere

**Solutions**:

1. **Verify Current Value**
   ```bash
   # Check current value
   echo $REACT_APP_API_URL
   
   # Check value in .env.local
   cat .env.local | grep REACT_APP_API_URL
   ```

2. **Update .env.local**
   ```bash
   # Edit environment file
   nano .env.local
   
   # Update variable value
   REACT_APP_API_URL=https://correct-api.example.com
   ```

3. **Reload Environment**
   ```bash
   # Reload environment variables
   export $(cat .env.local | grep -v '^#' | xargs)
   
   # Verify new value
   echo $REACT_APP_API_URL
   ```

## Validation Script Issues

### Validation Script Fails

**Symptoms**:
- Error: `./scripts/validate-setup.sh: Permission denied`
- Validation script doesn't run
- Validation reports false failures

**Root Causes**:
- Script not executable
- Script has syntax errors
- Missing dependencies

**Solutions**:

1. **Make Script Executable**
   ```bash
   # Add execute permission
   chmod +x ./scripts/validate-setup.sh
   
   # Run script
   ./scripts/validate-setup.sh
   ```

2. **Check Script Syntax**
   ```bash
   # Verify script syntax
   bash -n ./scripts/validate-setup.sh
   
   # If errors, check script content
   cat ./scripts/validate-setup.sh
   ```

3. **Install Missing Dependencies**
   ```bash
   # Ensure required tools are installed
   which node npm git
   
   # Install missing tools
   # See docs/SETUP.md for installation instructions
   ```

## Getting Help

### Check Documentation

1. **Setup Guide**: [docs/SETUP.md](./SETUP.md)
2. **Android Setup**: [docs/ANDROID_SETUP.md](./ANDROID_SETUP.md)
3. **iOS Setup**: [docs/IOS_SETUP.md](./IOS_SETUP.md)
4. **Build Guide**: [docs/BUILD_GUIDE.md](./BUILD_GUIDE.md)
5. **Environment Variables**: [docs/ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)

### External Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/docs)
- [iOS Developer Guide](https://developer.apple.com/documentation/)
- [Gradle Documentation](https://gradle.org/docs/)
- [Xcode Documentation](https://developer.apple.com/xcode/)

### Debug Commands

```bash
# Validate setup
./scripts/validate-setup.sh

# Check environment variables
env | grep REACT_APP

# Check Android SDK
ls $ANDROID_SDK_ROOT/platforms/

# Check iOS SDK
xcrun simctl list runtimes

# Check Capacitor
npx capacitor --version

# Check Gradle
cd android && ./gradlew --version && cd ..

# Check CocoaPods
pod --version
```

---

**Still stuck?** Check the [External Resources](#external-resources) section or consult the official documentation for your platform.
