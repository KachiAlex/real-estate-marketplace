# Build Troubleshooting Guide

## Issue: EAS CLI Module Not Found Error

**Error Message:**
```
ModuleLoadError: [MODULE_NOT_FOUND] require failed to load
Cannot find module '@expo/package-manager'
```

**Root Cause:**
- EAS CLI is looking in the root `node_modules` instead of the mobile directory
- Dependency resolution conflict between root and mobile package.json

## Solutions

### Solution 1: Use Expo Prebuild (Recommended)
```bash
cd mobile
npm install --legacy-peer-deps
npx expo prebuild --clean
npx expo build:android --local
```

### Solution 2: Clear Cache and Reinstall
```bash
cd mobile
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --legacy-peer-deps
npm run build:android
```

### Solution 3: Use Expo CLI Directly
```bash
cd mobile
npx expo build:android --local
```

### Solution 4: Docker Build (Recommended for CI/CD)
```bash
docker build -t propertyark-mobile .
docker run -v $(pwd)/output:/app/output propertyark-mobile
```

## Alternative: Local Gradle Build

If EAS continues to have issues, build locally:

```bash
# Set environment variables
$env:GRADLE_OPTS = "-Xmx4g -XX:MaxPermSize=512m"
$env:ANDROID_HOME = "C:\Users\[username]\AppData\Local\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-11"

# Run Expo prebuild
npx expo prebuild --clean

# Build APK
cd android
./gradlew assembleRelease
cd ..

# APK will be at: android/app/build/outputs/apk/release/app-release.apk
```

## Prevention

### For Future Builds
1. Always use `--legacy-peer-deps` flag
2. Keep EAS CLI updated: `npm install -g eas-cli@latest`
3. Clear cache before builds: `npm cache clean --force`
4. Use Docker for consistent builds

### Environment Setup
```bash
# Verify prerequisites
node --version    # Should be 16+
npm --version     # Should be 8+
java -version     # Should be 11+

# Set paths
$env:ANDROID_HOME = "C:\Users\[username]\AppData\Local\Android\Sdk"
$env:JAVA_HOME = "C:\Program Files\Java\jdk-11"
$env:GRADLE_OPTS = "-Xmx4g -XX:MaxPermSize=512m"
```

## Recommended Build Path

Given the current issues, use this approach:

### Step 1: Prepare Environment
```bash
cd mobile
npm install --legacy-peer-deps
```

### Step 2: Prebuild for Android
```bash
npx expo prebuild --clean
```

### Step 3: Build APK Locally
```bash
cd android
./gradlew assembleRelease
cd ..
```

### Step 4: Verify APK
```bash
ls -la android/app/build/outputs/apk/release/app-release.apk
```

## Docker Alternative

Create a Dockerfile for consistent builds:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install Java and Android SDK
RUN apk add --no-cache openjdk11 android-sdk

# Copy project
COPY . .

# Install dependencies
RUN npm install --legacy-peer-deps

# Prebuild
RUN npx expo prebuild --clean

# Build APK
WORKDIR /app/android
RUN ./gradlew assembleRelease

# Output
RUN cp app/build/outputs/apk/release/app-release.apk /output/
```

Build with Docker:
```bash
docker build -t propertyark-mobile .
docker run -v $(pwd)/output:/output propertyark-mobile
```

## Support

If issues persist:
1. Check Node.js and npm versions
2. Verify Android SDK installation
3. Clear all caches
4. Try Docker build
5. Contact Expo support

---

**Status:** Troubleshooting guide created
**Recommended Action:** Use local Gradle build or Docker approach
