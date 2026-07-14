@echo off
REM PropertyArk Mobile - React Native WebView Setup Script
REM This script sets up the development environment

echo.
echo ========================================
echo PropertyArk Mobile - WebView Setup
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

echo Node.js version:
node --version

echo.
echo npm version:
npm --version

REM Check if Expo CLI is installed
expo --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo Installing Expo CLI globally...
    call npm install -g expo-cli
    if errorlevel 1 (
        echo ERROR: Failed to install Expo CLI
        pause
        exit /b 1
    )
)

echo.
echo Expo CLI version:
expo --version

echo.
echo Step 1: Installing project dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo.
echo Option 1: Build APK
echo   Run: BUILD_WEBVIEW_APK.bat
echo.
echo Option 2: Development mode
echo   Run: npm start
echo   Then press 'a' for Android emulator
echo.
echo Option 3: Test on physical device
echo   Run: npm start
echo   Scan QR code with Expo Go app
echo.
pause
