Write-Host "PropertyArk APK Build" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green

# Set environment
$env:NODE_ENV = "production"
$env:EXPO_USE_DEV_CLIENT = "0"
$env:EAS_SKIP_AUTO_FINGERPRINT = "1"

# Clean
Write-Host "Cleaning project..." -ForegroundColor Yellow
if (Test-Path "android") { Remove-Item -Recurse -Force "android" }
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps --force

# Try EAS build
Write-Host "Building with EAS..." -ForegroundColor Yellow
npx eas build --platform android --profile production --clear-cache

if ($LASTEXITCODE -eq 0) {
    Write-Host "EAS build successful!" -ForegroundColor Green
    Write-Host "Check: https://expo.dev/accounts/kikiestate/projects/propertyark-mobile/builds" -ForegroundColor Cyan
    Write-Host "Download APK when ready" -ForegroundColor Cyan
} else {
    Write-Host "EAS build failed, trying alternative methods..." -ForegroundColor Red
    
    # Try expo export
    Write-Host "Trying expo export..." -ForegroundColor Yellow
    npx expo export --platform android
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Export successful!" -ForegroundColor Green
        Write-Host "Check dist folder for APK" -ForegroundColor Cyan
    } else {
        Write-Host "All methods failed" -ForegroundColor Red
        Write-Host "Try using GitLab CI/CD or contact support" -ForegroundColor Red
    }
}

Write-Host "`nBuild Summary:" -ForegroundColor Cyan
Write-Host "- App Name: PropertyArk"
Write-Host "- Package: com.propertyark.mobile"
Write-Host "- Icon: PropertyArk logo"
Write-Host "- Splash Screen: 3 seconds with logo"
Write-Host "- Favicon: Custom PropertyArk favicon"

Read-Host "Press Enter to exit"
