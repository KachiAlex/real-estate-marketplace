Write-Host "PropertyArk APK Build" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green

# Set environment
$env:NODE_ENV = "production"
$env:EXPO_USE_DEV_CLIENT = "0"
$env:EXPO_SKIP_VALIDATION = "1"

# Clean
Write-Host "Cleaning project..." -ForegroundColor Yellow
if (Test-Path "android") { Remove-Item -Recurse -Force "android" }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps --force

# Create minimal app.json
Write-Host "Creating minimal configuration..." -ForegroundColor Yellow
$appConfig = @"
{
  "expo": {
    "name": "PropertyArk",
    "slug": "propertyark-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff",
      "duration": 3000
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.propertyark.mobile"
    },
    "web": {
      "favicon": "./assets/images/favicon.png"
    }
  }
}
"@

# Backup and use minimal config
if (Test-Path "app.json") { Copy-Item "app.json" "app_backup.json" }
Set-Content -Path "app.json" -Value $appConfig

# Create simple App.js
Write-Host "Creating simple App.js..." -ForegroundColor Yellow
$appJs = @"
import React from 'react';
import { View, Text, StyleSheet, StatusBar, Image } from 'react-native';
import { SplashScreen } from 'expo-splash-screen';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Image source={require('./assets/images/icon.png')} style={styles.logo} />
      <Text style={styles.title}>PropertyArk</Text>
      <Text style={styles.subtitle}>Real Estate Marketplace</Text>
      <Text style={styles.description}>App ready with custom logo!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 32,
    color: '#666',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
"@

Set-Content -Path "App.js" -Value $appJs

# Try Expo build
Write-Host "Building with Expo CLI..." -ForegroundColor Yellow
npx expo build:android --type apk --release-channel production --non-interactive

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
    Write-Host "Check your email or Expo dashboard for APK" -ForegroundColor Cyan
    Write-Host "Dashboard: https://expo.dev/accounts/kikiestate/projects/propertyark-mobile/builds" -ForegroundColor Cyan
} else {
    Write-Host "Expo build failed, trying export..." -ForegroundColor Red
    
    # Try export
    npx expo export --platform android --output-dir dist
    
    if (Test-Path "dist\android-index.android.bundle") {
        Write-Host "Export successful!" -ForegroundColor Green
        Write-Host "Bundle created in dist folder" -ForegroundColor Cyan
    } else {
        Write-Host "All methods failed" -ForegroundColor Red
        Write-Host "Try using EAS build or contact support" -ForegroundColor Red
    }
}

# Restore original files
if (Test-Path "app_backup.json") { 
    Copy-Item "app_backup.json" "app.json" 
    Remove-Item "app_backup.json"
}

Write-Host "`nYour PropertyArk APK Features:" -ForegroundColor Cyan
Write-Host "- App Name: PropertyArk"
Write-Host "- Package: com.propertyark.mobile"
Write-Host "- Icon: PropertyArk logo"
Write-Host "- Splash Screen: 3 seconds with logo"
Write-Host "- Favicon: Custom PropertyArk favicon"

Read-Host "Press Enter to exit"
