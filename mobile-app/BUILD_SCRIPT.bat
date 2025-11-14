@echo off
echo ============================================
echo Property Ark - Android APK Builder
echo ============================================
echo.

cd android

echo Building APK...
call gradlew.bat assembleRelease

echo.
echo ============================================
echo Build Complete!
echo ============================================
echo.
echo Your APK is located at:
echo android\app\build\outputs\apk\release\app-release.apk
echo.
pause


