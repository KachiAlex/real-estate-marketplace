@echo off
echo Offline PropertyArk APK Build
echo ==============================

REM Set environment
set NODE_ENV=production
set EXPO_USE_DEV_CLIENT=0

REM Clean
echo Cleaning project...
if exist "android" rmdir /s /q "android"
if exist "dist" rmdir /s /q "dist"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

REM Install dependencies
echo Installing dependencies...
call npm install --legacy-peer-deps --force

REM Classic Expo build (offline)
echo Building APK with Expo CLI...
npx expo build:android --type apk --release-channel production --non-interactive

if %ERRORLEVEL% EQU 0 (
    echo Build successful!
    echo APK should be in the build output
    echo Check the Expo dashboard for download link
    echo Dashboard: https://expo.dev/accounts/kikiestate/projects/propertyark-mobile/builds
) else (
    echo Expo build failed, trying alternative...
    
    REM Try local Gradle build
    echo Trying local build...
    npx expo prebuild --platform android --clean --non-interactive
    
    if %ERRORLEVEL% EQU 0 (
        echo Prebuild successful, building APK...
        cd android
        call gradlew.bat assembleRelease
        cd ..
        
        if %ERRORLEVEL% EQU 0 (
            echo Local build successful!
            echo APK location: android\app\build\outputs\apk\release\app-release.apk
            
            REM Copy to accessible location
            for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "datetime=%%I"
            set "timestamp=%datetime:~0,8%"
            copy "android\app\build\outputs\apk\release\app-release.apk" "PropertyArk-%timestamp%.apk"
            echo APK copied to: PropertyArk-%timestamp%.apk
        ) else (
            echo Local build failed
        )
    ) else (
        echo Prebuild failed
    )
)

echo.
echo Your PropertyArk APK Features:
echo - App Name: PropertyArk
echo - Package: com.propertyark.mobile
echo - Icon: PropertyArk logo
echo - Splash Screen: 3 seconds with logo
echo - Favicon: Custom PropertyArk favicon
echo.
echo If build succeeded, check the locations above for your APK

pause
