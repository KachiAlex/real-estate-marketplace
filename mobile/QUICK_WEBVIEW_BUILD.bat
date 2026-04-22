@echo off
echo Quick PropertyArk WebView Build
echo ==============================

REM Check if Android Studio is installed
if exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" (
    echo Android Studio found - using Gradle from Android Studio
    set GRADLE_HOME=C:\Program Files\Android\Android Studio\gradle\gradle-8.0
    set PATH=%GRADLE_HOME%\bin;%PATH%
) else (
    echo Android Studio not found - trying system Gradle
)

REM Create simplified project structure
echo Creating project structure...
if exist "QuickWebView" rmdir /s /q "QuickWebView"
mkdir QuickWebView
mkdir QuickWebView\app
mkdir QuickWebView\app\src\main
mkdir QuickWebView\app\src\main\java\com\propertyark\mobile
mkdir QuickWebView\app\src\main\res\values

REM Create minimal MainActivity
echo Creating MainActivity.java...
(
echo package com.propertyark.mobile;
echo.
echo import android.app.Activity;
echo import android.os.Bundle;
echo import android.webkit.WebView;
echo import android.webkit.WebViewClient;
echo import android.webkit.WebSettings;
echo.
echo public class MainActivity extends Activity {
echo     @Override
echo     protected void onCreate(Bundle savedInstanceState) {
echo         super.onCreate(savedInstanceState);
echo         
echo         WebView webView = new WebView(this);
echo         setContentView(webView);
echo         
echo         WebSettings webSettings = webView.getSettings();
echo         webSettings.setJavaScriptEnabled(true);
echo         webSettings.setDomStorageEnabled(true);
echo         
echo         webView.setWebViewClient(new WebViewClient() {
echo             @Override
echo             public void onPageFinished(WebView view, String url) {
echo                 super.onPageFinished(view, url);
echo             }
echo         });
echo         
echo         webView.loadUrl("https://propertyark.com");
echo     }
echo }
) > QuickWebView\app\src\main\java\com\propertyark\mobile\MainActivity.java

REM Create minimal AndroidManifest
echo Creating AndroidManifest.xml...
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<manifest xmlns:android="http://schemas.android.com/apk/res/android"
echo     package="com.propertyark.mobile"
echo     android:versionCode="1"
echo     android:versionName="1.0"^>
echo     
echo     ^<uses-permission android:name="android.permission.INTERNET" /^>
echo     ^<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" /^>
echo     
echo     ^<application
echo         android:label="PropertyArk"
echo         android:icon="@mipmap/ic_launcher"
echo         android:usesCleartextTraffic="true"^>
echo         
echo         ^<activity
echo             android:name=".MainActivity"
echo             android:exported="true"^>
echo             
echo             ^<intent-filter^>
echo                 ^<action android:name="android.intent.action.MAIN" /^>
echo                 ^<category android:name="android.intent.category.LAUNCHER" /^>
echo             ^</intent-filter^>
echo         ^</activity^>
echo     ^</application^>
echo ^</manifest^>
) > QuickWebView\app\src\main\AndroidManifest.xml

REM Create strings
echo Creating strings.xml...
(
echo ^<?xml version="1.0" encoding="utf-8"?^>
echo ^<resources^>
echo     ^<string name="app_name"^>PropertyArk^</string^>
echo ^</resources^>
) > QuickWebView\app\src\main\res\values\strings.xml

REM Copy PropertyArk logo
echo Copying PropertyArk logo...
if exist "assets\images\icon.png" (
    copy "assets\images\icon.png" "QuickWebView\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png"
    echo Logo copied
) else (
    echo Warning: Logo not found
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
echo             minifyEnabled false
echo         }
echo     }
echo }
) > QuickWebView\app\build.gradle

REM Create settings.gradle
echo Creating settings.gradle...
echo rootProject.name = 'PropertyArk' > QuickWebView\settings.gradle

REM Try to build with Android Studio Gradle
echo Attempting build...
cd QuickWebView

REM Try different Gradle locations
if exist "C:\Program Files\Android\Android Studio\gradle\gradle-8.0\bin\gradle.bat" (
    call "C:\Program Files\Android\Android Studio\gradle\gradle-8.0\bin\gradle.bat" assembleRelease
) else if exist "C:\Program Files\Android\Android Studio\gradle\gradle-7.5\bin\gradle.bat" (
    call "C:\Program Files\Android\Android Studio\gradle\gradle-7.5\bin\gradle.bat" assembleRelease
) else if exist "%USERPROFILE%\AppData\Local\Android\Sdk\tools\gradle" (
    set PATH=%USERPROFILE%\AppData\Local\Android\Sdk\tools\gradle\bin;%PATH%
    gradle assembleRelease
) else (
    echo Gradle not found in standard locations
    echo.
    echo SOLUTION OPTIONS:
    echo 1. Install Android Studio
    echo 2. Download Gradle manually
    echo 3. Use online APK builder
    echo.
    echo ONLINE BUILDER: https://app.buildship.io/
    echo.
    echo PROJECT FILES READY AT: QuickWebView\
    echo You can open in Android Studio to build
)

if %ERRORLEVEL% EQU 0 (
    echo Build successful!
    copy "QuickWebView\app\build\outputs\apk\release\app-release.apk" "PropertyArk-Quick.apk"
    echo APK created: PropertyArk-Quick.apk
)

cd ..

echo.
echo Your PropertyArk WebView Setup:
echo - Package: com.propertyark.mobile
echo - Internet: Enabled
echo - JavaScript: Enabled
echo - HTTP Support: Enabled
echo - Logo: PropertyArk
echo.
echo If build failed, use Android Studio to build QuickWebView project

pause
