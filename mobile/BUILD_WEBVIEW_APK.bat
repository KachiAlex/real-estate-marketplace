@echo off
REM PropertyArk Mobile - React Native WebView APK Build Script
REM This script builds the APK using EAS (Expo Application Services)

echo.
echo ========================================
echo PropertyArk Mobile - WebView APK Build
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Expo CLI is installed
expo --version >nul 2>&1
if errorlevel 1 (
    echo Installing Expo CLI...
    call npm install -g expo-cli
    if errorlevel 1 (
        echo ERROR: Failed to install Expo CLI
        pause
        exit /b 1
    )
)

echo.
echo Step 1: Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Building APK with EAS...
echo.
echo Choose build type:
echo 1. Local build (requires Android SDK)
echo 2. Cloud build (recommended, no Android SDK needed)
echo.
set /p BUILD_TYPE="Enter choice (1 or 2): "

if "%BUILD_TYPE%"=="1" (
    echo.
    echo Building APK locally...
    call eas build --platform android --local
) else if "%BUILD_TYPE%"=="2" (
    echo.
    echo Building APK in cloud...
    call eas build --platform android
) else (
    echo Invalid choice. Using cloud build...
    call eas build --platform android
)

if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo APK file location:
echo - Check EAS dashboard for download link
echo - Or check dist/ directory for local builds
echo.
echo Next steps:
echo 1. Download APK from EAS dashboard (if cloud build)
echo 2. Install on device: adb install propertyark-mobile.apk
echo 3. Open PropertyArk app on device
echo.
pause
