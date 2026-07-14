# Emulator and Simulator Setup Guide

## Overview

This guide explains how to set up and use Android emulators and iOS simulators for testing PropertyArk during development. Emulators and simulators allow you to test the app without physical devices.

## Android Emulator

### Prerequisites

- Android SDK installed with API 34+
- ANDROID_SDK_ROOT environment variable set
- 4GB RAM minimum (8GB recommended)
- 5GB disk space minimum

### Create Emulator

#### Using Command Line

```bash
# Create emulator with API 34
avdmanager create avd \
  -n PropertyArk \
  -k "system-images;android-34;google_apis;x86_64" \
  -d "Pixel 6"

# Verify creation
avdmanager list avd
```

#### Using Android Studio

1. Open Android Studio
2. Tools → Device Manager
3. Click "Create Device"
4. Select device (e.g., Pixel 6)
5. Select system image (Android 14, API 34)
6. Configure settings
7. Click "Finish"

### Configure Emulator

Edit `~/.android/avd/PropertyArk/config.ini`:

```ini
# Display settings
hw.lcd.density=420
hw.lcd.height=2400
hw.lcd.width=1080

# Memory settings
hw.ramSize=4096
hw.vm.heapSize=512

# GPU acceleration
hw.gpu.enabled=yes
hw.gpu.mode=auto

# Network settings
net.speed=full
net.delay=none

# Audio
hw.audio=default

# Camera
hw.camera.back=emulated
hw.camera.front=emulated

# Sensors
hw.sensors.orientation=yes
hw.sensors.proximity=yes
```

### Launch Emulator

#### Command Line

```bash
# Launch emulator
emulator -avd PropertyArk

# With additional options
emulator -avd PropertyArk -gpu on -memory 4096

# Headless mode (no GUI)
emulator -avd PropertyArk -no-window
```

#### Android Studio

1. Tools → Device Manager
2. Select PropertyArk emulator
3. Click play button to launch

### Verify Emulator

```bash
# List connected devices
adb devices

# Expected output:
# emulator-5554    device

# Get emulator info
adb shell getprop ro.build.version.release
adb shell getprop ro.build.version.sdk
```

### Install App on Emulator

```bash
# Build debug APK
./scripts/build-android-debug.sh

# Install on emulator
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Launch app
adb shell am start -n com.propertyark.app/.MainActivity

# View logs
adb logcat
```

### Emulator Troubleshooting

#### Emulator Won't Start

```bash
# Check if emulator process is running
ps aux | grep emulator

# Kill existing emulator
pkill -f emulator

# Restart emulator
emulator -avd PropertyArk
```

#### Emulator Too Slow

```bash
# Enable GPU acceleration
emulator -avd PropertyArk -gpu on

# Increase RAM allocation
# Edit ~/.android/avd/PropertyArk/config.ini
# hw.ramSize=8192

# Use x86_64 system image (faster than ARM)
```

#### Emulator Crashes

```bash
# Clear emulator data
emulator -avd PropertyArk -wipe-data

# Or delete and recreate
rm -rf ~/.android/avd/PropertyArk
avdmanager create avd -n PropertyArk -k "system-images;android-34;google_apis;x86_64" -d "Pixel 6"
```

## iOS Simulator

### Prerequisites

- macOS 12.0 or higher
- Xcode 15.0 or higher
- iOS SDK 14.0 or higher
- 5GB disk space minimum

### List Available Simulators

```bash
# List all simulators
xcrun simctl list devices

# Example output:
# iPhone 15 (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX) (Shutdown)
# iPhone 15 Pro (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX) (Shutdown)
# iPad Pro 12.9-inch (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX) (Shutdown)
```

### Create Simulator

```bash
# Create simulator for iPhone 15 with iOS 17
xcrun simctl create "PropertyArk iPhone 15" \
  com.apple.CoreSimulator.SimDeviceType.iPhone-15 \
  com.apple.CoreSimulator.SimRuntime.iOS-17-0

# Verify creation
xcrun simctl list devices | grep PropertyArk
```

### Launch Simulator

#### Command Line

