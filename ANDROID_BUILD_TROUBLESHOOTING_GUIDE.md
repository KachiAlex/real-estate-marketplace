# Android APK Build Troubleshooting Guide

**Project:** PropertyArk Mobile App  
**Date:** March 22, 2026  
**Status:** BUILD ENVIRONMENT ISSUES DETECTED

## Summary

The Android APK build for the PropertyArk mobile app (package: `com.propertyark.app`) has encountered infrastructure challenges preventing successful local compilation. Multiple build approaches have been attempted, each revealing specific environmental constraints.

## Build Environment Configuration

### Installed Components ✓
- **Node.js:** v20.20.0 ✓
- **Java:** Available and configured ✓
- **Android SDK:** API 36 (compileSdk), API 24 (minSdk), API 36 (targetSdk) ✓
- **Gradle:** 8.14.3 ✓
- **NDK:** 27.1.12297006 ✓
- **Kotlin:** 2.1.20 ✓
- **Build Tools:** 36.0.0 ✓

### npm Packages

**Status:** 474 packages installed in `node_modules`

**Critical Dependencies Present:**
- ✓ react-native (0.81.5)
- ✓ @react-native/codegen
- ✓ expo (~54.0.20)
- ✓ firebase (11.0.0)
- ✓ expo-location (18.0.5)
- ✓ expo-notifications (0.28.16)
- ✓ react-navigation (native-stack, bottom-tabs)

**Missing/Problematic Dependencies:**
- ✗ @expo/config-plugins (required by expo-location)
- ✗ @expo/config (missing indirect dependency)

## Attempted Build Approaches

### Approach 1: Local npm + Gradle Debug Build
**Command:** `cd android && .\gradlew.bat assembleDebug`

**Result:** ❌ FAILED

**Error:**
```
Build file 'D:\real-estate-marketplace\mobile-app\android\app\build.gradle' line 12
A problem occurred evaluating project ':app'.
> Cannot convert '' to File.
```

**Root Cause:** Line 12 of `build.gradle` executes:
```gradle
entryFile = file(["node", "-e", "require('expo/scripts/resolveAppEntry')"].execute(...).text.trim())
```

This Node command returns an empty string because the expo scripts can't resolve dependencies. The Gradle configuration expects the Node command to output a file path, but gets empty string instead.

**Details:**
- npm install completes (474 packages)
- Node can resolve some packages (react-native, codegen)
- But expo scripts can't resolve their own dependencies
- Result: Gradle fails during configuration phase

### Approach 2: Local npm + Gradle Release Build
**Command:** `cd android && .\gradlew.bat assembleRelease`

**Result:** ❌ FAILED

**Errors:**
- CMake configuration failures for native modules:
  - `expo-modules-core:configureCMakeRelWithDebInfo[arm64-v8a]`
  - `react-native-gesture-handler:configureCMakeRelWithDebInfo[arm64-v8a]`
  - `react-native-screens:configureCMakeRelWithDebInfo[arm64-v8a]`

**Note:** These are secondary issues - build never reaches this point due to configuration error above.

### Approach 3: EAS Cloud Build (Expo Application Services)
**Commands Attempted:**
1. `npx eas build --platform android --profile preview`
2. `npm install -g eas-cli` → `eas build -p android --profile preview`

**Result:** ❌ FAILED

**Error:**
```
Failed to read the app config from the project using "npx expo config" command
Falling back to the version of "@expo/config" shipped with the EAS CLI.
Cannot find module '@expo/config-plugins'
Require stack:
  - D:\real-estate-marketplace\mobile-app\node_modules\expo\config-plugins.js        
  - D:\real-estate-marketplace\mobile-app\node_modules\expo-location\plugin\build\withLocation.js
  - ...
Error: build command failed.
```

**Root Cause:** Same as Approach 1 - the local `node_modules` installation is incomplete. EAS CLI tries to use the local project config, fails, and can't fall back properly.

## Root Cause Analysis

### Problem 1: Incomplete Transitive Dependencies
The `npm install` command completes (474 packages), but **transitive dependencies** of expo plugins are not being installed correctly:

```
expo-location (v18.0.5)
  └─ requires @expo/config-plugins
     └─ requires @expo/config
        └─ requires ... (chain broken)
```

**Why:** 
- expo-location's `app.plugin.js` imports `@expo/config-plugins`
- This package is not in package.json (not a direct dependency)
- It should come from expo's peer dependencies
- npm is not resolving it automatically

