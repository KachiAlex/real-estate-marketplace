@echo off
REM PropertyArk Mobile - Gradle Build Script
REM This script builds the APK using Gradle

echo.
echo ========================================
echo PropertyArk Mobile - Gradle Build
echo ========================================
echo.

REM Check if Java is installed
java -version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Java is not installed or not in PATH
    echo Please install Java JDK 11 or higher
    echo Download from: https://www.oracle.com/java/technologies/downloads/
    pause
    exit /b 1
)

echo Java version:
java -version

REM Check if ANDROID_HOME is set
if "%ANDROID_HOME%"=="" (
    echo ERROR: ANDROID_HOME environment variable is not set
    echo Please set ANDROID_HOME to your Android SDK installation directory
    echo Example: set ANDROID_HOME=C:\Users\[username]\AppData\Local\Android\Sdk
    pause
    exit /b 1
)

echo ANDROID_HOME: %ANDROID_HOME%

REM Navigate to android directory
cd /d "%~dp0android"
if errorlevel 1 (
    echo ERROR: Failed to navigate to android directory
    pause
    exit /b 1
)

echo.
echo Step 1: Cleaning build directory...
call gradlew.bat clean
if errorlevel 1 (
    echo ERROR: Clean failed
    pause
    exit /b 1
)

echo.
echo Step 2: Building debug APK...
call gradlew.bat assembleDebug
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
echo APK location:
echo app\build\outputs\apk\debug\app-debug.apk
echo.
echo Next steps:
echo 1. Connect Android device via USB
echo 2. Enable USB debugging on device
echo 3. Run: adb install app\build\outputs\apk\debug\app-debug.apk
echo 4. Open PropertyArk app on device
echo.
pause
