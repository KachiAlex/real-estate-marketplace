# Property Ark - Firebase Deployment Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Property Ark - Firebase Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Add Node.js to PATH
$env:PATH += ";C:\Program Files\nodejs"

Write-Host "Step 1: Checking Firebase login..." -ForegroundColor Yellow
$checkLogin = & "C:\Program Files\nodejs\npx.cmd" firebase-tools projects:list 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "You need to login to Firebase first!" -ForegroundColor Red
    Write-Host "Opening Firebase login..." -ForegroundColor Yellow
    & "C:\Program Files\nodejs\npx.cmd" firebase-tools login
    Write-Host ""
    Write-Host "Please complete the login in your browser, then press any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Write-Host ""
Write-Host "Step 2: Deploying to Firebase Hosting..." -ForegroundColor Yellow
& "C:\Program Files\nodejs\npx.cmd" firebase-tools deploy --only hosting

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your Property Ark app should now be live!" -ForegroundColor Green
Write-Host ""

