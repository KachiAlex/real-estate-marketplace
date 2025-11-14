@echo off
echo Building Property Ark Android APK...
echo.

echo Step 1: Checking Node.js...
node --version
echo.

echo Step 2: Installing dependencies...
call npm install --legacy-peer-deps
echo.

echo Step 3: Running prebuild...
call npx expo prebuild -p android --clean
echo.

echo Step 4: Building APK...
cd android
call gradlew.bat assembleRelease
echo.

echo.
echo ============================================
echo Build complete!
echo APK location: android\app\build\outputs\apk\release\app-release.apk
echo ============================================
pause


