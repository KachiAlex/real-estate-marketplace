# Android Studio Setup Required for APK Build

## ⚠️ Important Notice

To build the Android APK using **Option 3 (Local Build)**, you need to install and configure Android Studio first.

## 📥 What to Install

### 1. Android Studio
**Download**: https://developer.android.com/studio  
**Size**: ~1 GB  
**Includes**: Android SDK, Android Virtual Device, Gradle

**Installation Steps**:
1. Download Android Studio installer
2. Run installer and follow setup wizard
3. During setup, install:
   - Android SDK Platform 33 or higher
   - Android SDK Build-Tools
   - Android Virtual Device (optional, for emulator)
4. Launch Android Studio once to complete setup

### 2. Java JDK (if not included)
Android Studio comes with JDK, but if needed:

**Download**: https://www.oracle.com/java/technologies/downloads/  
**Version**: JDK 11 or JDK 17

## ✅ Quick Verification

After installation, verify in PowerShell:

```powershell
# Check Java
java -version

# Check Android SDK (if ANDROID_HOME is set)
echo $env:ANDROID_HOME
```

## 🚀 Build Process

Once Android Studio is installed:

```powershell
# Navigate to mobile app
cd C:\real-estate-marketplace\mobile-app

# Generate Android project
npx expo prebuild -p android --clean

# Build APK
cd android
.\gradlew.bat assembleRelease
```

## ⏱️ Estimated Time

- **Android Studio Download**: 15-30 minutes (depends on internet)
- **Android Studio Installation**: 10-15 minutes
- **First Build**: 10-15 minutes
- **Total Setup Time**: ~1 hour

## 🎯 Alternative: Use Expo Go Now

While setting up Android Studio:

**Test the app immediately with Expo Go**:
```powershell
cd C:\real-estate-marketplace\mobile-app
npm start
```

Scan the QR code with the Expo Go app on your phone - the app works perfectly!

## 📋 Setup Checklist

Use this to track your progress:

- [ ] Android Studio downloaded
- [ ] Android Studio installed
- [ ] SDK Platform 33+ installed
- [ ] Build-Tools installed
- [ ] Java JDK verified
- [ ] Environment variables set (optional)
- [ ] Ready to build APK

## 🔗 Resources

- Android Studio: https://developer.android.com/studio
- Expo Android Build: https://docs.expo.dev/build/android-builds/
- Troubleshooting: Check `mobile-app/MANUAL_BUILD_STEPS.md`

## 💡 Recommendation

**Right Now**: Use Expo Go to test the app while Android Studio downloads  
**After Setup**: Build the APK using the instructions above  

The app is ready - we just need Android Studio to build the native APK!

