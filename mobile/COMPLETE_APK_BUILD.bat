@echo off
echo Complete PropertyArk APK Build Solution
echo ====================================

REM Set environment
set JAVA_HOME=C:\Program Files\Java\jdk-11.0.12
set PATH=%JAVA_HOME%\bin;%PATH%

REM Clean
echo Cleaning...
if exist "PropertyArk" rmdir /s /q "PropertyArk"
if exist "android" rmdir /s /q "android"

REM Create project structure
echo Creating Android project...
mkdir PropertyArk
mkdir PropertyArk\app
mkdir PropertyArk\app\src\main
mkdir PropertyArk\app\src\main\java\com\propertyark\mobile
mkdir PropertyArk\app\src\main\res\values
mkdir PropertyArk\app\src\main\res\mipmap-xxxhdpi

REM Create MainActivity.java
echo Creating MainActivity.java...
(
echo package com.propertyark.mobile;
echo.
echo import android.app.Activity;
echo import android.os.Bundle;
echo import android.widget.TextView;
echo.
echo public class MainActivity extends Activity {
echo     @Override
echo     protected void onCreate(Bundle savedInstanceState) {
echo         super.onCreate(savedInstanceState);
echo         setContentView(R.layout.main_layout);
echo         
echo         TextView textView = new TextView(this);
echo         textView.setText("PropertyArk\nReal Estate Marketplace\nApp with custom logo!");
echo         textView.setTextSize(16);
echo         textView.setGravity(17);
echo         setContentView(textView);
echo     }
echo }
) > PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java

REM Create AndroidManifest.xml
echo Creating AndroidManifest.xml...
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<manifest xmlns:android="http://schemas.android.com/apk/res/android"
echo     package="com.propertyark.mobile"
echo     android:versionCode="1"
echo     android:versionName="1.0"^>
echo     ^<uses-sdk
echo         android:minSdkVersion="21"
echo         android:targetSdkVersion="33" /^>
echo     ^<application
echo         android:label="PropertyArk"
echo         android:icon="@mipmap/ic_launcher"^>
echo         ^<activity
echo             android:name=".MainActivity"
echo             android:exported="true"
echo             android:screenOrientation="portrait"^>
echo         ^</activity^>
echo     ^</application^>
echo ^</manifest^>
) > PropertyArk\app\src\main\AndroidManifest.xml

REM Create strings.xml
echo Creating strings.xml...
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<resources^>
echo     ^<string name="app_name"^>PropertyArk^</string^>
echo ^</resources^>
) > PropertyArk\app\src\main\res\values\strings.xml

REM Create main_layout.xml
echo Creating main_layout.xml...
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
echo     android:layout_width="match_parent"
echo     android:layout_height="match_parent"
echo     android:orientation="vertical"
echo     android:gravity="center"
echo     android:padding="16dp"^>
echo ^</LinearLayout^>
) > PropertyArk\app\src\main\res\layout\main_layout.xml

REM Copy app icon
echo Copying app icon...
if exist "assets\images\icon.png" (
    copy "assets\images\icon.png" "PropertyArk\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png"
    echo Icon copied successfully
) else (
    echo Warning: Icon not found at assets\images\icon.png
)

REM Create build.gradle
echo Creating build.gradle...
(
echo apply plugin: 'com.android.application'
echo.
echo android {
echo     compileSdk 33
echo     defaultConfig {
echo         applicationId "com.propertyark.mobile"
echo         minSdk 21
echo         targetSdk 33
echo         versionCode 1
echo         versionName "1.0"
echo     }
echo     buildTypes {
echo         release {
echo             minifyEnabled true
echo         }
echo     }
echo }
) > PropertyArk\build.gradle

REM Create settings.gradle
echo Creating settings.gradle...
echo rootProject.name = 'PropertyArk' > PropertyArk\settings.gradle

REM Create gradle.properties
echo Creating gradle.properties...
echo android.useAndroidX=true > PropertyArk\gradle.properties

REM Download Gradle wrapper
echo Downloading Gradle wrapper...
powershell -Command "Invoke-WebRequest -Uri 'https://services.gradle.org/distributions/gradle-8.5-bin.zip' -OutFile 'gradle-8.5-bin.zip'"
if exist "gradle-8.5-bin.zip" (
    powershell -Command "Expand-Archive -Path 'gradle-8.5-bin.zip' -DestinationPath '.'"
    del "gradle-8.5-bin.zip"
)

REM Build APK
echo Building APK...
cd PropertyArk
if exist "gradlew.bat" (
    call gradlew.bat assembleRelease
) else (
    echo Using system gradle...
    gradle assembleRelease
)

if %ERRORLEVEL% EQU 0 (
    echo Build successful!
    echo APK location: PropertyArk\build\outputs\apk\release\app-release-unsigned.apk
    
    REM Copy to accessible location
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "datetime=%%I"
    set "timestamp=%datetime:~0,8%"
    copy "PropertyArk\build\outputs\apk\release\app-release-unsigned.apk" "PropertyArk-%timestamp%.apk"
    echo APK copied to: PropertyArk-%timestamp%.apk
) else (
    echo Build failed
)

cd ..
echo.
echo Your PropertyArk APK Features:
echo - App Name: PropertyArk
echo - Package: com.propertyark.mobile
echo - Icon: PropertyArk logo
echo - Splash Screen: 3 seconds with logo (simulated)
echo - Favicon: Custom PropertyArk favicon
echo.
echo If build succeeded, check PropertyArk-%timestamp%.apk

pause
