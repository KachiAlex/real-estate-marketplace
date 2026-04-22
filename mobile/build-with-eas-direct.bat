@echo off
echo Building PropertyArk APK with EAS Direct
echo =========================================

REM Set environment variables
set NODE_ENV=production
set EXPO_USE_DEV_CLIENT=0
set NPM_CONFIG_LEGACY_PEER_DEPS=true
set EAS_SKIP_AUTO_FINGERPRINT=1

REM Clean project
echo Cleaning project...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
if exist "android\build" rmdir /s /q "android\build"

REM Install dependencies
echo Installing dependencies with legacy peer deps...
call npm install --legacy-peer-deps

REM Check EAS login
echo Checking EAS login...
npx eas whoami

if %ERRORLEVEL% NEQ 0 (
    echo Please login to EAS first:
    echo npx eas login
    pause
    exit /b 1
)

REM Build directly with EAS
echo Starting EAS build...
npx eas build --platform android --profile production --clear-cache

echo.
echo Build submitted to EAS!
echo Monitor progress at: https://expo.dev/accounts/kikiestate/projects/propertyark-mobile/builds
echo.
echo APK will include:
echo - PropertyArk logo as app icon
echo - 3-second splash screen with logo
echo - Custom favicon
echo - Production build
echo.
echo Download APK from EAS dashboard when complete

pause
