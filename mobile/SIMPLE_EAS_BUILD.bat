@echo off
echo Simple PropertyArk APK Build
echo ==========================

REM Set environment variables to suppress warnings
set NODE_ENV=production
set EXPO_USE_DEV_CLIENT=0
set NPM_CONFIG_LEGACY_PEER_DEPS=true
set EAS_BUILD_NO_CACHE=1
set EAS_BUILD_NO_EXPO_GO_WARNING=1
set EAS_SKIP_AUTO_FINGERPRINT=1

REM Clean project
echo Cleaning project...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
if exist "android\build" rmdir /s /q "android\build"

REM Install dependencies
echo Installing dependencies...
call npm install --legacy-peer-deps --force

REM Try EAS build with preview profile (less strict)
echo Starting EAS build with preview profile...
npx eas build --platform android --profile preview --clear-cache

if %ERRORLEVEL% EQU 0 (
    echo EAS build successful!
    echo Check: https://expo.dev/accounts/kikiestate/projects/propertyark-mobile/builds
    echo Download APK when ready
) else (
    echo EAS build failed, trying local build...
    
    REM Try local build
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
echo Build Summary:
echo - App Name: PropertyArk
echo - Package: com.propertyark.mobile
echo - Icon: PropertyArk logo configured
echo - Splash Screen: 3 seconds with logo
echo - Favicon: Custom PropertyArk favicon
echo.
echo If build succeeded, check the locations above for your APK
echo If build failed, try the alternative methods in the documentation

pause
