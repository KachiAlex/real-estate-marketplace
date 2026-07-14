# Capacitor Setup Checklist

## Prerequisites
- Node.js installed
- Android Studio installed
- Android SDK configured
- Existing web app build succeeds with `npm run build`

## Install Capacitor packages
Run in the repo root:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

## Initial sync flow
After packages are installed:

```bash
npm run build
npx cap sync android
npx cap open android
```

## What to verify in Android Studio
- App launches and loads the production build
- Login works
- Property browsing works
- Payment flows work
- Receipt flow works
- Back button behavior feels correct

## If you need to re-sync after changes

```bash
npm run cap:sync
```

## Recommended follow-up tasks
- Add native splash screen and icons
- Review deep link handling
- Replace any remaining popup-heavy browser flows with mobile-friendly UX if needed
- Add push notification support only after the base APK is stable
