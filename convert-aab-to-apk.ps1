Write-Host "AAB to APK Converter" -ForegroundColor Green
Write-Host "====================" -ForegroundColor Green

# Download bundletool
Write-Host "Downloading bundletool..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://github.com/google/bundletool/releases/latest/download/bundletool-all-1.15.6.jar" -OutFile "bundletool.jar"

# Check if AAB file exists
$aabFile = "app.aab"
if (-not (Test-Path $aabFile)) {
    Write-Host "Error: AAB file not found. Please download from EAS first." -ForegroundColor Red
    Write-Host "Go to: https://expo.dev/accounts/kikiestate/projects/propertyark-mobile/builds" -ForegroundColor Cyan
    Read-Host "Press Enter to exit"
    exit
}

# Convert AAB to APK
Write-Host "Converting AAB to APK..." -ForegroundColor Yellow
java -jar bundletool.jar build-apks --bundle=$aabFile --output=app.apks --mode=universal

# Extract APK
Write-Host "Extracting APK..." -ForegroundColor Yellow
if (Test-Path "app.apks") {
    Expand-Archive -Path "app.apks" -DestinationPath "extracted"
    
    # Find APK file
    $apkFile = Get-ChildItem -Path "extracted" -Filter "*.apk" | Select-Object -First 1
    
    if ($apkFile) {
        Copy-Item $apkFile.FullName -Destination "PropertyArk.apk"
        Write-Host "APK created: PropertyArk.apk" -ForegroundColor Green
        Write-Host "Location: $(Get-Location)" -ForegroundColor Cyan
        
        # Clean up
        Remove-Item -Recurse -Force "app.apks", "extracted", "bundletool.jar"
    } else {
        Write-Host "Error: APK file not found in extracted files" -ForegroundColor Red
    }
} else {
    Write-Host "Error: APK conversion failed" -ForegroundColor Red
}

Write-Host "`nConversion complete!" -ForegroundColor Green
Read-Host "Press Enter to exit"
