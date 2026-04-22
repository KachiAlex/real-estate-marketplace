@echo off
echo Quick PropertyArk APK Build
echo ==========================

REM Set environment
set NODE_ENV=production
set EXPO_USE_DEV_CLIENT=0

REM Clean
echo Cleaning...
if exist "android\build" rmdir /s /q "android\build"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

REM Install dependencies
echo Installing dependencies...
call npm install --legacy-peer-deps --force

REM Simple APK build approach
echo Building APK with Expo CLI...
npx expo export --platform android

if %ERRORLEVEL% EQU 0 (
    echo Export successful!
    echo APK should be in dist directory
    if exist "dist\android\*.apk" (
        for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "datetime=%%I"
        set "timestamp=%datetime:~0,8%"
        copy "dist\android\*.apk" "PropertyArk-%timestamp%.apk"
        echo APK copied to: PropertyArk-%timestamp%.apk
    )
) else (
    echo Export failed, trying alternative...
    
    REM Try direct Expo build
    echo Trying Expo build...
    npx expo build:android --type apk --release-channel production
    
    if %ERRORLEVEL% EQU 0 (
        echo Expo build successful!
        echo Check your email or Expo dashboard for APK
        echo Dashboard: https://expo.dev/accounts/kikiestate/projects/propertyark-mobile/builds
    ) else (
        echo All build methods failed
        echo Try using GitLab CI/CD or contact support
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
