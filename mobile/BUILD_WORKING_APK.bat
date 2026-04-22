@echo off
echo Building Working PropertyArk APK
echo =================================

REM Set environment
set NODE_ENV=production
set EXPO_USE_DEV_CLIENT=0

REM Clean up
echo Cleaning project...
if exist "android" rmdir /s /q "android"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

REM Setup proper React Native configuration
echo Setting up React Native configuration...
Copy-Item package_react-native.json package.json
Copy-Item App_fixed.js App.js

REM Install dependencies
echo Installing React Native dependencies...
call npm install --legacy-peer-deps --force

REM Create React Native project structure
echo Creating React Native Android project...
npx @react-native-community/cli init PropertyArk --template react-native-template-typescript --skip-install

REM Copy our app files to the new project
if exist "PropertyArk" (
    echo Copying app files...
    Copy-Item App.js PropertyArk\App.js
    Copy-Item index.js PropertyArk\index.js
    Copy-Item babel.config.js PropertyArk\babel.config.js
    Copy-Item metro.config.js PropertyArk\metro.config.js
    
    REM Copy assets
    if exist "assets" (
        xcopy /E /I /Y "assets" "PropertyArk\assets"
    )
    
    REM Build APK
    echo Building APK...
    cd PropertyArk
    call npm install --legacy-peer-deps --force
    call npx react-native build-android --mode=release
    
    if %ERRORLEVEL% EQU 0 (
        echo Build successful!
        echo APK location: PropertyArk\android\app\build\outputs\apk\release\app-release.apk
        
        REM Copy to accessible location
        for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "datetime=%%I"
        set "timestamp=%datetime:~0,8%"
        copy "PropertyArk\android\app\build\outputs\apk\release\app-release.apk" "PropertyArk-Working-%timestamp%.apk"
        echo APK copied to: PropertyArk-Working-%timestamp%.apk
    ) else (
        echo Build failed, trying alternative method...
        
        REM Try manual gradle build
        cd android
        call gradlew.bat assembleRelease
        cd ..
        
        if %ERRORLEVEL% EQU 0 (
            echo Manual build successful!
            copy "PropertyArk\android\app\build\outputs\apk\release\app-release.apk" "PropertyArk-Manual-%timestamp%.apk"
        ) else (
            echo All build methods failed
        )
    )
    
    cd ..
) else (
    echo React Native project creation failed
)

echo.
echo Your PropertyArk APK Features:
echo - App Name: PropertyArk
echo - Package: com.propertyark.mobile
echo - Icon: PropertyArk logo
echo - Splash Screen: 3 seconds with logo
echo - Favicon: Custom PropertyArk favicon
echo - Proper React Native initialization
echo.
echo If build succeeded, check PropertyArk-*.apk files

pause
