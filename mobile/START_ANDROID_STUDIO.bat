@echo off
echo PropertyArk Android Studio Launcher
echo ===============================

REM Check if Android Studio is installed
if exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" (
    echo Android Studio found at default location
    set STUDIO_PATH="C:\Program Files\Android\Android Studio\bin\studio64.exe"
) else if exist "C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe" (
    echo Android Studio found at x86 location
    set STUDIO_PATH="C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe"
) else (
    echo Android Studio not found in standard locations
    echo.
    echo Please install Android Studio first:
    echo https://developer.android.com/studio
    echo.
    echo After installation, run this script again.
    pause
    exit /b
)

REM Open PropertyArk project
echo Opening PropertyArk WebView project...
echo Project location: d:\real-estate-marketplace\mobile\WebViewAPK
echo.

%STUDIO_PATH% "d:\real-estate-marketplace\mobile\WebViewAPK"

echo.
echo ========================================
echo ANDROID STUDIO INSTRUCTIONS:
echo ========================================
echo.
echo 1. WAIT for Gradle sync to complete
echo 2. If sync fails, click "Try Again"
echo 3. When ready, go to Build ^> Build Bundle(s)/APK(s)
echo 4. Select "Build APK(s)"
echo 5. Choose "release" variant
echo 6. Wait for build to complete
echo 7. APK will be in: WebViewAPK\app\build\outputs\apk\release\
echo.
echo BEFORE BUILDING:
echo - Edit MainActivity.java to change web app URL
echo - Current URL: https://propertyark.com
echo - Change to your actual PropertyArk URL
echo.
echo ========================================

pause