```bash
# Get simulator ID
SIMULATOR_ID=$(xcrun simctl list devices | grep "PropertyArk iPhone 15" | grep -oE '\([A-F0-9-]+\)' | tr -d '()')

# Boot simulator
xcrun simctl boot $SIMULATOR_ID

# Open simulator window
open /Applications/Simulator.app
```

#### Xcode

1. Xcode → Window → Devices and Simulators
2. Select simulator
3. Click play button to launch

### Verify Simulator

```bash
# List booted simulators
xcrun simctl list devices | grep Booted

# Get simulator info
xcrun simctl info <simulator-id>
```

### Install App on Simulator

```bash
# Build debug app
./scripts/build-ios-debug.sh

# Get simulator ID
SIMULATOR_ID=$(xcrun simctl list devices | grep "PropertyArk iPhone 15" | grep -oE '\([A-F0-9-]+\)' | tr -d '()')

# Boot simulator if not running
xcrun simctl boot $SIMULATOR_ID

# Install app
xcrun simctl install $SIMULATOR_ID ios/App/build/Debug-iphonesimulator/App.app

# Launch app
xcrun simctl launch $SIMULATOR_ID com.propertyark.app

# View logs
xcrun simctl spawn $SIMULATOR_ID log stream --predicate 'process == "PropertyArk"'
```

### Simulator Troubleshooting

#### Simulator Won't Boot

```bash
# Erase simulator
xcrun simctl erase <simulator-id>

# Or erase all simulators
xcrun simctl erase all

# Restart simulator
xcrun simctl boot <simulator-id>
```

#### Simulator Too Slow

```bash
# Close other applications to free resources
# Increase Mac RAM allocation

# Use faster simulator (iPhone 15 is faster than older models)
```

#### Simulator Crashes

```bash
# Kill simulator process
pkill -f "iPhone Simulator"

# Restart Xcode
killall Xcode
open /Applications/Xcode.app

# Reboot simulator
xcrun simctl shutdown all
xcrun simctl boot <simulator-id>
```

## Device Connectivity

### Network Connectivity

#### Android Emulator

```bash
# Test network connectivity
adb shell ping google.com

# Check network settings
adb shell settings get global airplane_mode_on

# Enable network
adb shell settings put global airplane_mode_on 0
```

#### iOS Simulator

```bash
# Simulators automatically have network access
# Test by opening Safari and visiting a website

# Check network settings
xcrun simctl spawn <simulator-id> networksetup -getinfo Wi-Fi
```

### API Testing

#### Android Emulator

```bash
# Test API connectivity
adb shell curl http://localhost:5001/api/health

# Or use app to test API
# Open app and check network requests in logs
```

#### iOS Simulator

```bash
# Test API connectivity
xcrun simctl spawn <simulator-id> curl http://localhost:5001/api/health

# Or use app to test API
# Open app and check network requests in logs
```

## Hot Reload

### Android Hot Reload

```bash
# Enable hot reload in development
# App automatically reloads when code changes

# Manual reload
adb shell input keyevent 82  # Menu key
# Select "Reload"

# Or use React Native CLI
npx react-native run-android
```

### iOS Hot Reload

```bash
# Enable hot reload in development
# App automatically reloads when code changes

# Manual reload
# Cmd + R in simulator

# Or use React Native CLI
npx react-native run-ios
```

## Debugging

### Android Debugging

#### View Logs

```bash
# View all logs
adb logcat

# Filter logs by app
adb logcat | grep PropertyArk

# Save logs to file
adb logcat > logs.txt
```

#### Debug App

```bash
# Connect debugger
adb forward tcp:8081 tcp:8081

# Open Chrome DevTools
# chrome://inspect

# Or use React Native Debugger
npm install -g react-native-debugger
react-native-debugger
```

### iOS Debugging

#### View Logs

```bash
# View simulator logs
log stream --predicate 'process == "PropertyArk"'

# Or use Xcode console
# Xcode → View → Debug Area → Show Console
```

#### Debug App

```bash
# Connect debugger in Xcode
# Xcode → Debug → Attach to Process → PropertyArk

# Or use React Native Debugger
npm install -g react-native-debugger
react-native-debugger
```

