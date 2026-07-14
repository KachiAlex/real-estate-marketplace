@echo off
REM PropertyArk Mobile - Download Gradle Wrapper and Build

echo.
echo ========================================
echo PropertyArk Mobile - Gradle Build
echo ========================================
echo.

REM Set paths
set GRADLE_WRAPPER_DIR=%CD%\android\gradle\wrapper
set GRADLE_WRAPPER_JAR=%GRADLE_WRAPPER_DIR%\gradle-wrapper.jar
set GRADLE_WRAPPER_PROPS=%GRADLE_WRAPPER_DIR%\gradle-wrapper.properties

echo Checking Gradle wrapper...
if exist "%GRADLE_WRAPPER_JAR%" (
    echo ✓ Gradle wrapper JAR found
) else (
    echo ✗ Gradle wrapper JAR not found
    echo Creating wrapper directory...
    if not exist "%GRADLE_WRAPPER_DIR%" mkdir "%GRADLE_WRAPPER_DIR%"
    
    echo.
    echo Downloading Gradle wrapper JAR...
    echo This may take a few minutes...
    echo.
    
    REM Try to download from multiple sources
    powershell -Command "try { $ProgressPreference = 'SilentlyContinue'; Invoke-WebRequest -Uri 'https://repo1.maven.org/maven2/org/gradle/gradle-wrapper/8.13/gradle-wrapper-8.13.jar' -OutFile '%GRADLE_WRAPPER_JAR%' -UseBasicParsing; Write-Host 'Downloaded successfully' } catch { Write-Host 'Download failed, trying alternative source...'; Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-8.13-wrapper.jar' -OutFile '%GRADLE_WRAPPER_JAR%' -UseBasicParsing }"
    
    if exist "%GRADLE_WRAPPER_JAR%" (
        echo ✓ Gradle wrapper JAR downloaded successfully
    ) else (
        echo ✗ Failed to download Gradle wrapper JAR
        echo.
        echo Please download manually from:
        echo https://repo1.maven.org/maven2/org/gradle/gradle-wrapper/8.13/gradle-wrapper-8.13.jar
        echo.
        echo And place it at: %GRADLE_WRAPPER_JAR%
        pause
        exit /b 1
    )
)

echo.
echo Gradle wrapper properties:
type "%GRADLE_WRAPPER_PROPS%"

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
echo %CD%\app\build\outputs\apk\debug\app-debug.apk
echo.
echo Next steps:
echo 1. Connect Android device via USB
echo 2. Enable USB debugging on device
echo 3. Run: adb install app\build\outputs\apk\debug\app-debug.apk
echo 4. Open PropertyArk app on device
echo.
pause
