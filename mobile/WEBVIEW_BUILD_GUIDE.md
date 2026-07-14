# PropertyArk Mobile - React Native WebView Build Guide

## Overview

This is a React Native + Expo application that wraps the PropertyArk web app in a native mobile shell. The app loads the live web app from `https://real-estate-marketplace-delta.vercel.app` and provides native features like:

- Splash screen with PropertyArk logo
- Offline detection ("No Internet" screen)
- Pull-to-refresh functionality
- Android back button navigation
- Error fallback screen
- Loading indicator

## Architecture

```
┌─────────────────────────────────┐
│   React Native (Expo)           │
│  ┌───────────────────────────┐  │
│  │   WebView Component       │  │
│  │  (loads live web app)     │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │  Native Features          │  │
│  │  - Splash Screen          │  │
│  │  - Offline Detection      │  │
│  │  - Pull-to-Refresh        │  │
│  │  - Back Button Handler    │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
         ↓
    Loads from
         ↓
┌─────────────────────────────────┐
│  Your Live Web App              │
│  https://real-estate-marketplace-delta.vercel.app
└─────────────────────────────────┘
```

## Prerequisites

### System Requirements
- Node.js 16+ and npm/yarn
- Android SDK (API level 34+) for Android builds
- Xcode 15+ for iOS builds (macOS only)
- Expo CLI: `npm install -g expo-cli`

### Environment Setup

1. **Install Node.js dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Verify Expo is installed:**
   ```bash
   expo --version
   ```

## Building the APK

### Option 1: Local Build (Recommended for Testing)

```bash
cd mobile
npm install
eas build --platform android --local
```

**Requirements:**
- Android SDK installed and configured
- ANDROID_HOME environment variable set
- Gradle installed

**Output:** APK file in `dist/` directory

### Option 2: EAS Cloud Build (Recommended for Production)

```bash
cd mobile
npm install
eas login  # First time only
eas build --platform android
```

**Advantages:**
- No local Android SDK required
- Faster builds
- Automatic signing
- Build history tracking

**Output:** APK file available for download from EAS dashboard

### Option 3: Development Build

```bash
cd mobile
npm install
expo start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on physical device

## Installation

### On Android Device

1. **From APK file:**
   ```bash
   adb install dist/propertyark-mobile.apk
   ```

2. **From Play Store:**
   - Upload AAB to Google Play Console
   - Follow Play Store submission process

### On Android Emulator

```bash
adb install dist/propertyark-mobile.apk
```

## Configuration

### Web App URL

To change the web app URL, edit `mobile/App.js`:

```javascript
const WEB_APP_URL = 'https://your-app-url.com';
```

### App Metadata

Edit `mobile/app.json`:
- `name`: App display name
- `slug`: URL slug for Expo
- `version`: App version
- `android.package`: Android package name
- `android.versionCode`: Android version code

### Permissions

Android permissions are configured in `mobile/app.json`:
```json
"permissions": [
  "android.permission.INTERNET",
  "android.permission.ACCESS_NETWORK_STATE"
]
```

## Features

### 1. Splash Screen
- Shows PropertyArk logo for 2 seconds
- Displays while web app loads
- Customizable with `assets/splash.png`

### 2. Offline Detection
- Monitors network connectivity
- Shows "No Internet Connection" screen when offline
- Automatically reconnects when online

### 3. Pull-to-Refresh
- Swipe down to refresh the web app
- Enabled by default in WebView

### 4. Back Button Navigation
- Android back button navigates through WebView history
- Returns to previous page instead of closing app

### 5. Error Handling
- Displays error screen if page fails to load
- Shows error message and recovery instructions
- Allows user to restart app

### 6. Loading Indicator
- Shows spinner while page loads
- Displays "Loading PropertyArk..." text
- Automatically hides when page loads

## Troubleshooting

### Build Fails with "Android SDK not found"
```bash
# Set ANDROID_HOME environment variable
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

### APK Installation Fails
```bash
# Clear existing app
adb uninstall com.propertyark.mobile

# Install APK
adb install dist/propertyark-mobile.apk
```

### App Crashes on Startup
1. Check web app URL is correct in `App.js`
2. Verify web app is accessible from device
3. Check device has internet connection
4. Review logcat: `adb logcat | grep propertyark`

### WebView Shows Blank Screen
1. Verify web app URL is accessible
2. Check device network connectivity
3. Clear app cache: `adb shell pm clear com.propertyark.mobile`
4. Restart app

### Offline Screen Shows Incorrectly
1. Check device network connectivity
2. Verify NetInfo library is working
3. Check Android permissions are granted

## Development

### Hot Reload
```bash
expo start
# Press 'a' for Android
# Changes auto-reload on save
```

### Debugging
```bash
# View device logs
adb logcat | grep propertyark

# Open React Native debugger
expo start
# Press 'd' in terminal
```

### Testing on Physical Device
```bash
# Install Expo Go app from Play Store
expo start
# Scan QR code with Expo Go
```

## File Structure

```
mobile/
├── App.js                 # Main WebView component
├── index.js              # Expo entry point
├── app.json              # Expo configuration
├── eas.json              # EAS build configuration
├── package.json          # Dependencies
├── babel.config.js       # Babel configuration
├── assets/
│   ├── icon.png          # App icon
│   ├── splash.png        # Splash screen
│   ├── adaptive-icon.png # Android adaptive icon
│   └── favicon.png       # Web favicon
└── WEBVIEW_BUILD_GUIDE.md # This file
```

## Next Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build APK:**
   ```bash
   eas build --platform android --local
   ```

3. **Install on device:**
   ```bash
   adb install dist/propertyark-mobile.apk
   ```

4. **Test on device:**
   - Open PropertyArk app
   - Verify web app loads
   - Test offline mode
   - Test pull-to-refresh
   - Test back button

5. **Publish to Play Store:**
   - Build AAB: `eas build --platform android`
   - Upload to Google Play Console
   - Follow Play Store submission process

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review Expo documentation: https://docs.expo.dev
3. Check React Native WebView docs: https://github.com/react-native-webview/react-native-webview
4. Review Android documentation: https://developer.android.com

## License

Same as PropertyArk main application.