## Performance Testing

### Android Performance

```bash
# Monitor CPU usage
adb shell top -n 1

# Monitor memory usage
adb shell dumpsys meminfo com.propertyark.app

# Monitor frame rate
adb shell dumpsys gfxinfo com.propertyark.app
```

### iOS Performance

```bash
# Monitor CPU usage
xcrun simctl spawn <simulator-id> top -n 1

# Monitor memory usage
xcrun simctl spawn <simulator-id> vm_stat

# Use Xcode Instruments
# Xcode → Product → Profile
```

## Device Profiles

### Android Device Profiles

Available device profiles:
- Pixel 6 (6.3" FHD+)
- Pixel 6 Pro (6.7" QHD+)
- Pixel 7 (6.1" FHD+)
- Pixel 7 Pro (6.7" QHD+)
- Pixel Tablet (11.5" OLED)

### iOS Device Profiles

Available device profiles:
- iPhone 15 (6.1" Super Retina XDR)
- iPhone 15 Plus (6.7" Super Retina XDR)
- iPhone 15 Pro (6.1" Super Retina XDR)
- iPhone 15 Pro Max (6.7" Super Retina XDR)
- iPad Pro 12.9-inch (12.9" Liquid Retina XDR)

## Multiple Devices

### Run on Multiple Android Emulators

```bash
# Create multiple emulators
avdmanager create avd -n PropertyArk-1 -k "system-images;android-34;google_apis;x86_64" -d "Pixel 6"
avdmanager create avd -n PropertyArk-2 -k "system-images;android-34;google_apis;x86_64" -d "Pixel 7"

# Launch both
emulator -avd PropertyArk-1 &
emulator -avd PropertyArk-2 &

# List devices
adb devices

# Install on specific device
adb -s emulator-5554 install app-debug.apk
adb -s emulator-5556 install app-debug.apk
```

### Run on Multiple iOS Simulators

```bash
# Create multiple simulators
xcrun simctl create "PropertyArk iPhone 15" com.apple.CoreSimulator.SimDeviceType.iPhone-15 com.apple.CoreSimulator.SimRuntime.iOS-17-0
xcrun simctl create "PropertyArk iPhone 15 Pro" com.apple.CoreSimulator.SimDeviceType.iPhone-15-pro com.apple.CoreSimulator.SimRuntime.iOS-17-0

# Boot both
xcrun simctl boot <id-1>
xcrun simctl boot <id-2>

# Install on specific simulator
xcrun simctl install <id-1> ios/App/build/Debug-iphonesimulator/App.app
xcrun simctl install <id-2> ios/App/build/Debug-iphonesimulator/App.app
```

## Best Practices

### Emulator/Simulator Usage

1. **Use appropriate device profile** for your target audience
2. **Test on multiple screen sizes** (phone, tablet)
3. **Test on multiple OS versions** (API 34, iOS 17)
4. **Monitor performance** during testing
5. **Clear app data** between test runs
6. **Use hot reload** for rapid development

### Performance Optimization

1. **Enable GPU acceleration** for faster rendering
2. **Allocate sufficient RAM** to emulator/simulator
3. **Close unnecessary applications** on development machine
4. **Use SSD** for faster file access
5. **Monitor logs** for performance issues

## Next Steps

1. **Create emulator/simulator**: Follow steps above
2. **Build app**: Run `./scripts/build-android-debug.sh` or `./scripts/build-ios-debug.sh`
3. **Install on device**: Follow installation steps above
4. **Test app**: Open app and verify functionality
5. **Debug issues**: See [Troubleshooting Guide](./TROUBLESHOOTING.md)

## External Resources

- [Android Emulator Documentation](https://developer.android.com/studio/run/emulator)
- [iOS Simulator Documentation](https://developer.apple.com/documentation/xcode/running-your-app-in-the-simulator-or-on-a-device)
- [Capacitor Device Testing](https://capacitorjs.com/docs/basics/running-your-app)

---

**Ready to test?** Create an emulator or simulator and run `./scripts/build-android-debug.sh` or `./scripts/build-ios-debug.sh`.