### Problem 2: npm Dependency Resolution
**Suspected Issues:**
1. Peer dependency peer version conflicts between expo (v54) and plugins
2. Possible npm cache corruption (tried `npm cache clean --force` - didn't fully resolve)
3. Node modules may have partial installation from interrupted builds
4. package-lock.json lock constraints preventing resolution

### Problem 3: Gradle Configuration Expectations
The `android/app/build.gradle` file is designed for **development workflow**:
- It executes Node commands at **build configuration time**
- These commands must succeed and return valid paths
- It requires expo CLI to be accessible via Node resolution
- No fallback if these commands fail

## Potential Solutions (Ordered by Recommendation)

### Solution 1: Remove expo-location Dependency (Quickest)
**If location services are not critical:**
```bash
cd mobile-app
npm uninstall expo-location
```

Update `app.json` to remove location plugin configuration.

**Pros:** Eliminates the dependency chain causing the error
**Cons:** Loses location functionality in the app
**Time:** 5 minutes

---

### Solution 2: Use Prebuild with Expo CLI
**Expo has a prebuild system that generates native Android code locally:**
```bash
cd mobile-app
npm install @expo/cli
npx expo prebuild --clean
cd android
./gradlew.bat assembleDebug
```

**How it works:**
1. `expo prebuild` generates Android native code from the Expo config
2. Produces a standard Android project
3. Gradle can build from there without needing dynamic Node resolution

**Pros:** Standard approach for Expo projects
**Cons:** Requires Expo CLI, adds prebuild artifacts to git
**Time:** 10-15 minutes

---

### Solution 3: Fix build.gradle Configuration
**Manually specify paths instead of dynamic resolution:**

Edit `android/app/build.gradle` line 12-20:

From:
```gradle
entryFile = file(["node", "-e", "require('expo/scripts/resolveAppEntry')"].execute(...).text.trim())
reactNativeDir = new File(["node", "--print", "require.resolve('react-native/package.json')"].execute(...).text.trim()).getParentFile()
```

To:
```gradle
entryFile = file("${rootDir.parentFile.absolutePath}/index.js")
reactNativeDir = new File("${rootDir.parentFile.absolutePath}/node_modules/react-native")
```

**Pros:** Avoids Node execution during build
**Cons:** Less flexible, hardcodes paths
**Time:** 3-5 minutes

---

### Solution 4: Use Docker Build Container (Most Reliable)
**Build inside a container with all dependencies pre-configured:**
```bash
docker build -f Dockerfile.android -t propertyark-android .
docker run -v $(pwd)/build:/app/build propertyark-android
```

**Pros:** Reproducible, isolated environment, no local conflicts
**Cons:** Requires Docker setup
**Time:** 20 minutes first time, then 5 minutes for rebuilds

---

### Solution 5: Fresh Environment Setup
**Complete cleanup and reinstall:**
```bash
# Kill all Java/npm processes
taskkill /F /IM java.exe /IM node.exe /IM npm.exe

# Clean all caches
rm -r node_modules
rm package-lock.json
npm cache clean --force

# Ensure npm is up to date
npm install -g npm@latest

# Fresh install with diagnostic output
npm install --verbose 2>&1 | tee npm-install.log

# Check for missing packages
npm ls --all > npm-tree.log
```

Then run build:
```bash
cd android
./gradlew.bat assembleDebug --info 2>&1 | tee gradle-build.log
```

**Pros:** Eliminates cached/partial installation issues
**Cons:** Time-consuming, may not work if underlying issue persists
**Time:** 30-45 minutes

---

## Recommendation

**Immediate Next Step: Try Prebuild Solution (Solution 2)**

1. **Install Expo CLI locally:**
   ```bash
   cd mobile-app
   npm install @expo/cli --save-dev
   ```

2. **Generate native Android code:**
   ```bash
   npx expo prebuild --clean
   ```

3. **Build with Gradle:**
   ```bash
   cd android
   ./gradlew.bat assembleDebug --no-daemon
   ```

**Why this approach:**
- ✓ Follows Expo's recommended workflow
- ✓ Generates android/ folder from app.json config
- ✓ Produces standard Gradle project (no Node execution during build)
- ✓ Avoids complex dependency resolution issues
- ✓ Generates reproducible builds
- ✓ Successfully used by Expo community

**Expected Time:** 15-20 minutes for first build
**Success Indicator:** APK file appears at `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Backup Plan: Cloud Build (Solution 0)

If prebuild fails, Expo provides **free cloud builds** via EAS:

```bash
npm install -g eas-cli
eas login  # Create free account if needed
npx eas build --platform android --profile preview
```

**Advantages:**
- ✓ No local environment issues
- ✓ Expo-managed build infrastructure  
- ✓ More reliable for CI/CD
- ✓ Web-based progress monitoring
- ✓ Downloads APK directly

---

## Diagnostics Commands for Troubleshooting

Check what packages are installed vs. expected:
```bash
# List all packages
npm ls --all > npm-packages.txt

# Check if specific package is installed
npm ls @ex po/config-plugins
npm ls expo-location

# List direct dependencies
npm ls --depth=0

# Check npm config issues
npm config list
npm cache verify
```

Check Gradle environment:
```bash
# Check Gradle paths
./gradlew properties | grep -E "projectDir|buildDir|sourceDir"

# Run with verbose logging
./gradlew assembleDebug --info --stacktrace > gradle-verbose.log

# Check for Java version issues
java -version
```

---

## Next Actions

1. **Choose Solution 2 (Prebuild) or Solution 0 (Cloud Build)**
2. **Run the recommended build command**
3. **Monitor output for errors**
4. **If successful:** APK will be ready at specified location
5. **If failed:** Reference error against this guide's solutions

---

## Environment Details for Future Reference

- **OS:** Windows 10/11
- **BuildTools:** 36.0.0
- **compileSdk:** 36
- **minSdk:** 24
- **targetSdk:** 36
- **Expo:** 54.0.20
- **React Native:** 0.81.5
- **Gradle:** 8.14.3
- **NDK:** 27.1.12297006
- **Project ID:** b5224cae-91af-43fc-9612-9f245f4803ad (in eas.json)

---

**Document Updated:** March 22, 2026, 2:35 AM  
**Status:** RECOMMENDED NEXT STEP - Try Prebuild + Gradle Build Approach
