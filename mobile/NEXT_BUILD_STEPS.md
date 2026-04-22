# Next Build Steps - PropertyArk Mobile APK

## Current Status

✅ **Build Configuration Fixed**
- Gradle plugin versions specified
- SDK versions defined in gradle.properties
- Architecture optimized for arm64-v8a

## Recommended Build Path

### Step 1: Prepare Environment (5 minutes)

```bash
cd mobile

# Install dependencies with legacy peer deps flag
npm install --legacy-peer-deps

# Verify Node.js version (should be 16+)
node --version

# Verify npm version (should be 8+)
npm --version
```

### Step 2: Prebuild for Android (10-15 minutes)

```bash
# Clean prebuild to ensure fresh start
npx expo prebuild --clean

# This will:
# - Generate android/ directory with native code
# - Resolve all native dependencies
# - Configure Gradle build system
```

### Step 3: Build APK Locally (20-30 minutes)

**Option A: Using Gradle directly (Recommended)**
```bash
cd android

# Set memory for Gradle (Windows PowerShell)
$env:GRADLE_OPTS = "-Xmx4g -XX:MaxPermSize=512m"

# Build release APK
./gradlew assembleRelease

# APK will be at: app/build/outputs/apk/release/app-release.apk
cd ..
```

**Option B: Using Expo CLI**
```bash
npx expo build:android --local
```

**Option C: Using EAS Cloud Build**
```bash
# Update EAS CLI globally
npm install -g eas-cli@latest

# Build in cloud
npm run build:android
```

### Step 4: Verify APK (2 minutes)

```bash
# Check APK exists and has reasonable size
ls -la android/app/build/outputs/apk/release/app-release.apk

# Should be 50-100MB depending on dependencies
```

## Expected Build Output

```
BUILD SUCCESSFUL in 25s
```

APK location: `mobile/android/app/build/outputs/apk/release/app-release.apk`

## Troubleshooting

### Issue: "Plugin [id: 'com.facebook.react.settings'] was not found"
**Solution:** Already fixed in build.gradle and gradle.properties

### Issue: "Cannot find module '@expo/package-manager'"
**Solution:** Use local Gradle build instead of EAS Cloud Build

### Issue: "Gradle build failed with OutOfMemoryError"
**Solution:** Increase Gradle memory:
```bash
$env:GRADLE_OPTS = "-Xmx6g -XX:MaxPermSize=512m"
```

### Issue: "Android SDK not found"
**Solution:** Set ANDROID_HOME environment variable:
```bash
# Windows PowerShell
$env:ANDROID_HOME = "C:\Users\[username]\AppData\Local\Android\Sdk"
```

### Issue: "Java version not compatible"
**Solution:** Ensure Java 11+ is installed:
```bash
java -version  # Should show 11 or later
```

## Build Time Estimates

| Step | Time | Notes |
|------|------|-------|
| npm install | 5 min | One-time, cached after |
| expo prebuild | 10-15 min | Generates native code |
| Gradle build | 20-30 min | First build slower, cached after |
| **Total** | **35-50 min** | Subsequent builds: 15-20 min |

## Success Criteria

✅ Build completes without errors
✅ APK file is generated (50-100MB)
✅ APK is signed with debug keystore
✅ APK can be installed on Android device

## Next Steps After Build

1. **Test APK Installation:**
   ```bash
   adb install android/app/build/outputs/apk/release/app-release.apk
   ```

2. **Verify App Launches:**
   - App should start without crashes
   - Should show splash screen
   - Should redirect to login screen

3. **Test Backend Connectivity:**
   - Login with test credentials
   - Verify API calls to backend work
   - Check cache functionality

4. **Generate Production Build:**
   - Create production keystore
   - Sign with production key
   - Prepare for Play Store submission

## Files Modified

- `mobile/android/build.gradle` - Plugin versions
- `mobile/android/gradle.properties` - SDK versions
- `mobile/BUILD_FIX_APPLIED.md` - Documentation of fixes

## Support

If you encounter issues:
1. Check `BUILD_TROUBLESHOOTING.md` for common solutions
2. Review `BUILD.md` for detailed build documentation
3. Check `QUICK_BUILD_GUIDE.md` for quick reference

---

**Ready to build!** Follow the steps above to generate your APK.
