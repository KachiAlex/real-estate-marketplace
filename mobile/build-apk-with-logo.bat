@echo off
echo Building PropertyArk APK with Custom Logo
echo ========================================

REM Set environment variables
set NODE_ENV=production
set EXPO_USE_DEV_CLIENT=0

REM Verify assets exist
echo Checking assets...
if not exist "assets\images\icon.png" (
    echo Error: icon.png not found in assets\images\
    pause
    exit /b 1
)

if not exist "assets\images\android-icon-foreground.png" (
    echo Error: android-icon-foreground.png not found in assets\images\
    pause
    exit /b 1
)

if not exist "assets\images\favicon.png" (
    echo Error: favicon.png not found in assets\images\
    pause
    exit /b 1
)

echo All required assets found!

REM Clean previous builds
echo Cleaning previous builds...
if exist "android\build" rmdir /s /q "android\build"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

REM Prebuild the project
echo Prebuilding project...
npx expo prebuild --platform android --clean

REM Build APK using Gradle
echo Building APK...
cd android
call gradlew.bat assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo Build successful!
    echo APK location: android\app\build\outputs\apk\release\app-release.apk
    
    REM Copy APK to a more accessible location
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "datetime=%%I"
    set "timestamp=%datetime:~0,8%"
    copy "app\build\outputs\apk\release\app-release.apk" "..\PropertyArk-%timestamp%.apk"
    
    echo APK copied to: PropertyArk-%timestamp%.apk
    echo.
    echo APK Features:
    echo - Custom app icon: assets\images\icon.png
    echo - Android adaptive icon: assets\images\android-icon-foreground.png
    echo - Web favicon: assets\images\favicon.png
    echo - Splash screen: assets\images\splash-icon.png (3 seconds)
    echo.
    echo Install with: adb install PropertyArk-%timestamp%.apk
) else (
    echo Build failed!
    pause
    exit /b 1
)

pause
