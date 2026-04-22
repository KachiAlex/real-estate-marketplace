@echo off
echo Launching Android Studio with PropertyArk Project
echo ===============================================

echo Opening Android Studio...
echo Project: d:\real-estate-marketplace\mobile\WebViewAPK
echo.

REM Try different Android Studio paths
start "" "C:\Program Files\Android\Android Studio\bin\studio64.exe" "d:\real-estate-marketplace\mobile\WebViewAPK"

echo.
echo ========================================
echo PROPERTYARK PROJECT OPENED!
echo ========================================
echo.
echo NEXT STEPS:
echo 1. Wait for Gradle sync (2-5 minutes)
echo 2. Edit MainActivity.java to change web app URL:
echo    Location: WebViewAPK\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo    Current URL: https://propertyark.com
echo    Change to: https://your-actual-propertyark-url.com
echo.
echo 3. Build APK:
echo    Go to Build ^> Build Bundle(s)/APK(s)
echo    Select "Build APK(s)"
echo    Choose "release" variant
echo.
echo 4. APK Location:
echo    WebViewAPK\app\build\outputs\apk\release\app-release.apk
echo.
echo FEATURES READY:
echo ✅ PropertyArk logo as app icon
echo ✅ WebView with JavaScript enabled
echo ✅ Internet permissions configured
echo ✅ HTTP/HTTPS support
echo ✅ Error handling with messages
echo ✅ Debugging enabled
echo ✅ Back button navigation
echo ========================================

pause
