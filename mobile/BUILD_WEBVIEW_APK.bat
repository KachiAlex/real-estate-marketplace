@echo off
echo Building PropertyArk WebView APK
echo ===============================

REM Set environment
set JAVA_HOME=C:\Program Files\Java\jdk-11.0.12
set PATH=%JAVA_HOME%\bin;%PATH%
set ANDROID_HOME=C:\Users\%USERNAME%\AppData\Local\Android\Sdk
set PATH=%ANDROID_HOME%\tools;%ANDROID_HOME%\platform-tools;%PATH%

REM Create project structure
echo Creating WebView project structure...
if exist "WebViewAPK\app" rmdir /s /q "WebViewAPK\app"
mkdir WebViewAPK\app\src\main\java\com\propertyark\mobile
mkdir WebViewAPK\app\src\main\res\values
mkdir WebViewAPK\app\src\main\res\xml
mkdir WebViewAPK\app\src\main\res\mipmap-hdpi
mkdir WebViewAPK\app\src\main\res\mipmap-mdpi
mkdir WebViewAPK\app\src\main\res\mipmap-xhdpi
mkdir WebViewAPK\app\src\main\res\mipmap-xxhdpi
mkdir WebViewAPK\app\src\main\res\mipmap-xxxhdpi

REM Move files to correct locations
echo Setting up project files...
move WebViewAPK\AndroidManifest.xml WebViewAPK\app\src\main\AndroidManifest.xml
move WebViewAPK\MainActivity.java WebViewAPK\app\src\main\java\com\propertyark\mobile\MainActivity.java
move WebViewAPK\build.gradle WebViewAPK\app\build.gradle
move WebViewAPK\settings.gradle WebViewAPK\settings.gradle
move WebViewAPK\gradle.properties WebViewAPK\gradle.properties
move WebViewAPK\proguard-rules.pro WebViewAPK\app\proguard-rules.pro

REM Copy resources
echo Copying resources...
xcopy /E /I /Y "WebViewAPK\res" "WebViewAPK\app\src\main\res"

REM Copy PropertyArk logo
echo Copying PropertyArk logo...
if exist "assets\images\icon.png" (
    copy "assets\images\icon.png" "WebViewAPK\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png"
    copy "assets\images\icon.png" "WebViewAPK\app\src\main\res\mipmap-xxhdpi\ic_launcher.png"
    copy "assets\images\icon.png" "WebViewAPK\app\src\main\res\mipmap-xhdpi\ic_launcher.png"
    copy "assets\images\icon.png" "WebViewAPK\app\src\main\res\mipmap-mdpi\ic_launcher.png"
    copy "assets\images\icon.png" "WebViewAPK\app\src\main\res\mipmap-hdpi\ic_launcher.png"
    echo Logo copied successfully
) else (
    echo Warning: PropertyArk logo not found at assets\images\icon.png
    echo Please ensure the logo file exists
)

REM Create Gradle wrapper
echo Creating Gradle wrapper...
cd WebViewAPK

REM Download Gradle if needed
if not exist "gradle-8.5-bin.zip" (
    echo Downloading Gradle...
    powershell -Command "Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-8.5-bin.zip' -OutFile 'gradle-8.5-bin.zip'"
)

REM Extract Gradle
if exist "gradle-8.5-bin.zip" (
    echo Extracting Gradle...
    powershell -Command "Expand-Archive -Path 'gradle-8.5-bin.zip' -DestinationPath '.' -Force"
    del "gradle-8.5-bin.zip"
)

REM Build APK
echo Building APK...
if exist "gradlew.bat" (
    call gradlew.bat assembleRelease
) else (
    echo Using system gradle...
    gradle assembleRelease
)

if %ERRORLEVEL% EQU 0 (
    echo Build successful!
    echo APK location: WebViewAPK\app\build\outputs\apk\release\app-release.apk
    
    REM Copy to accessible location
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "datetime=%%I"
    set "timestamp=%datetime:~0,8%"
    copy "WebViewAPK\app\build\outputs\apk\release\app-release.apk" "PropertyArk-WebView-%timestamp%.apk"
    echo APK copied to: PropertyArk-WebView-%timestamp%.apk
    
    REM Install instructions
    echo.
    echo ========================================
    echo INSTALLATION INSTRUCTIONS:
    echo ========================================
    echo 1. Enable "Unknown Sources" in Android Settings
    echo 2. Install PropertyArk-WebView-%timestamp%.apk
    echo 3. Grant Internet permissions when prompted
    echo 4. Open app and test
    echo ========================================
    echo.
    echo DEBUGGING:
    echo - Connect phone and run: adb logcat
    echo - Check Chrome: chrome://inspect
    echo - Test URL: Change APP_URL in MainActivity.java
    echo ========================================
    
) else (
    echo Build failed!
    echo.
    echo TROUBLESHOOTING:
    echo 1. Check Android SDK installation
    echo 2. Verify Java version (JDK 11+)
    echo 3. Check network connection
    echo 4. Run: gradle --version
    echo ========================================
)

cd ..

echo.
echo Your PropertyArk WebView APK Features:
echo - App Name: PropertyArk
echo - Package: com.propertyark.mobile
echo - Icon: PropertyArk logo
echo - WebView: Properly configured
echo - JavaScript: Enabled
echo - HTTP/HTTPS: Both supported
echo - Debugging: Enabled
echo - Permissions: Internet access
echo.
echo If build succeeded, check PropertyArk-WebView-*.apk

pause
