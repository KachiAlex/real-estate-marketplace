# PowerShell script to convert Firebase service account JSON to single-line format
# Usage: .\convert-service-account.ps1 "path\to\your-service-account.json"

param(
    [Parameter(Mandatory=$true)]
    [string]$InputFile
)

Write-Host "Converting Firebase Service Account JSON to single-line format..." -ForegroundColor Cyan
Write-Host ""

# Check if file exists
if (-not (Test-Path $InputFile)) {
    Write-Host "❌ Error: File not found: $InputFile" -ForegroundColor Red
    exit 1
}

# Read the JSON file
Write-Host "Reading file: $InputFile" -ForegroundColor Yellow
$jsonContent = Get-Content $InputFile -Raw

# Validate JSON
try {
    $jsonObject = $jsonContent | ConvertFrom-Json
    Write-Host "✅ Valid JSON detected" -ForegroundColor Green
    Write-Host "   Project ID: $($jsonObject.project_id)" -ForegroundColor Gray
    Write-Host "   Client Email: $($jsonObject.client_email)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Error: Invalid JSON file" -ForegroundColor Red
    exit 1
}

# Convert to single line (remove line breaks and extra spaces)
$singleLine = $jsonContent -replace "`r`n", "" -replace "`n", "" -replace "\s+(?=([^""]*""[^""]*"")*[^""]*$)", ""

# Save to output file
$outputFile = "firebase-key-single-line.txt"
$singleLine | Set-Content $outputFile -NoNewline

Write-Host ""
Write-Host "✅ Conversion complete!" -ForegroundColor Green
Write-Host "   Output saved to: $outputFile" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Copy the content from $outputFile" -ForegroundColor White
Write-Host "2. Go to Google Cloud Run Console" -ForegroundColor White
Write-Host "3. Edit your service" -ForegroundColor White
Write-Host "4. Add environment variable: FIREBASE_SERVICE_ACCOUNT_KEY" -ForegroundColor White
Write-Host "5. Paste the single-line JSON as the value" -ForegroundColor White
Write-Host "6. Deploy" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  IMPORTANT: Keep this file secure. Do NOT commit to git!" -ForegroundColor Yellow

