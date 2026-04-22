# Build Mobile APK - Complete Instructions

**Status:** ✅ Ready to Build  
**Date:** April 8, 2026

---

## Prerequisites

Before building, ensure you have:

1. **Node.js & npm** - Already installed ✅
2. **EAS CLI** - Install globally or use npx
3. **Expo Account** - Create at https://expo.dev
4. **Android SDK** (optional for local builds)

---

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

Or use npx (no installation needed):

```bash
npx eas-cli@latest --version
```

---

## Step 2: Login to Expo

```bash
eas login
```

Or with npx:

```bash
npx eas-cli@latest login
```

You'll be prompted to enter your Expo credentials.

---

## Step 3: Build the APK

### Option A: PropertyArkRN (Recommended)

```bash
cd PropertyArkRN
npm install
npx eas-cli@latest build -p android --profile preview
```

### Option B: mobile-app

```bash
cd mobile-app
npm install
npx eas-cli@latest build -p android --profile preview
```

---

## Build Profiles Explained

### Preview Profile
- **Purpose:** Quick testing on real devices
- **Output:** APK file
- **Time:** 5-10 minutes
- **Use:** Development and testing

```bash
npx eas-cli@latest build -p android --profile preview
```

### Production Profile
- **Purpose:** App store submission
- **Output:** AAB (Android App Bundle)
- **Time:** 10-15 minutes
- **Use:** Production deployment

```bash
npx eas-cli@latest build -p android --profile production
```

---

## Step 4: Monitor the Build

1. **Watch in Terminal**
   ```bash
   npx eas-cli@latest build -p android --profile preview --wait
   ```

2. **Check EAS Dashboard**
   - Go to https://expo.dev/builds
   - Sign in with your Expo account
   - Watch build progress in real-time

---

## Step 5: Download the APK

Once the build completes:

1. **From Terminal**
   - Link will be provided in the output
   - Copy and paste into browser

2. **From EAS Dashboard**
   - Go to https://expo.dev/builds
   - Find your build
   - Click "Download" button

---

## Step 6: Install on Android Device

### Via USB Cable
```bash
adb install path/to/app.apk
```

### Via QR Code
- Scan QR code from EAS dashboard
- Opens download link on device
- Tap to install

### Manual Installation
1. Download APK to device
2. Open file manager
3. Tap APK file
4. Follow installation prompts

---

## Troubleshooting

### Build Fails with "Cannot find module"
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build Fails with "Gradle error"
```bash
# This is usually fixed by our configuration
# If it persists, check EAS build logs for details
```

### App Crashes on Startup
1. Check Logcat for errors:
   ```bash
   adb logcat | grep PropertyArk
   ```
2. Verify environment variables are set
3. Check Render backend is accessible

### API Calls Fail
1. Verify Render backend URL: `https://propertyark-backend.onrender.com/api`
2. Check network connectivity
3. Verify JWT token is being sent

---

## Build Configuration

### PropertyArkRN Configuration
- **app.json** - Expo configuration with environment variables
- **eas.json** - Build profiles (preview, production)
- **package.json** - Dependencies and scripts
- **.env** - Environment variables (Render API URL)

### mobile-app Configuration
- **app.json** - Expo configuration with environment variables
- **eas.json** - Build profiles (preview, production)
- **package.json** - Dependencies and scripts
- **.env** - Environment variables (Render API URL)

---

## Environment Variables

Both apps use:
```
EXPO_PUBLIC_RENDER_API_URL=https://propertyark-backend.onrender.com/api
```

This is configured in:
- `app.json` (env section)
- `.env` file

---

## Build Output

### Preview APK
- **File:** `app-preview.apk`
- **Size:** ~50-80 MB
- **Installation:** Direct to device
- **Expiration:** None (stays on device)

### Production AAB
- **File:** `app-production.aab`
- **Size:** ~40-60 MB
- **Installation:** Via Google Play Store
- **Expiration:** None

---

## Next Steps After Build

1. **Test on Device**
   - Install APK
   - Test login/registration
   - Verify API calls work
   - Check navigation

2. **Verify Functionality**
   - Home screen loads
   - Properties display
   - Filters work
   - API calls succeed

3. **Deploy to Production**
   - Build production AAB
   - Submit to Google Play Store
   - Configure store listing
   - Release to users

---

## Quick Commands

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo
eas login

# Build preview APK (PropertyArkRN)
cd PropertyArkRN && npm install && eas build -p android --profile preview

# Build preview APK (mobile-app)
cd mobile-app && npm install && eas build -p android --profile preview

# Build production AAB
eas build -p android --profile production

# Check build status
eas build:list

# View build logs
eas build:view <BUILD_ID>
```

---

## Support

If you encounter issues:

1. **Check EAS Build Logs**
   - Go to https://expo.dev/builds
   - Click on your build
   - View detailed logs

2. **Common Issues**
   - Missing dependencies → Run `npm install`
   - Gradle errors → Check build logs
   - API errors → Verify Render backend
   - Crashes → Check Logcat output

3. **Documentation**
   - Expo: https://docs.expo.dev
   - EAS Build: https://docs.expo.dev/build/introduction/
   - React Native: https://reactnative.dev

---

## Summary

Your app is ready to build! Follow these steps:

1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Build: `cd PropertyArkRN && eas build -p android --profile preview`
4. Wait for build to complete (5-10 minutes)
5. Download APK from EAS dashboard
6. Install on Android device
7. Test the app

**The build process is fully automated. Just follow the prompts!**

---

**Status:** ✅ READY TO BUILD  
**Next Action:** Run the build command above

