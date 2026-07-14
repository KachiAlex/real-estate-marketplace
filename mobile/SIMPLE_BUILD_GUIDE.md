# Simple PropertyArk APK Build Guide

## Method 1: One-Click Build (Easiest)

### Step 1: Run the Build Script
```bash
cd mobile
.\build-apk-direct.bat
```

### Step 2: Follow the Instructions
The script will:
- Clean previous builds
- Install dependencies  
- Try EAS cloud build
- Fall back to local build if needed
- Copy APK to accessible location

### Step 3: Get Your APK
- **Success**: APK will be in `PropertyArk-YYYYMMDD.apk`
- **EAS Build**: Check https://expo.dev/accounts/kikiestate/projects/propertyark-mobile/builds
- **Local Build**: Check `android\app\build\outputs\apk\release\app-release.apk`

## Method 2: Manual Expo Build

### Step 1: Go to Expo Dashboard
**URL**: https://expo.dev/accounts/kikiestate/projects/propertyark-mobile

### Step 2: Click "Build"
- Look for a "Build" or "Create Build" button
- Select "Android" platform
- Choose "Production" profile
- Click "Start Build"

### Step 3: Wait for Build
- Build takes 15-30 minutes
- You'll get email notification when done
- Download APK from dashboard

## Method 3: Use Online APK Builder

### Step 1: Upload to Expo Snack
- Go to: https://snack.expo.dev
- Upload your mobile folder
- Build in browser

### Step 2: Download APK
- Snack will generate APK
- Download directly to your device

## Method 4: GitLab Pages (No Merge Requests)

### Step 1: Push to GitLab
```bash
git add .
git commit -m "Ready for build"
git push gitlab main:direct-build
```

### Step 2: Use GitLab Web IDE
- Go to: https://gitlab.com/opd.livmind/propertyark/-/ide
- Use terminal in IDE to run build commands
- Download APK from job artifacts

## What Your APK Will Include

### Visual Branding
- PropertyArk logo as app icon
- 3-second splash screen with logo
- Custom favicon for web
- Android adaptive icons

### Technical Details
- Package: com.propertyark.mobile
- Version: 1.0.0
- Production build (no dev dependencies)
- Optimized for Android 5.0+

## Troubleshooting

### If Build Fails
1. Check internet connection
2. Ensure all assets are in `assets/images/`
3. Try clearing cache: `npm cache clean --force`
4. Update dependencies: `npm update`

### If APK Not Found
1. Check multiple download locations
2. Wait for cloud builds to complete
3. Try alternative build method

## Quick Start

**Easiest Option**: Run `build-apk-direct.bat` and let it handle everything automatically!

---

**Need Help?** The direct build script is designed to handle all the complexity for you.
