# Android Build Guide for Property Ark Mobile App

This guide provides step-by-step instructions for building and deploying the Android version of the Property Ark mobile app.

## Prerequisites

1. **Node.js** (v14 or higher)
2. **Expo CLI**
3. **Android Studio** (for Android development)
4. **EAS CLI** (recommended for production builds)
5. **Firebase Account** (already configured)

## Quick Start

### 1. Navigate to Mobile App Directory

```bash
cd mobile-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

The Firebase configuration is already set up in `src/config/firebase.js`. Make sure your Firebase project is properly configured.

### 4. Start Development Server

```bash
npm start
```

This will:
- Start the Metro bundler
- Open Expo DevTools in your browser
- Display a QR code for testing with Expo Go app

## Testing the App

### Option 1: Expo Go (Quick Testing)

1. Install the **Expo Go** app from Google Play Store on your Android device
2. Scan the QR code displayed in your terminal or Expo DevTools
3. The app will load on your device

### Option 2: Android Emulator

1. Start Android Studio
2. Open the AVD Manager
3. Create or start an Android emulator (API 30+ recommended)
4. Run:
   ```bash
   npm run android
   ```

### Option 3: Physical Device

1. Enable Developer Options on your Android device
2. Enable USB Debugging
3. Connect your device via USB
4. Run:
   ```bash
   npm run android
   ```

## Building for Production

### Method 1: EAS Build (Recommended)

EAS (Expo Application Services) is the recommended way to build production apps.

#### Install EAS CLI

```bash
npm install -g eas-cli
```

#### Login to Expo

```bash
eas login
```

#### Configure EAS

```bash
eas build:configure
```

#### Build Android APK

```bash
# Build APK for testing
eas build -p android --profile preview

# Build production APK
eas build -p android --profile production
```

#### Build Android App Bundle (AAB)

```bash
# Build production app bundle for Play Store
eas build -p android --profile production
```

#### Download and Install

After the build completes:
1. Visit the Expo dashboard
2. Download the build file
3. For APK: Transfer to device and install
4. For AAB: Upload to Google Play Console

### Method 2: Local Build with Expo

#### Prerequisites

- Android Studio installed
- Android SDK configured
- JAVA_HOME environment variable set

#### Build APK Locally

```bash
# Generate Android native project
npx expo prebuild -p android

# Build the APK
cd android
./gradlew assembleRelease

# The APK will be in: android/app/build/outputs/apk/release/
```

## Google Play Store Submission

### 1. Prepare App Assets

Create the following assets:
- App icon (1024x1024 PNG)
- Feature graphic (1024x500)
- Screenshots (at least 2, various sizes)
- Short description (80 characters)
- Full description (4000 characters)

### 2. Build App Bundle (AAB)

```bash
eas build -p android --profile production
```

### 3. Create Play Store Listing

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app
3. Fill in store listing details
4. Upload screenshots and graphics
5. Set pricing and distribution

### 4. Upload App Bundle

1. Go to Production in Play Console
2. Click "Create new release"
3. Upload the AAB file from EAS build
4. Add release notes
5. Review and roll out

### 5. App Review Process

- Typically takes 1-3 days
- Google will test your app
- You'll receive notification of approval or issues

## App Configuration

### App Identity

Located in `app.json`:

```json
{
  "expo": {
    "name": "Property Ark",
    "slug": "property-ark",
    "package": "com.propertyark.app",
    "version": "1.0.0"
  }
}
```

### Permissions

Current permissions in `app.json`:

```json
{
  "android": {
    "permissions": [
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "READ_EXTERNAL_STORAGE",
      "CAMERA"
    ]
  }
}
```

### Splash Screen & Icon

- Default icons are in `assets/` directory
- Replace with custom branding:
  - `icon.png` - App icon (1024x1024)
  - `adaptive-icon.png` - Android adaptive icon
  - `splash-icon.png` - Splash screen icon
  - `favicon.png` - Web favicon

## Troubleshooting

### Common Build Issues

#### 1. Java/JDK Errors

```bash
# Check Java version
java -version

# Should be Java 11 or 17
# Install from: https://www.oracle.com/java/technologies/downloads/
```

#### 2. Android SDK Not Found

```bash
# Set ANDROID_HOME
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

#### 3. Gradle Build Failed

```bash
# Clean and rebuild
cd android
./gradlew clean
./gradlew assembleRelease
```

#### 4. Firebase Not Working

Verify Firebase configuration:
1. Check `src/config/firebase.js`
2. Ensure correct API keys
3. Verify Firebase project settings

#### 5. Metro Bundler Issues

```bash
# Clear Metro cache
npx expo start -c

# Clear all caches
rm -rf node_modules
npm install
npx expo start -c
```

### Debugging Tips

1. **Enable Debugging**:
   - Shake device or press Ctrl+M on emulator
   - Select "Debug Remote JS"

2. **View Logs**:
   ```bash
   npx react-native log-android
   ```

3. **Check Firebase**:
   - Firebase console for auth issues
   - Network tab for API calls

## Performance Optimization

### Before Release

1. Enable ProGuard/R8 (automatic with production builds)
2. Optimize images (use WebP format)
3. Test on low-end devices
4. Profile memory usage
5. Test with slow networks

### Build Profiles

EAS supports multiple build profiles:

```bash
# Development build
eas build --profile development

# Preview build (internal testing)
eas build --profile preview

# Production build
eas build --profile production
```

## Continuous Integration

### GitHub Actions

Example workflow for automatic builds:

```yaml
name: Build Android
on:
  push:
    branches: [master]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm install
      - name: Build Android
        run: eas build -p android --profile production --non-interactive
```

## Security Considerations

1. **API Keys**: Never commit sensitive keys to version control
2. **ProGuard**: Enable code obfuscation
3. **HTTPS Only**: Ensure all network calls use HTTPS
4. **Certificate Pinning**: Consider implementing for production
5. **Firebase Rules**: Review and tighten security rules

## Update Process

### OTA Updates (Over-The-Air)

```bash
# Publish update
eas update --branch production --message "Bug fixes"

# Users get update without re-downloading app
```

### Native Updates

For changes requiring native code:
1. Update version in `app.json`
2. Build new version
3. Submit to Play Store
4. Users download new version

## Support & Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Firebase Mobile](https://firebase.google.com/docs)
- [Google Play Console](https://play.google.com/console)

## Current Features

âœ… Firebase Authentication  
âœ… Property Listings  
âœ… Search & Filter  
âœ… Property Details  
âœ… Dashboard  
âœ… User Profile  
âœ… Guest Login  
â³ Push Notifications (In Progress)  
â³ Location Services (In Progress)  
â³ Offline Support (Planned)  
â³ Dark Mode (Planned)  

## Next Steps

1. Complete push notifications setup
2. Implement location services
3. Add offline support
4. Perform security audit
5. Conduct beta testing
6. Submit to Play Store

## Contact

For issues or questions, contact the development team.


