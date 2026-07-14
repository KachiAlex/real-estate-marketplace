# Android Development Setup Guide

## Overview

This guide provides step-by-step instructions for setting up the Android development environment for PropertyArk. By the end of this guide, you'll have a fully configured Android development environment capable of building and testing the PropertyArk application.

## Prerequisites

Before starting, ensure you have:
- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git 2.30.0 or higher
- 20GB of free disk space
- Java Development Kit (JDK) 11 or higher

## Step 1: Install Java Development Kit (JDK)

### macOS

```bash
# Using Homebrew
brew install openjdk@11

# Set JAVA_HOME
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 11)' >> ~/.zshrc
source ~/.zshrc

# Verify installation
java -version
```

### Windows

1. Download JDK 11 from [Oracle](https://www.oracle.com/java/technologies/javase-jdk11-downloads.html)
2. Run the installer and follow the prompts
3. Set JAVA_HOME environment variable:
   - Open System Properties → Environment Variables
   - Add new system variable: `JAVA_HOME = C:\Program Files\Java\jdk-11`
4. Verify installation:
   ```cmd
   java -version
   ```

### Linux (Ubuntu)

```bash
# Install OpenJDK 11
sudo apt-get update
sudo apt-get install openjdk-11-jdk

# Set JAVA_HOME
echo 'export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64' >> ~/.bashrc
source ~/.bashrc

# Verify installation
java -version
```

## Step 2: Install Android SDK

### macOS

```bash
# Using Homebrew
brew install android-sdk

# Set ANDROID_SDK_ROOT
echo 'export ANDROID_SDK_ROOT=/usr/local/share/android-sdk' >> ~/.zshrc
echo 'export ANDROID_HOME=$ANDROID_SDK_ROOT' >> ~/.zshrc
source ~/.zshrc
```

### Windows

1. Download Android SDK from [Android Studio](https://developer.android.com/studio)
2. Run the installer
3. During installation, select:
   - Android SDK
   - Android SDK Platform-Tools
   - Android Emulator
4. Set environment variables:
   - `ANDROID_SDK_ROOT = C:\Users\<YourUsername>\AppData\Local\Android\Sdk`
   - `ANDROID_HOME = C:\Users\<YourUsername>\AppData\Local\Android\Sdk`

### Linux (Ubuntu)

```bash
# Download Android SDK Command-line Tools
cd ~/Downloads
wget https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip
unzip commandlinetools-linux-9477386_latest.zip

# Create SDK directory
mkdir -p ~/Android/Sdk
mv cmdline-tools ~/Android/Sdk/

# Set environment variables
echo 'export ANDROID_SDK_ROOT=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export ANDROID_HOME=$ANDROID_SDK_ROOT' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/bin' >> ~/.bashrc
source ~/.bashrc
```

## Step 3: Install Android SDK Components

```bash
# Accept licenses
yes | sdkmanager --licenses

# Install required SDK components
sdkmanager "platforms;android-34"
sdkmanager "build-tools;34.0.0"
sdkmanager "system-images;android-34;google_apis;x86_64"
sdkmanager "platform-tools"
sdkmanager "emulator"

# Verify installation
sdkmanager --list_installed
```

### Expected Output

You should see:
- `platforms;android-34`
- `build-tools;34.0.0`
- `system-images;android-34;google_apis;x86_64`
- `platform-tools`
- `emulator`

## Step 4: Configure Gradle

### Verify Gradle Wrapper

```bash
# Navigate to project root
cd /path/to/propertyark

# Check if gradle wrapper exists
ls -la android/gradlew

# Make it executable
chmod +x android/gradlew
```

### Configure local.properties

```bash
# Create local.properties in android directory
cat > android/local.properties << EOF
sdk.dir=$ANDROID_SDK_ROOT
ndk.dir=$ANDROID_SDK_ROOT/ndk/25.1.8937393
EOF
```

### Verify Gradle Configuration

```bash
# Test Gradle
cd android
./gradlew --version
cd ..
```

## Step 5: Create Android Emulator

### Create Emulator

```bash
# Create emulator with API 34
avdmanager create avd \
  -n PropertyArk \
  -k "system-images;android-34;google_apis;x86_64" \
  -d "Pixel 6"
```

### Configure Emulator (Optional)

Edit `~/.android/avd/PropertyArk/config.ini`:

```ini
# Increase RAM allocation
hw.ramSize=4096

# Enable GPU acceleration
hw.gpu.enabled=yes
hw.gpu.mode=auto

# Enable network
net.speed=full
net.delay=none

# Enable audio
hw.audio=default
```

### Launch Emulator

```bash
# Start emulator
emulator -avd PropertyArk

# Or use Android Studio
# Tools → Device Manager → Launch PropertyArk
```

### Verify Emulator

```bash
# List connected devices
adb devices

# You should see:
# emulator-5554    device
```

## Step 6: Configure Environment Variables

### Create .env.local

```bash
# Copy environment template
cp .env.example .env.local

# Edit with your configuration
nano .env.local
```

### Required Android Variables

```bash
# Android SDK Configuration
ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
ANDROID_HOME=$HOME/Library/Android/sdk
ANDROID_NDK_HOME=$HOME/Library/Android/sdk/ndk/25.1.8937393

# Android Build Configuration
ANDROID_MIN_SDK_VERSION=21
ANDROID_TARGET_SDK_VERSION=34
ANDROID_BUILD_TOOLS_VERSION=34.0.0

# Android Keystore (for release builds)
ANDROID_KEYSTORE_PATH=path/to/keystore.jks
ANDROID_KEYSTORE_PASSWORD=your-keystore-password
ANDROID_KEY_ALIAS=propertyark-key
ANDROID_KEY_PASSWORD=your-key-password
```

See [docs/ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for complete reference.

## Step 7: Create Android Keystore (Release Builds)

### Generate Keystore

```bash
# Generate keystore for release builds
keytool -genkey -v -keystore propertyark.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias propertyark-key

# You'll be prompted for:
# - Keystore password
# - Key password
# - Name, organization, location, etc.
```

### Store Keystore Securely

```bash
# Move keystore to secure location
mkdir -p ~/.propertyark
mv propertyark.jks ~/.propertyark/
chmod 600 ~/.propertyark/propertyark.jks

# Update .env.local
ANDROID_KEYSTORE_PATH=$HOME/.propertyark/propertyark.jks
```

## Step 8: Validate Android Setup

### Run Validation Script

```bash
# Run setup validation
./scripts/validate-setup.sh
```

### Expected Output

```
✓ Android SDK found at: /Users/username/Library/Android/sdk
✓ Gradle installed (Gradle 8.0)
✓ Android project directory exists
✓ Build Tools 34.0.0 installed
✓ API level 34 installed
```

### Manual Verification

```bash
# Verify Android SDK
ls $ANDROID_SDK_ROOT/platforms/android-34

# Verify Build Tools
ls $ANDROID_SDK_ROOT/build-tools/34.0.0

# Verify Gradle
cd android && ./gradlew --version && cd ..

# Verify Emulator
adb devices
```

## Step 9: Build and Test

### Build Debug APK

```bash
# Using build script
./scripts/build-android-debug.sh

# Or manually
cd android
./gradlew assembleDebug
cd ..

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

### Build Release APK

```bash
# Using build script
./scripts/build-android-release.sh

# Or manually
cd android
./gradlew assembleRelease
cd ..

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

### Install on Emulator

```bash
# Install debug APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Launch app
adb shell am start -n com.propertyark.app/.MainActivity
```

### Install on Physical Device

```bash
# Enable USB debugging on device
# Settings → Developer Options → USB Debugging

# Connect device via USB
adb devices

# Install APK
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

### Android SDK Not Found

**Error**: `ANDROID_SDK_ROOT not set`

**Solution**:
```bash
# Set environment variable
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk
export ANDROID_HOME=$ANDROID_SDK_ROOT

# Add to shell profile
echo 'export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk' >> ~/.zshrc
source ~/.zshrc
```

### Gradle Build Fails

**Error**: `Could not find com.android.tools.build:gradle:8.0.0`

**Solution**:
```bash
# Update Gradle wrapper
cd android
./gradlew wrapper --gradle-version 8.0
cd ..

# Clear Gradle cache
rm -rf ~/.gradle/caches
```

### Emulator Won't Start

**Error**: `emulator: ERROR: x86 emulation currently requires hardware acceleration`

**Solution**:
```bash
# Enable hardware acceleration
# macOS: Already enabled by default
# Windows: Enable Hyper-V or use AMD-V
# Linux: Enable KVM

# For Linux:
sudo apt-get install qemu-kvm libvirt-daemon-system libvirt-clients bridge-utils
sudo usermod -a -G kvm $USER
```

### Build Tools Not Found

**Error**: `Could not find build-tools version 34.0.0`

**Solution**:
```bash
# Install build tools
sdkmanager "build-tools;34.0.0"

# Verify installation
ls $ANDROID_SDK_ROOT/build-tools/
```

### Keystore Password Incorrect

**Error**: `Keystore was tampered with, or password was incorrect`

**Solution**:
```bash
# Verify keystore
keytool -list -v -keystore propertyark.jks

# Regenerate if necessary
keytool -genkey -v -keystore propertyark.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias propertyark-key
```

### ADB Device Not Found

**Error**: `error: device not found`

**Solution**:
```bash
# Restart ADB daemon
adb kill-server
adb start-server

# Check devices
adb devices

# For physical device:
# 1. Enable USB debugging in Settings
# 2. Accept USB debugging prompt on device
# 3. Reconnect USB cable
```

## Next Steps

1. **Build the app**: Run `./scripts/build-android-debug.sh`
2. **Test on emulator**: Follow [Emulator Setup](./EMULATOR_SIMULATOR.md)
3. **Configure environment**: See [Environment Variables](./ENVIRONMENT_VARIABLES.md)
4. **Learn build process**: See [Build Guide](./BUILD_GUIDE.md)
5. **Troubleshoot issues**: See [Troubleshooting Guide](./TROUBLESHOOTING.md)

## External Resources

- [Android Developer Guide](https://developer.android.com/docs)
- [Android SDK Documentation](https://developer.android.com/studio/command-line)
- [Gradle Documentation](https://gradle.org/docs/)
- [Capacitor Android Guide](https://capacitorjs.com/docs/android)
- [Android Emulator Documentation](https://developer.android.com/studio/run/emulator)

## Verification Checklist

- [ ] Java Development Kit (JDK) 11+ installed
- [ ] Android SDK installed with API 34+
- [ ] Build Tools 34.0.0+ installed
- [ ] ANDROID_SDK_ROOT environment variable set
- [ ] Gradle wrapper configured and working
- [ ] local.properties configured with SDK path
- [ ] Android emulator created and tested
- [ ] .env.local configured with Android variables
- [ ] Android keystore created (for release builds)
- [ ] Setup validation script passes
- [ ] Debug APK builds successfully
- [ ] APK installs on emulator

---

**Completed Android setup?** Proceed to [iOS Setup](./IOS_SETUP.md) or start [Building](./BUILD_GUIDE.md).
