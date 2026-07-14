# Gradle Build Guide - PropertyArk Mobile WebView

## Overview

This guide explains how to build the PropertyArk mobile app using Gradle directly, without relying on EAS or Expo CLI.

## Prerequisites

### System Requirements
- Java Development Kit (JDK) 11 or higher
- Android SDK (API level 34+)
- Gradle 8.13.0 (included via wrapper)

### Environment Setup

1. **Install Java JDK 11+**
   ```bash
   # Verify Java installation
   java -version
   ```

2. **Set ANDROID_HOME environment variable**
   ```bash
   # Windows
   set ANDROID_HOME=C:\Users\[username]\AppData\Local\Android\Sdk
   
   # macOS/Linux
   export ANDROID_HOME=$HOME/Library/Android/Sdk
   ```

3. **Add Android tools to PATH**
   ```bash
   # Windows
   set PATH=%PATH%;%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools
   
   # macOS/Linux
   export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
   ```

## Build Structure

```
mobile/android/
├── build.gradle              # Top-level build configuration
├── settings.gradle           # Project settings
├── gradle.properties         # Gradle properties
├── gradlew                   # Gradle wrapper (Unix)
├── gradlew.bat              # Gradle wrapper (Windows)
├── gradle/
│   └── wrapper/
│       ├── gradle-wrapper.jar
│       └── gradle-wrapper.properties
└── app/
    ├── build.gradle         # App-level build configuration
    ├── proguard-rules.pro   # ProGuard rules
    └── src/
        ├── main/
        │   ├── AndroidManifest.xml
        │   ├── java/
        │   └── res/
        └── test/
```

## Building with Gradle

### Option 1: Build Debug APK

```bash
cd mobile/android
./gradlew assembleDebug
```

**Output:** `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

### Option 2: Build Release APK

```bash
cd mobile/android
./gradlew assembleRelease
```

**Requirements:**
- Set environment variables:
  - `ANDROID_KEYSTORE_PATH` - Path to keystore file
  - `ANDROID_KEYSTORE_PASSWORD` - Keystore password
  - `ANDROID_KEY_ALIAS` - Key alias
  - `ANDROID_KEY_PASSWORD` - Key password

**Output:** `mobile/android/app/build/outputs/apk/release/app-release.apk`

### Option 3: Build and Install on Device

```bash
cd mobile/android
./gradlew installDebug
```

**Requirements:**
- Android device connected via USB
- USB debugging enabled
- ADB installed and in PATH

### Option 4: Build with Gradle Wrapper (Windows)

```bash
cd mobile\android
gradlew.bat assembleDebug
```

## Gradle Tasks

### Common Tasks

```bash
# Clean build directory
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Install debug APK on device
./gradlew installDebug

# Install release APK on device
./gradlew installRelease

# Run unit tests
./gradlew test

# Run instrumented tests
./gradlew connectedAndroidTest

# Generate build report
./gradlew build --info

# Verify build configuration
./gradlew verifyBuildConfig
```

### Build Variants

```bash
# List all available tasks
./gradlew tasks

# Build specific variant
./gradlew assembleDebug
./gradlew assembleRelease
```

## Build Configuration

### app/build.gradle

Key configuration options:

```groovy
android {
    namespace "com.propertyark.mobile"
    compileSdk 34
    
    defaultConfig {
        applicationId "com.propertyark.mobile"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"
    }
    
    buildTypes {
        debug {
            debuggable true
            minifyEnabled false
        }
        
        release {
            debuggable false
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

### Signing Configuration

For release builds, set environment variables:

```bash
# Windows
set ANDROID_KEYSTORE_PATH=C:\path\to\keystore.jks
set ANDROID_KEYSTORE_PASSWORD=your_password
set ANDROID_KEY_ALIAS=your_alias
set ANDROID_KEY_PASSWORD=your_key_password

# macOS/Linux
export ANDROID_KEYSTORE_PATH=/path/to/keystore.jks
export ANDROID_KEYSTORE_PASSWORD=your_password
export ANDROID_KEY_ALIAS=your_alias
export ANDROID_KEY_PASSWORD=your_key_password
```

## Installation

### Install on Android Device

```bash
# Debug APK
adb install mobile/android/app/build/outputs/apk/debug/app-debug.apk

# Release APK
adb install mobile/android/app/build/outputs/apk/release/app-release.apk

# Reinstall (replace existing)
adb install -r mobile/android/app/build/outputs/apk/debug/app-debug.apk

# Uninstall
adb uninstall com.propertyark.mobile
```

### Install on Android Emulator

```bash
# Start emulator
emulator -avd Pixel_4_API_34

# Install APK
adb install mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

### Build Fails with "ANDROID_HOME not set"

```bash
# Set ANDROID_HOME
# Windows
set ANDROID_HOME=C:\Users\[username]\AppData\Local\Android\Sdk

# macOS/Linux
export ANDROID_HOME=$HOME/Library/Android/Sdk
```

### Build Fails with "Java not found"

```bash
# Verify Java installation
java -version

# Set JAVA_HOME if needed
# Windows
set JAVA_HOME=C:\Program Files\Java\jdk-11

# macOS/Linux
export JAVA_HOME=$(/usr/libexec/java_home -v 11)
```

### Build Fails with "SDK not found"

```bash
# Verify Android SDK installation
ls $ANDROID_HOME/platforms/

# Install missing SDK
sdkmanager "platforms;android-34"
sdkmanager "build-tools;34.0.0"
```

### APK Installation Fails

```bash
# Clear existing app
adb uninstall com.propertyark.mobile

# Install APK
adb install mobile/android/app/build/outputs/apk/debug/app-debug.apk

# Check device logs
adb logcat | grep propertyark
```

### Gradle Wrapper Permission Denied (macOS/Linux)

```bash
# Make gradlew executable
chmod +x mobile/android/gradlew

# Try build again
./gradlew assembleDebug
```

## Performance Optimization

### Faster Builds

```bash
# Enable parallel builds
./gradlew assembleDebug --parallel

# Use daemon
./gradlew assembleDebug --daemon

# Increase heap size
export GRADLE_OPTS="-Xmx2048m"
./gradlew assembleDebug
```

### Reduce APK Size

The build configuration includes:
- ProGuard/R8 code shrinking
- Resource shrinking
- Minification

These are enabled in release builds automatically.

## Continuous Integration

### GitHub Actions Example

```yaml
name: Build APK

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-java@v2
        with:
          java-version: '11'
      - run: cd mobile/android && ./gradlew assembleDebug
      - uses: actions/upload-artifact@v2
        with:
          name: app-debug.apk
          path: mobile/android/app/build/outputs/apk/debug/app-debug.apk
```

## Next Steps

1. **Build Debug APK:**
   ```bash
   cd mobile/android
   ./gradlew assembleDebug
   ```

2. **Install on Device:**
   ```bash
   adb install mobile/android/app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Test on Device:**
   - Open PropertyArk app
   - Verify web app loads
   - Test all features

4. **Build Release APK:**
   ```bash
   cd mobile/android
   ./gradlew assembleRelease
   ```

5. **Publish to Play Store:**
   - Upload APK to Google Play Console
   - Follow Play Store submission process

## Support

For more information:
- [Gradle Documentation](https://gradle.org/docs/)
- [Android Build System](https://developer.android.com/build)
- [Gradle Wrapper](https://docs.gradle.org/current/userguide/gradle_wrapper.html)
