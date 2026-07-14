# Capacitor Android First Steps

## Goal
Get the current PropertyArk web app running inside a Capacitor Android shell with the least possible change to the app code.

## 1. Install Capacitor packages
Run from the repo root:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

## 2. Confirm the production build works

```bash
npm run build
```

Expected result:
- a valid `build/` folder is created
- the web app can still be served normally

## 3. Sync Capacitor assets

```bash
npm run cap:sync
```

This should:
- build the React app
- copy the `build/` output into the Capacitor Android project
- update native assets and config

## 4. Open the Android project

```bash
npx cap open android
```

Then in Android Studio:
- let Gradle sync finish
- verify the app package name
- check the launcher icon and splash screen
- run the app on an emulator or a connected device

## 5. Validate core journeys
Test these first:
- login
- registration
- browse properties
- open property details
- payment-related screens
- receipt download
- inspection scheduling

## 6. Fix issues only if they are migration-related
If something fails in the native wrapper, look for:
- browser-only popup behavior
- window messaging assumptions
- file download limitations
- route handling edge cases

Avoid changing business logic unless a real Capacitor bug proves it is necessary.

## 7. Recommended follow-up after first launch
- Add native splash/icon polish
- Review back-button behavior
- Review deep-link support if needed
- Add plugin support only for features that truly need native APIs
