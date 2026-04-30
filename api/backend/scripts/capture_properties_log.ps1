try {
  $r = Invoke-RestMethod -Uri 'http://localhost:5001/api/properties' -Method Get -TimeoutSec 30
  Write-Output 'HTTP 200'
  $r | ConvertTo-Json -Depth 10
} catch {
  Write-Output "Request failed: $($_.Exception.Message)"
}
Write-Output '---- server.log tail ----'
Get-Content d:\\real-estate-marketplace\\backend\\server.log -Tail 400
