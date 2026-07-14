# PropertyArk Mobile - Quick Start Guide

## 30-Second Setup

```bash
cd mobile
npm install
eas build --platform android
```

## What You Get

✅ React Native app that loads your live web app
✅ Splash screen with PropertyArk logo
✅ Offline detection
✅ Pull-to-refresh
✅ Android back button support
✅ Error handling
✅ Loading indicator

## Build Options

### Option 1: Cloud Build (Recommended)
```bash
eas build --platform android
```
- No Android SDK required
- Faster builds
- Automatic signing
- Download from EAS dashboard

### Option 2: Local Build
```bash
eas build --platform android --local
```
- Requires Android SDK
- Builds locally
- APK in `dist/` directory

### Option 3: Development Mode
```bash
npm start
# Press 'a' for Android emulator
```

## Install on Device

```bash
adb install dist/propertyark-mobile.apk
```

## Features

| Feature | Status |
|---------|--------|
| WebView | ✅ Loads live web app |
| Splash Screen | ✅ 2-second logo display |
| Offline Detection | ✅ Shows "No Internet" screen |
| Pull-to-Refresh | ✅ Swipe down to reload |
| Back Button | ✅ Navigate through history |
| Error Handling | ✅ Error screen with recovery |
| Loading Indicator | ✅ Spinner while loading |

## Configuration

### Change Web App URL
Edit `mobile/App.js` line 13:
```javascript
const WEB_APP_URL = 'https://your-app-url.com';
```

### Change App Name
Edit `mobile/app.json`:
```json
{
  "name": "Your App Name"
}
```

## Troubleshooting

### Build fails
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### APK won't install
```bash
adb uninstall com.propertyark.mobile
adb install dist/propertyark-mobile.apk
```

### App crashes
1. Check web app URL in `App.js`
2. Verify device has internet
3. Check logs: `adb logcat | grep propertyark`

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Build APK: `eas build --platform android`
3. ✅ Install on device: `adb install dist/propertyark-mobile.apk`
4. ✅ Test on device
5. ✅ Publish to Play Store

## Files

- `App.js` - Main WebView component
- `app.json` - Expo configuration
- `package.json` - Dependencies
- `WEBVIEW_BUILD_GUIDE.md` - Full documentation

## Support

See `WEBVIEW_BUILD_GUIDE.md` for detailed documentation.
