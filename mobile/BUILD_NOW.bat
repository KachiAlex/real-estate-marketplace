@echo off
echo Building PropertyArk APK
echo ======================

set NODE_ENV=production
set EXPO_USE_DEV_CLIENT=0

echo Installing dependencies...
call npm install --legacy-peer-deps --force

echo Starting EAS build...
npx eas build --platform android --profile production --clear-cache

echo.
echo Build submitted!
echo Monitor at: https://expo.dev/accounts/kikiestate/projects/propertyark-mobile/builds
echo.
echo Your APK will include:
echo - PropertyArk logo as app icon
echo - 3-second splash screen with logo  
echo - Custom favicon
echo - Production build

pause
