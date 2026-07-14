# PropertyArk APK Build Guide with Custom Logo

## Current Status
- **App Name**: PropertyArk
- **Package**: com.propertyark.mobile
- **Version**: 1.0.0
- **Assets Configured**: All logos and icons are properly set

## Asset Configuration
The app is configured with the following assets:

### App Icons
- **Main Icon**: `assets/images/icon.png` (393KB)
- **Android Adaptive Icon**: `assets/images/android-icon-foreground.png` (78KB)
- **Android Background**: `assets/images/android-icon-background.png` (17KB)
- **Monochrome Icon**: `assets/images/android-icon-monochrome.png` (4KB)

### Web Assets
- **Favicon**: `assets/images/favicon.png` (1KB)

### Splash Screen
- **Splash Image**: `assets/images/splash-icon.png` (17KB)
- **Duration**: 3 seconds
- **Background**: White
- **Resize Mode**: Contain

## Build Methods

### Method 1: EAS Cloud Build (Recommended)
```bash
cd mobile
npx eas build --platform android --profile production
```

### Method 2: Local Build with Docker
```bash
# Using Docker container for Android builds
docker run --rm -v $(pwd):/app -w /app reactnativecommunity/react-native-android gradlew assembleRelease
```

### Method 3: GitLab CI/CD Build
The project is already configured with GitLab CI/CD. Push to GitLab and the build will run automatically.

## Configuration Files

### app.json Configuration
```json
{
  "expo": {
    "name": "PropertyArk",
    "slug": "propertyark-mobile",
    "icon": "./assets/images/icon.png",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff",
      "duration": 3000
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.propertyark.mobile"
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

### eas.json Configuration
```json
{
  "cli": {
    "version": ">= 18.5.0"
  },
  "build": {
    "production": {
      "autoIncrement": true
    }
  }
}
```

## Troubleshooting

### Common Issues
1. **Gradle Dependency Issues**: Update React Native version or use EAS build
2. **Missing Assets**: Ensure all required images are in `assets/images/`
3. **Build Timeout**: Use `EAS_SKIP_AUTO_FINGERPRINT=1` environment variable
4. **Git Issues**: Commit all changes before building

### Asset Requirements
- `icon.png` - 1024x1024 pixels, PNG format
- `android-icon-foreground.png` - 1024x1024 pixels, PNG format
- `favicon.png` - 32x32 pixels, PNG format
- `splash-icon.png` - 1280x720 pixels, PNG format

## Build Verification

After successful build, verify:
1. APK contains the correct app icon
2. Splash screen displays for 3 seconds
3. App name is "PropertyArk"
4. Package is "com.propertyark.mobile"
5. All permissions are correctly set

## Installation

```bash
# Install APK on connected device
adb install PropertyArk.apk

# Install via GitLab Pages (if configured)
# Download from: https://opd.livmind.gitlab.io/propertyark/mobile/PropertyArk.apk
```

## Features in Final APK

### Visual Branding
- PropertyArk logo as app icon
- Custom favicon for web version
- Branded splash screen (3 seconds)
- Adaptive Android icons

### Technical Features
- Production build (no development dependencies)
- Optimized bundle size
- Proper permissions
- Network access enabled
- Automatic version incrementation

## Next Steps

1. Use EAS build for most reliable results
2. Test APK on multiple devices
3. Verify all branding elements
4. Deploy to app stores if needed

## Support

For build issues:
- Check GitLab CI/CD logs
- Review EAS build logs
- Verify asset files exist
- Ensure all dependencies are installed
