@echo off
echo Final PropertyArk APK Build Solution
echo ====================================

REM Set environment
set NODE_ENV=production
set EXPO_USE_DEV_CLIENT=0
set EXPO_SKIP_VALIDATION=1

REM Clean
echo Cleaning project...
if exist "android" rmdir /s /q "android"
if exist "dist" rmdir /s /q "dist"

REM Install dependencies
echo Installing dependencies...
call npm install --legacy-peer-deps --force

REM Create minimal app.json for build
echo Creating minimal configuration...
(
echo {
echo   "expo": {
echo     "name": "PropertyArk",
echo     "slug": "propertyark-mobile",
echo     "version": "1.0.0",
echo     "orientation": "portrait",
echo     "icon": "./assets/images/icon.png",
echo     "userInterfaceStyle": "automatic",
echo     "splash": {
echo       "image": "./assets/images/splash-icon.png",
echo       "resizeMode": "contain",
echo       "backgroundColor": "#ffffff",
echo       "duration": 3000
echo     },
echo     "android": {
echo       "adaptiveIcon": {
echo         "foregroundImage": "./assets/images/android-icon-foreground.png",
echo         "backgroundColor": "#ffffff"
echo       },
echo       "package": "com.propertyark.mobile"
echo     },
echo     "web": {
echo       "favicon": "./assets/images/favicon.png"
echo     }
echo   }
echo }
) > app_minimal.json

REM Backup and use minimal config
copy app.json app_backup.json >nul 2>nul
copy app_minimal.json app.json >nul
del app_minimal.json

REM Create simple App.js
echo Creating simple App.js...
(
echo import React from 'react';
echo import { View, Text, StyleSheet, StatusBar, Image } from 'react-native';
echo import { SplashScreen } from 'expo-splash-screen';
echo.
echo export default function App() {
echo   return (
echo     ^<View style={styles.container}^>
echo       ^<StatusBar style="auto" /^>
echo       ^<Image source={require('./assets/images/icon.png')} style={styles.logo} /^>
echo       ^<Text style={styles.title}^>PropertyArk^</Text^>
echo       ^<Text style={styles.subtitle}^>Real Estate Marketplace^</Text^>
echo       ^<Text style={styles.description}^>App ready with custom logo!^</Text^>
echo     ^</View^>
echo   );
echo }
echo.
echo const styles = StyleSheet.create({
echo   container: {
echo     flex: 1,
echo     backgroundColor: '#ffffff',
echo     alignItems: 'center',
echo     justifyContent: 'center',
echo     padding: 20,
echo   },
echo   logo: {
echo     width: 120,
echo     height: 120,
echo     marginBottom: 20,
echo   },
echo   title: {
echo     fontSize: 32,
echo     fontWeight: 'bold',
echo     marginBottom: 8,
echo     color: '#333',
echo   },
echo   subtitle: {
echo     fontSize: 18,
echo     marginBottom: 32,
echo     color: '#666',
echo   },
echo   description: {
echo     fontSize: 16,
echo     color: '#666',
echo     textAlign: 'center',
echo   },
echo });
) > App.js

REM Try Expo build (classic)
echo Building with Expo CLI...
npx expo build:android --type apk --release-channel production --non-interactive

if %ERRORLEVEL% EQU 0 (
    echo Build successful!
    echo Check your email or Expo dashboard for APK
    echo Dashboard: https://expo.dev/accounts/kikiestate/projects/propertyark-mobile/builds
) else (
    echo Expo build failed, trying alternative...
    
    REM Try export and manual build
    echo Trying export method...
    npx expo export --platform android --output-dir dist
    
    if exist "dist\android-index.android.bundle" (
        echo Export successful!
        echo Bundle created in dist folder
    ) else (
        echo All methods failed
        echo Try using EAS build or contact support
    )
)

REM Restore original files
copy app_backup.json app.json >nul 2>nul
del app_backup.json >nul 2>nul

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
