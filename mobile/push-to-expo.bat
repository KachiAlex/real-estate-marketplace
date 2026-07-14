@echo off
echo Pushing PropertyArk to Expo for Build
echo =====================================

REM Set environment variables
set NODE_ENV=production
set EXPO_USE_DEV_CLIENT=0
set NPM_CONFIG_LEGACY_PEER_DEPS=true

REM Clean and install
echo Cleaning project...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
if exist "android\build" rmdir /s /q "android\build"

echo Installing dependencies...
call npm install --legacy-peer-deps

REM Login to Expo (if needed)
echo Checking Expo login...
npx expo whoami

if %ERRORLEVEL% NEQ 0 (
    echo Please login to Expo first:
    echo npx expo login
    pause
    exit /b 1
)

REM Push to Expo
echo Pushing project to Expo...
npx expo publish --platform android --release-channel production

echo.
echo Project pushed to Expo!
echo Now go to https://expo.dev/accounts/kikiestate/projects/propertyark-mobile
echo Click "Build" to create your APK
echo.
echo Your APK will include:
echo - PropertyArk logo as app icon
echo - 3-second splash screen with logo
echo - Custom favicon
echo - Production build

pause
