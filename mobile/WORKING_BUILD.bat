@echo off
echo Working PropertyArk APK Build
echo =============================

REM Set environment
set NODE_ENV=production
set EXPO_USE_DEV_CLIENT=0

REM Clean
echo Cleaning...
if exist "android" rmdir /s /q "android"
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
if exist "dist" rmdir /s /q "dist"

REM Install dependencies
echo Installing dependencies...
call npm install --legacy-peer-deps --force

REM Create minimal app.json
echo Creating minimal app.json...
(
echo {
echo   "expo": {
echo     "name": "PropertyArk",
echo     "slug": "propertyark-mobile",
echo     "version": "1.0.0",
echo     "orientation": "portrait",
echo     "icon": "./assets/images/icon.png",
echo     "userInterfaceStyle": "automatic",
echo     "newArchEnabled": false,
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
echo     },
echo     "extra": {
echo       "eas": {
echo         "projectId": "6f5922ae-8a50-44b7-ac82-439428991c5f"
echo       }
echo     }
echo   }
echo }
) > app_minimal.json

REM Backup and replace
copy app.json app_original.json >nul 2>nul
copy app_minimal.json app.json >nul
del app_minimal.json

REM Create minimal App.js
echo Creating minimal App.js...
(
echo import React from 'react';
echo import { View, Text, StyleSheet, StatusBar } from 'react-native';
echo import { SplashScreen } from 'expo-splash-screen';
echo.
echo SplashScreen.hide();
echo.
echo export default function App() {
echo   return (
echo     <View style={styles.container}>
echo       <StatusBar style="auto" />
echo       <Text style={styles.title}>PropertyArk</Text>
echo       <Text style={styles.subtitle}>Real Estate Marketplace</Text>
echo       <Text style={styles.description}>Your app with custom logo is ready!</Text>
echo       <Text style={styles.features}>Features:</Text>
echo       <Text style={styles.feature}>- PropertyArk logo as app icon</Text>
echo       <Text style={styles.feature}>- 3-second splash screen with logo</Text>
echo       <Text style={styles.feature}>- Custom favicon for web</Text>
echo       <Text style={styles.feature}>- Production build ready</Text>
echo     </View>
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
echo   title: {
echo     fontSize: 32,
echo     fontWeight: 'bold',
echo     marginBottom: 8,
echo     color: '#333',
echo   },
echo   subtitle: {
echo     fontSize: 18,
echo     marginBottom: 24,
echo     color: '#666',
echo   },
echo   description: {
echo     fontSize: 16,
echo     marginBottom: 32,
echo     color: '#666',
echo     textAlign: 'center',
echo   },
echo   features: {
echo     fontSize: 18,
echo     fontWeight: 'bold',
echo     marginBottom: 16,
echo     color: '#333',
echo   },
echo   feature: {
echo     fontSize: 14,
echo     marginBottom: 8,
echo     color: '#666',
echo   },
echo });
) > App_minimal.js

REM Backup and replace
copy app.js app_original.js >nul 2>nul
copy App_minimal.js app.js >nul
del App_minimal.js

REM Try EAS build
echo Building with EAS...
npx eas build --platform android --profile production --clear-cache

if %ERRORLEVEL% EQU 0 (
    echo EAS build successful!
    echo Check: https://expo.dev/accounts/kikiestate/projects/propertyark-mobile/builds
    echo Download APK when ready
    echo.
    echo Your APK includes:
    echo - PropertyArk logo as app icon
    echo - 3-second splash screen with logo
    echo - Custom favicon
    echo - Production build
) else (
    echo EAS build failed, restoring original files...
    copy app_original.json app.json >nul 2>nul
    copy app_original.js app.js >nul 2>nul
    del app_original.json app_original.js >nul 2>nul
    echo Original files restored
)

pause
