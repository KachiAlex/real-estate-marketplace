@echo off
echo Building PropertyArk APK with Custom Logo
echo ========================================

REM Set environment variables
set NODE_ENV=production
set EXPO_USE_DEV_CLIENT=0
set EAS_SKIP_AUTO_FINGERPRINT=1

REM Clean previous builds
echo Cleaning previous builds...
if exist "android\build" rmdir /s /q "android\build"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

REM Build using EAS with local credentials
echo Building APK with EAS...
npx eas build --platform android --profile production --local

if %ERRORLEVEL% EQU 0 (
    echo Build successful!
    echo Check the android\app\build\outputs\apk\release\ folder for the APK
) else (
    echo EAS build failed, trying direct Gradle build...
    cd android
    call gradlew.bat assembleRelease
    cd ..
    
    if %ERRORLEVEL% EQU 0 (
        echo Direct Gradle build successful!
        echo APK location: android\app\build\outputs\apk\release\app-release.apk
    ) else (
        echo All build methods failed!
    )
)

echo.
echo APK Configuration:
echo - App Icon: assets\images\icon.png
echo - Android Icon: assets\images\android-icon-foreground.png
echo - Favicon: assets\images\favicon.png
echo - Splash Screen: assets\images\splash-icon.png (3 seconds)

pause
