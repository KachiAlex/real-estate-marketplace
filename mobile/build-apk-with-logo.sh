#!/bin/bash

echo "Building PropertyArk APK with Custom Logo"
echo "========================================"

# Set environment variables
export NODE_ENV=production
export EXPO_USE_DEV_CLIENT=0

# Verify assets exist
echo "Checking assets..."
if [ ! -f "assets/images/icon.png" ]; then
    echo "Error: icon.png not found in assets/images/"
    exit 1
fi

if [ ! -f "assets/images/android-icon-foreground.png" ]; then
    echo "Error: android-icon-foreground.png not found in assets/images/"
    exit 1
fi

if [ ! -f "assets/images/favicon.png" ]; then
    echo "Error: favicon.png not found in assets/images/"
    exit 1
fi

echo "All required assets found!"

# Clean previous builds
echo "Cleaning previous builds..."
rm -rf android/build
rm -rf node_modules/.cache

# Prebuild the project
echo "Prebuilding project..."
npx expo prebuild --platform android --clean

# Build APK using Gradle
echo "Building APK..."
cd android
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo "Build successful!"
    echo "APK location: android/app/build/outputs/apk/release/app-release.apk"
    
    # Copy APK to a more accessible location
    cp app/build/outputs/apk/release/app-release.apk ../PropertyArk-$(date +%Y%m%d).apk
    
    echo "APK copied to: PropertyArk-$(date +%Y%m%d).apk"
    echo ""
    echo "APK Features:"
    echo "- Custom app icon: assets/images/icon.png"
    echo "- Android adaptive icon: assets/images/android-icon-foreground.png" 
    echo "- Web favicon: assets/images/favicon.png"
    echo "- Splash screen: assets/images/splash-icon.png (3 seconds)"
    echo ""
    echo "Install with: adb install PropertyArk-$(date +%Y%m%d).apk"
else
    echo "Build failed!"
    exit 1
fi
