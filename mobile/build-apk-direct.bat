@echo off
echo Building PropertyArk APK - Direct Method
echo =========================================

REM Set environment variables
set NODE_ENV=production
set EXPO_USE_DEV_CLIENT=0
set EAS_SKIP_AUTO_FINGERPRINT=1

REM Clean previous builds
echo Cleaning previous builds...
if exist "android\build" rmdir /s /q "android\build"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

REM Install dependencies
echo Installing dependencies...
call npm install

REM Try EAS build with different approach
echo Attempting EAS build...
npx eas build --platform android --profile production --clear-cache

if %ERRORLEVEL% EQU 0 (
    echo EAS build successful!
    echo Check your email or Expo dashboard for the APK
    echo Dashboard: https://expo.dev/accounts/kikiestate/projects/propertyark-mobile/builds
) else (
    echo EAS build failed, trying alternative method...
    
    REM Try local build with different settings
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
            if exist "android\app\build\outputs\apk\release\app-release.apk" (
                for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "datetime=%%I"
                set "timestamp=%datetime:~0,8%"
                copy "android\app\build\outputs\apk\release\app-release.apk" "PropertyArk-%timestamp%.apk"
                echo APK copied to: PropertyArk-%timestamp%.apk
            )
        ) else (
            echo Local build also failed
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
echo If build failed, try using GitLab CI/CD or contact support

pause
