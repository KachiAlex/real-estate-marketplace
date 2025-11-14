# Manual Android APK Build Steps - Step by Step

## Prerequisites Check

Before starting, you need:

1. ✅ **Android Studio** installed
   - Download: https://developer.android.com/studio
   - Install Android SDK Platform 33 or higher
   - Install Android SDK Build-Tools

2. ✅ **Java JDK** 11 or 17 installed
   - Download: https://www.oracle.com/java/technologies/downloads/
   - Or install via Android Studio
   - Verify: `java -version`

3. ✅ **Environment Variables** set
   - `JAVA_HOME` pointing to JDK installation
   - `ANDROID_HOME` pointing to Android SDK location (optional, Android Studio handles this)

## Build Steps (Run in PowerShell or Command Prompt)

### Step 1: Navigate to Mobile App Directory

```powershell
cd C:\real-estate-marketplace\mobile-app
```

### Step 2: Generate Android Native Project

```powershell
npx expo prebuild -p android --clean
```

This creates the `android` folder with native Android project files.

### Step 3: Navigate to Android Directory

```powershell
cd android
```

### Step 4: Build the APK

**On Windows:**
```powershell
.\gradlew.bat assembleRelease
```

**Alternative (if above fails):**
```powershell
gradlew assembleRelease
```

### Step 5: Find Your APK

After build completes, find your APK at:
```
android\app\build\outputs\apk\release\app-release.apk
```

### Step 6: Install on Device

**Method 1: Direct Install**
- Transfer APK to your Android device
- Enable "Install from Unknown Sources" in device settings
- Tap the APK file to install

**Method 2: ADB Install**
```powershell
adb install app\build\outputs\apk\release\app-release.apk
```

## Troubleshooting

### Error: "java not found"
**Solution**: Install Java JDK 11 or 17
- Download from Oracle or use Android Studio's bundled JDK

### Error: "gradlew not found"
**Solution**: Make sure you're in the `android` directory
```powershell
cd android
```

### Error: "Android SDK not found"
**Solution**: 
1. Open Android Studio
2. Go to Settings → Appearance & Behavior → System Settings → Android SDK
3. Install "Android SDK Platform 33"
4. Install "Android SDK Build-Tools"

### Error: Prebuild fails
**Solution**:
```powershell
# Clean and retry
rm -r android
npx expo prebuild -p android --clean
```

### Build takes too long
**Solution**: This is normal for first build. Subsequent builds are faster.

## Quick Build Script

If you've set everything up, you can use the automated script:

```powershell
.\build-apk.bat
```

This runs all steps automatically.

## Alternative: Use Android Studio

1. Open Android Studio
2. Click "Open an Existing Project"
3. Navigate to `C:\real-estate-marketplace\mobile-app\android`
4. Wait for Gradle sync
5. Build → Build Bundle(s) / APK(s) → Build APK(s)
6. APK will be in `app/build/outputs/apk/debug` or `release`

## Success Indicators

✅ Build completes with "BUILD SUCCESSFUL"  
✅ APK file appears in the release folder  
✅ File size is approximately 40-80 MB  
✅ Can be installed on Android devices  

## Next Steps After Build

1. Test the APK on your device
2. Share with team for testing
3. Submit to Google Play Store (if building production)
4. Keep the APK for distribution

## Need Help?

- Check `ANDROID_BUILD_GUIDE.md` for detailed instructions
- Review `BUILD_STATUS.md` for known issues
- Consult Expo documentation: https://docs.expo.dev/build/android-builds/

