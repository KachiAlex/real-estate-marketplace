try {
  $r = Invoke-RestMethod -Uri 'http://localhost:5001/api/properties' -Method Get -TimeoutSec 30
  Write-Output 'PROPERTIES HTTP 200'
  $r | ConvertTo-Json -Depth 10
} catch {
  Write-Output "PROPERTIES FAILED: $($_.Exception.Message)"
}
try {
  $u = Invoke-RestMethod -Uri 'http://localhost:5001/api/upload/vendor/kyc/signed' -Method Get -TimeoutSec 30
  Write-Output 'UPLOAD KYC HTTP 200'
  $u | ConvertTo-Json -Depth 10
} catch {
  Write-Output "UPLOAD KYC FAILED: $($_.Exception.Message)"
}
Write-Output '---- server.log tail ----'
Get-Content d:\real-estate-marketplace\backend\server.log -Tail 400
