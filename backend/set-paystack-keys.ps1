# PowerShell script to set Paystack environment variables for local development
$env:PAYSTACK_SECRET_KEY='sk_test_0bc8b42c70ec2955ac5d61a4b36f463ab47368fb'
$env:PAYSTACK_PUBLIC_KEY='pk_test_b03deeb7e613d20289b6523d13f9ad311602c2b3'
$env:NODE_ENV='development'
$env:USE_LOCAL_DB='true'

Write-Host "✅ Paystack environment variables set:" -ForegroundColor Green
Write-Host "PAYSTACK_SECRET_KEY: sk_test_..." -ForegroundColor Cyan
Write-Host "PAYSTACK_PUBLIC_KEY: pk_test_..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Now you can start the backend server with:" -ForegroundColor Yellow
Write-Host "npm start" -ForegroundColor White
