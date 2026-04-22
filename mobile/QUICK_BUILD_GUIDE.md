# PropertyArk Mobile APK - Quick Build Guide

**Last Updated:** 2024
**Status:** Ready to Build

## 🚀 Quick Start (5 Minutes)

### Step 1: Navigate to Mobile Directory
```bash
cd mobile
```

### Step 2: Install Dependencies
```bash
npm install --legacy-peer-deps
```

### Step 3: Choose Your Build Method

#### Option A: EAS Cloud Build (Recommended - No Local Setup Required)
```bash
npm run build:android
```
- Takes 10-15 minutes
- Automatic signing
- No Android SDK needed
- Requires Expo account

#### Option B: Local Build (Full Control)
```bash
# Set memory for Gradle
$env:GRADLE_OPTS = "-Xmx4g -XX:MaxPermSize=512m"

# Build APK
npm run build:local
```
- Takes 20-30 minutes
- Requires Android SDK
- Requires Java 11+
- Full control over build

#### Option C: Development Build (Testing)
```bash
npm start
npm run android
```
- Takes 5-10 minutes
- Requires Android emulator or device
- Hot reload support
- For development only

## 📋 Pre-Build Checklist

- [ ] Node.js 16+ installed: `node --version`
- [ ] npm 8+ installed: `npm -v`
- [ ] Dependencies installed: `npm list react-native`
- [ ] React Native 0.81.5 verified
- [ ] Environment configured: `.env` file created
- [ ] For EAS: Logged in to Expo: `eas login`
- [ ] For Local: Android SDK installed
- [ ] For Local: Java 11+ installed: `java -version`

## 🔧 Environment Setup

### Create .env File
```bash
cp .env.example .env
```

### Edit .env with Production Values
```env
REACT_APP_API_URL=https://propertyark-backend.onrender.com/api
REACT_APP_API_TIMEOUT=30000
REACT_APP_BUILD_ENV=production
REACT_APP_VERSION=1.0.0
REACT_APP_CERTIFICATE_PINNING=true
REACT_APP_SECURE_STORAGE=true
```

## 📱 Build Commands

### EAS Cloud Build
```bash
# Production build
npm run build:android

# Preview build
npm run build:preview

# Development build
npm run build:development

# List recent builds
eas build:list

# Download specific build
eas build:download <build-id>
```

### Local Build
```bash
# Set memory
$env:GRADLE_OPTS = "-Xmx4g -XX:MaxPermSize=512m"

# Build APK
npm run build:local

# Clean and rebuild
npm run clean-build
npm run build:local
```

### Development Build
```bash
# Start dev server
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator
npm run ios

# Run on web
npm run web
```

## 📦 Build Output

### EAS Cloud Build Output
- **Location:** Download link provided by EAS
- **Filename:** `propertyark-mobile-production.apk`
- **Size:** ~50-80MB
- **Signed:** Yes (automatic)
- **Ready to Install:** Yes

### Local Build Output
- **Location:** `android/app/build/outputs/apk/release/app-release.apk`
- **Size:** ~50-80MB
- **Signed:** Yes (with keystore)
- **Ready to Install:** Yes

## 📲 Installation on Device

### Via ADB (Android Debug Bridge)
```bash
# Connect device via USB
adb devices

# Install APK
adb install app-release.apk

# Verify installation
adb shell pm list packages | grep propertyark

# Launch app
adb shell am start -n com.propertyark.mobile/.MainActivity
```

### Via File Transfer
1. Download APK to device
2. Open file manager
3. Navigate to Downloads
4. Tap APK file
5. Follow installation prompts
6. Grant permissions
7. Launch app

## ✅ Post-Build Verification

### Verify Installation
```bash
adb shell pm list packages | grep propertyark
```

### Check App Logs
```bash
adb logcat | grep propertyark
```

### Uninstall App
```bash
adb uninstall com.propertyark.mobile
```

## 🧪 Testing Checklist

- [ ] App launches without crashes
- [ ] Splash screen displays
- [ ] Login screen appears
- [ ] Can enter email and password
- [ ] Login succeeds with valid credentials
- [ ] Token stored securely
- [ ] Can access authenticated endpoints
- [ ] Logout clears token
- [ ] Offline mode works
- [ ] Cache displays when offline
- [ ] Sync works when online
- [ ] Error messages are user-friendly
- [ ] No sensitive data in logs

## 🐛 Troubleshooting

### Build Fails with "Out of Memory"
```bash
# Increase heap memory
$env:GRADLE_OPTS = "-Xmx6g -XX:MaxPermSize=1024m"
npm run build:local
```

### Build Fails with "SDK Not Found"
```bash
# Set Android SDK path
$env:ANDROID_HOME = "C:\Users\[username]\AppData\Local\Android\Sdk"
npm run build:local
```

### Build Fails with "Gradle Sync Failed"
```bash
# Clean and retry
npm run clean-build
npm run build:local
```

### APK Installation Fails
```bash
# Uninstall existing app
adb uninstall com.propertyark.mobile

# Install new APK
adb install app-release.apk
```

### App Crashes on Launch
```bash
# Check logs
adb logcat | grep propertyark

# Verify dependencies
npm list

# Reinstall dependencies
rm -rf node_modules
npm install --legacy-peer-deps
```

## 📊 Build Status Monitoring

### EAS Build Status
```bash
# Watch build progress
eas build:list

# Get build details
eas build:view <build-id>
```

### Local Build Progress
- Watch console output for build steps
- Monitor memory usage
- Check disk space (minimum 10GB)

## 🔐 Security Checklist

- [ ] No hardcoded credentials in code
- [ ] Environment variables used for secrets
- [ ] JWT tokens stored securely
- [ ] Sensitive data encrypted
- [ ] HTTPS used for API calls
- [ ] Certificate pinning enabled
- [ ] No sensitive data in logs
- [ ] Keystore secured

## 📝 Build Documentation

For detailed information, see:
- **BUILD.md** - Comprehensive build guide
- **BUILD_READINESS.md** - Pre-build verification
- **DEPENDENCY_REPORT.md** - Dependency analysis
- **IMPLEMENTATION_COMPLETE.md** - Implementation summary

## 🎯 Next Steps After Build

1. **Download APK**
   - From EAS dashboard or local output

2. **Install on Device**
   - Use ADB or file transfer

3. **Test Features**
   - Authentication
   - Offline support
   - API communication

4. **Verify Performance**
   - Memory usage
   - Battery consumption
   - Network efficiency

5. **Deploy to Production**
   - Upload to Google Play Store
   - Monitor for issues
   - Collect user feedback

## 💡 Tips & Best Practices

- Always use `--legacy-peer-deps` flag for npm install
- Set `GRADLE_OPTS` before local builds
- Keep `.env` file secure (never commit to git)
- Test on multiple devices if possible
- Monitor build logs for warnings
- Keep dependencies updated monthly
- Run `npm audit` regularly for security

## 📞 Support

- **Expo Docs:** https://docs.expo.dev/
- **React Native Docs:** https://reactnative.dev/
- **Android Docs:** https://developer.android.com/
- **Build Issues:** Check BUILD.md troubleshooting section

---

**Ready to Build?** Run: `npm run build:android`

**Status:** ✅ READY FOR BUILD
