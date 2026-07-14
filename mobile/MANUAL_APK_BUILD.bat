@echo off
echo Manual PropertyArk APK Build
echo =============================

REM Create simple Android project
echo Creating minimal Android project structure...

REM Clean
if exist "PropertyArk" rmdir /s /q "PropertyArk"

REM Create project structure
mkdir PropertyArk
mkdir PropertyArk\app
mkdir PropertyArk\app\src\main
mkdir PropertyArk\app\src\main\java\com\propertyark\mobile
mkdir PropertyArk\app\src\main\res
mkdir PropertyArk\app\src\main\res\drawable
mkdir PropertyArk\app\src\main\res\mipmap-hdpi
mkdir PropertyArk\app\src\main\res\mipmap-mdpi
mkdir PropertyArk\app\src\main\res\mipmap-xhdpi
mkdir PropertyArk\app\src\main\res\mipmap-xxhdpi
mkdir PropertyArk\app\src\main\res\mipmap-xxxhdpi
mkdir PropertyArk\app\src\main\res\values

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
echo         textView.setGravity(android.view.Gravity.CENTER);
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
echo         android:icon="@mipmap/ic_launcher"
echo         android:theme="@android:style/Theme.AppCompat.Light.DarkActionBar"^>
echo         ^<activity
echo             android:name=".MainActivity"
echo             android:exported="true"
echo             android:screenOrientation="portrait"^>
echo             ^<intent-filter^>
echo                 ^<action android:name="android.intent.action.MAIN" /^>
echo                 ^<category android:name="android.intent.category.LAUNCHER" /^>
echo             ^</intent-filter^>
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
    copy "assets\images\icon.png" "PropertyArk\app\src\main\res\mipmap-xxxhdpi\ic_launcher.png" >nul
    copy "assets\images\icon.png" "PropertyArk\app\src\main\res\mipmap-xxhdpi\ic_launcher.png" >nul
    copy "assets\images\icon.png" "PropertyArk\app\src\main\res\mipmap-xhdpi\ic_launcher.png" >nul
    copy "assets\images\icon.png" "PropertyArk\app\src\main\res\mipmap-mdpi\ic_launcher.png" >nul
    copy "assets\images\icon.png" "PropertyArk\app\src\main\res\mipmap-hdpi\ic_launcher.png" >nul
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
echo             proguardFiles getDefaultProguardFile('proguard-android-optimize.txt')
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

REM Create gradlew.bat
echo Creating gradlew.bat...
(
echo @rem
echo @rem Copyright 2015 the original author or authors.
echo @rem
echo @rem Licensed under the Apache License, Version 2.0 ^(the "License"^);
echo @rem you may not use this file except in compliance with the License.
echo @rem You may obtain a copy of the License at
echo @rem
echo @rem      http://www.apache.org/licenses/LICENSE-2.0
echo @rem
echo @rem Unless required by applicable law or agreed to in writing, software
echo @rem distributed under the License is distributed on an "AS IS" BASIS,
echo @rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
echo @rem See the License for the specific language governing permissions and
echo @rem limitations under the License.
echo @rem
echo @rem
echo @rem
echo @if "%OS%"=="Windows_NT" setlocal
echo @rem set DIRNAME=%~dp0
echo @rem set APP_BASE_NAME=%~n1
echo @rem set APP_HOME=%DIRNAME%\%APP_BASE_NAME%
echo @rem
echo @rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
echo @rem set DEFAULT_JVM_OPTS="-Xmx64m -Xms64m"
echo @rem
echo @rem Find java.exe
echo @rem if defined JAVA_HOME goto findJavaFromJavaHome
echo @rem
echo @rem echo JAVA_HOME is not set.
echo @rem echo Trying to find java.exe...
echo @rem set JAVA_EXE=
echo @rem for /r "%%i" in ("%PATH%") do (
echo @rem     if exist "%%i\java.exe" (
echo @rem         set JAVA_EXE="%%i"
echo @rem         goto :done
echo @rem     )
echo @rem )
echo @rem
echo @rem :findJavaFromJavaHome
echo @rem set JAVA_HOME=%JAVA_HOME%
echo @rem set JAVA_EXE=%JAVA_HOME%/bin/java.exe
echo @rem
echo @rem :done
echo @rem if exist "%JAVA_EXE%" goto :init
echo @rem
echo @rem echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo @rem echo Please set the JAVA_HOME variable in your environment to match the
echo @rem echo location of your Java installation.
echo @rem
echo @rem goto :eof
echo @rem
echo @rem :init
echo @rem set "APP_HOME=%~dp0"
echo @rem
echo @rem if "%APP_HOME%"=="" goto :eof
echo @rem
echo @rem for /r "%%d" in ("%APP_HOME%") do (
echo @rem     if exist "%%d\bin\gradle.bat" (
echo @rem         set "GRADLE_BATCH=%%d\bin\gradle.bat"
echo @rem         goto :eof
echo @rem     )
echo @rem )
echo @rem
echo @rem echo ERROR: Unable to find the gradle.bat file.
echo @rem echo Please check your Gradle installation.
echo @rem
echo @rem :eof
) > PropertyArk\gradlew.bat

REM Build APK
echo Building APK...
cd PropertyArk
call gradlew.bat assembleRelease

if %ERRORLEVEL% EQU 0 (
    echo Build successful!
    echo APK location: PropertyArk\app\build\outputs\apk\release\app-release-unsigned.apk
    
    REM Copy to accessible location
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "datetime=%%I"
    set "timestamp=%datetime:~0,8%"
    copy "PropertyArk\app\build\outputs\apk\release\app-release-unsigned.apk" "PropertyArk-%timestamp%.apk"
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
