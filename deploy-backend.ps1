# Property Ark - Backend Deployment Script for Google Cloud Run
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Property Ark - Backend Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
$gcloudPath = Get-Command gcloud -ErrorAction SilentlyContinue

if (-not $gcloudPath) {
    Write-Host "gcloud CLI is not installed or not in PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Google Cloud SDK:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Write-Host "2. Or use: winget install Google.CloudSDK" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternatively, you can deploy via Google Cloud Console:" -ForegroundColor Yellow
    Write-Host "1. Go to: https://console.cloud.google.com/run" -ForegroundColor Yellow
    Write-Host "2. Select your service: api-kzs3jdpe7a-uc" -ForegroundColor Yellow
    Write-Host "3. Click 'EDIT & DEPLOY NEW REVISION'" -ForegroundColor Yellow
    Write-Host "4. Connect to your repository or upload the code" -ForegroundColor Yellow
    Write-Host "5. Click 'DEPLOY'" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "Step 1: Checking gcloud authentication..." -ForegroundColor Yellow
$authCheck = gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>&1

if (-not $authCheck) {
    Write-Host ""
    Write-Host "You need to login to Google Cloud first!" -ForegroundColor Red
    Write-Host "Running: gcloud auth login" -ForegroundColor Yellow
    gcloud auth login
    Write-Host ""
}

Write-Host ""
Write-Host "Step 2: Setting project..." -ForegroundColor Yellow
gcloud config set project real-estate-marketplace-37544

Write-Host ""
Write-Host "Step 3: Deploying to Cloud Run..." -ForegroundColor Yellow
Write-Host "Service: api-kzs3jdpe7a-uc" -ForegroundColor Cyan
Write-Host "Region: us-central1" -ForegroundColor Cyan
Write-Host ""

# Deploy to Cloud Run from source
gcloud run deploy api-kzs3jdpe7a-uc `
    --source ./backend `
    --region us-central1 `
    --allow-unauthenticated `
    --port 5000

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "Deployment complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your backend API is now live at:" -ForegroundColor Green
    Write-Host "https://api-kzs3jdpe7a-uc.a.run.app" -ForegroundColor Cyan
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Deployment failed. Please check the errors above." -ForegroundColor Red
    Write-Host ""
}

