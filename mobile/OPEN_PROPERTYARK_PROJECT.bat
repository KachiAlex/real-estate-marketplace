@echo off
echo Opening PropertyArk Project in Android Studio
echo ===========================================

REM Check multiple Android Studio locations
if exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" (
    set STUDIO_PATH="C:\Program Files\Android\Android Studio\bin\studio64.exe"
    echo Found Android Studio at: C:\Program Files\Android\Android Studio\bin\studio64.exe
) else if exist "C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe" (
    set STUDIO_PATH="C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe"
    echo Found Android Studio at: C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe
) else (
    REM Try to find studio.exe in common locations
    for /r "C:\" %%f in (studio64.exe) do (
        if exist "%%f" (
            set STUDIO_PATH="%%f"
            echo Found Android Studio at: %%f
            goto :found
        )
    )
    for /r "C:\" %%f in (studio.exe) do (
        if exist "%%f" (
            set STUDIO_PATH="%%f"
            echo Found Android Studio at: %%f
            goto :found
        )
    )
    echo Android Studio not found in standard locations
    echo Please check your Android Studio installation
    pause
    exit /b
)

:found
echo.
echo Opening PropertyArk WebView project...
echo Project location: d:\real-estate-marketplace\mobile\WebViewAPK
echo.

%STUDIO_PATH% "d:\real-estate-marketplace\mobile\WebViewAPK"

echo.
echo ========================================
echo PROPERTYARK PROJECT INSTRUCTIONS:
echo ========================================
echo.
echo ✅ PROJECT IS READY TO BUILD!
echo.
echo BEFORE BUILDING:
echo 1. EDIT MainActivity.java to change web app URL
echo    - Current: https://propertyark.com
echo    - Change to: https://your-actual-propertyark-url.com
echo    - Location: WebViewAPK\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo.
echo BUILD STEPS:
echo 1. Wait for Gradle sync to complete (2-5 minutes)
echo 2. If sync fails, click "Try Again"
echo 3. Go to Build ^> Build Bundle(s)/APK(s)
echo 4. Select "Build APK(s)"
echo 5. Choose "release" variant
echo 6. Wait for build (2-5 minutes)
echo 7. APK will be in: WebViewAPK\app\build\outputs\apk\release\app-release.apk
echo.
echo TESTING:
echo 1. Enable "Unknown Sources" in Android Settings
echo 2. Install app-release.apk
echo 3. Grant Internet permissions
echo 4. Open app and test
echo.
echo FEATURES INCLUDED:
echo ✅ PropertyArk logo as app icon
echo ✅ WebView with JavaScript enabled
echo ✅ Internet permissions configured
echo ✅ HTTP/HTTPS support
echo ✅ Error handling with messages
echo ✅ Debugging enabled
echo ✅ Back button navigation
echo.
echo ========================================

pause
