# Quick Build Reference

## Build Commands

### Full Build Pipeline
```bash
# 1. Build React web app
npm run build

# 2. Sync with Capacitor
npx cap sync android

# 3. Build Android APK
cd android
./gradlew assembleDebug
cd ..
```

### Quick Rebuild (after code changes)
```bash
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug && cd ..
```

### Clean Build
```bash
# Clear all build artifacts
npm run build
npx cap sync android
cd android
./gradlew clean assembleDebug
cd ..
```

## APK Installation & Testing

### Install APK
```bash
# Development variant
adb install android/app/build/outputs/apk/development/debug/app-development-debug.apk

# Production variant
adb install android/app/build/outputs/apk/production/debug/app-production-debug.apk

# Staging variant
adb install android/app/build/outputs/apk/staging/debug/app-staging-debug.apk
```

### Launch App
```bash
# Development
adb shell am start -n com.realestate.marketplace.dev/.MainActivity

# Production
adb shell am start -n com.realestate.marketplace/.MainActivity

# Staging
adb shell am start -n com.realestate.marketplace.staging/.MainActivity
```

### View Logs
```bash
# All logs
adb logcat

# PropertyArk app logs only
adb logcat | grep -i propertyark

# JavaScript errors
adb logcat | grep -i "javascript\|error\|exception"

# Clear logs
adb logcat -c
```

### Uninstall App
```bash
# Development
adb uninstall com.realestate.marketplace.dev

# Production
adb uninstall com.realestate.marketplace

# Staging
adb uninstall com.realestate.marketplace.staging
```

## Build Variants

### Development
- App ID: `com.realestate.marketplace.dev`
- APK: `app-development-debug.apk`
- Use for: Testing and debugging

### Staging
- App ID: `com.realestate.marketplace.staging`
- APK: `app-staging-debug.apk`
- Use for: Pre-production testing

### Production
- App ID: `com.realestate.marketplace`
- APK: `app-production-debug.apk`
- Use for: Production deployment

## Troubleshooting

### Build Fails
```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleDebug
cd ..
```

### Dependency Issues
```bash
# Update Gradle wrapper
./gradlew wrapper --gradle-version 8.14.3

# Clear Gradle cache
rm -rf ~/.gradle/caches
```

### App Crashes
```bash
# Check logs
adb logcat | grep -i propertyark

# Clear app data
adb shell pm clear com.realestate.marketplace.dev

# Reinstall
adb uninstall com.realestate.marketplace.dev
adb install android/app/build/outputs/apk/development/debug/app-development-debug.apk
```

## File Locations

### Build Outputs
```
android/app/build/outputs/apk/
├── debug/app-debug.apk
├── development/debug/app-development-debug.apk
├── production/debug/app-production-debug.apk
└── staging/debug/app-staging-debug.apk
```

### Web Assets
```
android/app/src/main/assets/public/
├── index.html
├── manifest.json
├── static/
│   ├── css/
│   └── js/
└── ...
```

### Configuration
```
capacitor.config.ts          # Capacitor configuration
capacitor.config.json        # Generated config (in Android assets)
android/app/build.gradle     # Android build configuration
android/build.gradle         # Root build configuration
```

## Environment Setup

### Required Tools
- Node.js 16+ (check: `node --version`)
- npm 8+ (check: `npm --version`)
- Java 11+ (check: `java -version`)
- Android SDK (check: `adb --version`)
- Gradle 8.14.3 (included in project)

### Android Device Setup
```bash
# Enable USB debugging on device
# Settings > Developer Options > USB Debugging

# Connect device
adb devices

# Verify connection
adb shell getprop ro.build.version.release
```

## Performance Tips

### Faster Builds
1. Use incremental builds (don't clean every time)
2. Build only needed variant: `./gradlew assembleDebugDevelopment`
3. Skip tests: `./gradlew assembleDebug -x test`
4. Use build cache: `./gradlew build --build-cache`

### Faster Development
1. Use hot reload for React: `npm start`
2. Use Chrome DevTools for debugging
3. Keep emulator running between builds
4. Use `--offline` flag if dependencies cached

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Build fails with dependency error | Run `./gradlew clean` then rebuild |
| App crashes on startup | Check `adb logcat` for errors |
| APK not installing | Uninstall old version first: `adb uninstall com.realestate.marketplace.dev` |
| Emulator not responding | Restart emulator: `adb emu kill` |
| Gradle daemon issues | Kill daemon: `./gradlew --stop` |

## Documentation

- `BUILD_STATUS_REPORT.md` - Current build status
- `APK_BUILD_FIX_SUMMARY.md` - What was fixed
- `GRADLE_BUILD_RESOLUTION.md` - How it was fixed
- `APP_CRASH_DIAGNOSTIC_GUIDE.md` - Troubleshooting guide
- `QUICK_BUILD_REFERENCE.md` - This file

## Quick Status Check

```bash
# Verify build system
./gradlew --version

# Check Android SDK
adb --version

# List connected devices
adb devices

# Check app installation
adb shell pm list packages | grep propertyark
```

---

**Last Updated**: May 9, 2026
**Build System**: Gradle 8.14.3
**Status**: ✅ OPERATIONAL
