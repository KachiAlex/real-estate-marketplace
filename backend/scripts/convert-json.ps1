# Simple script to convert Firebase service account JSON to single-line
# Place this script in the same folder as your JSON file, or provide full path

param(
    [string]$JsonFile = ".\real-estate-marketplace-37544-firebase-adminsdk-fbsvc-af4a0a8a16.json"
)

Write-Host "Converting Firebase Service Account JSON..." -ForegroundColor Cyan

# Check if file exists
if (-not (Test-Path $JsonFile)) {
    Write-Host "`n❌ File not found!" -ForegroundColor Red
    Write-Host "Please provide the full path to your JSON file:" -ForegroundColor Yellow
    Write-Host "Example: .\convert-json.ps1 'C:\Users\user\Downloads\real-estate-marketplace-37544-firebase-adminsdk-fbsvc-af4a0a8a16.json'" -ForegroundColor Gray
    exit 1
}

# Read and convert
$json = Get-Content $JsonFile -Raw -Encoding UTF8
$singleLine = $json -replace "`r`n", "" -replace "`n", "" -replace "`r", "" -replace "  +", " "

# Save output
$outputFile = "firebase-key-single-line.txt"
$singleLine | Set-Content $outputFile -NoNewline -Encoding UTF8

Write-Host "`n✅ Conversion complete!" -ForegroundColor Green
Write-Host "Output saved to: $((Get-Location).Path)\$outputFile" -ForegroundColor Yellow
Write-Host "`nThe single-line JSON is ready to paste into Google Cloud Run." -ForegroundColor Cyan
Write-Host "`n⚠️  Keep this file secure! Do NOT commit to git." -ForegroundColor Yellow

