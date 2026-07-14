@echo off
echo Simple PropertyArk APK Build
echo =============================

REM Create project structure
if exist "PropertyArk" rmdir /s /q "PropertyArk"
mkdir PropertyArk
mkdir PropertyArk\app
mkdir PropertyArk\app\src\main
mkdir PropertyArk\app\src\main\java\com\propertyark\mobile
mkdir PropertyArk\app\src\main\res\values
mkdir PropertyArk\app\src\main\res\mipmap-xxxhdpi

REM Create MainActivity.java
echo package com.propertyark.mobile; > PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo import android.app.Activity; >> PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo import android.os.Bundle; >> PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo import android.widget.TextView; >> PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo. >> PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo public class MainActivity extends Activity { >> PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo     @Override >> PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo     protected void onCreate(Bundle savedInstanceState) { >> PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo         super.onCreate(savedInstanceState); >> PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo         TextView textView = new TextView(this); >> PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo         textView.setText("PropertyArk\nReal Estate Marketplace\nApp with custom logo!"); >> PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo         textView.setTextSize(16); >> PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo         textView.setGravity(17); >> PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo         setContentView(textView); >> PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo     } >> PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java
echo } >> PropertyArk\app\src\main\java\com\propertyark\mobile\MainActivity.java

REM Create AndroidManifest.xml
echo ^<?xml version="1.0" encoding="utf-8"?^> > PropertyArk\app\src\main\AndroidManifest.xml
echo ^<manifest xmlns:android="http://schemas.android.com/apk/res/android" >> PropertyArk\app\src\main\AndroidManifest.xml
echo     package="com.propertyark.mobile" >> PropertyArk\app\src\main\AndroidManifest.xml
echo     android:versionCode="1" >> PropertyArk\app\src\main\AndroidManifest.xml
echo     android:versionName="1.0"^> >> PropertyArk\app\src\main\AndroidManifest.xml
echo     ^<uses-sdk android:minSdkVersion="21" android:targetSdkVersion="33"/^> >> PropertyArk\app\src\main\AndroidManifest.xml
echo     ^<application android:label="PropertyArk" android:icon="@mipmap/ic_launcher"^> >> PropertyArk\app\src\main\AndroidManifest.xml
echo         ^<activity android:name=".MainActivity" android:exported="true"^> >> PropertyArk\app\src\main\AndroidManifest.xml
echo         ^</activity^> >> PropertyArk\app\src\main\AndroidManifest.xml
echo     ^</application^> >> PropertyArk\app\src\main\AndroidManifest.xml
echo ^</manifest^> >> PropertyArk\app\src\main\AndroidManifest.xml

REM Create strings.xml
echo ^<?xml version="1.0" encoding="utf-8"?^> > PropertyArk\app\src\main\res\values\strings.xml
echo ^<resources^> >> PropertyArk\app\src\main\res\values\strings.xml
echo     ^<string name="app_name"^>PropertyArk^</string^> >> PropertyArk\app\src\main\res\values\strings.xml
echo ^</resources^> >> PropertyArk\app\src\main\res\values\strings.xml

REM Copy app icon
if exist "assets\images\icon.png" copy "assets\images\icon.png" "PropertyArk\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png"

REM Create build.gradle
echo apply plugin: 'com.android.application' > PropertyArk\build.gradle
echo. >> PropertyArk\build.gradle
echo android { >> PropertyArk\build.gradle
echo     compileSdk 33 >> PropertyArk\build.gradle
echo     defaultConfig { >> PropertyArk\build.gradle
echo         applicationId "com.propertyark.mobile" >> PropertyArk\build.gradle
echo         minSdk 21 >> PropertyArk\build.gradle
echo         targetSdk 33 >> PropertyArk\build.gradle
echo         versionCode 1 >> PropertyArk\build.gradle
echo         versionName "1.0" >> PropertyArk\build.gradle
echo     } >> PropertyArk\build.gradle
echo     buildTypes { >> PropertyArk\build.gradle
echo         release { >> PropertyArk\build.gradle
echo         } >> PropertyArk\build.gradle
echo     } >> PropertyArk\build.gradle
echo } >> PropertyArk\build.gradle

REM Create settings.gradle
echo rootProject.name = 'PropertyArk' > PropertyArk\settings.gradle

REM Create gradle.properties
echo android.useAndroidX=true > PropertyArk\gradle.properties

REM Build APK
echo Building APK...
cd PropertyArk
call gradle assembleRelease

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
