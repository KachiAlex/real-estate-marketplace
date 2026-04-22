$max = 8
for ($i=1; $i -le $max; $i++) {
  try {
    $r = Invoke-RestMethod -Uri 'http://localhost:5001/api/properties' -Method Get -TimeoutSec 20
    Write-Output "HTTP 200 on attempt $i"
    $r | ConvertTo-Json -Depth 8 | Write-Output
    break
  } catch {
    Write-Output "attempt $i failed: $($_.Exception.Message)"
    Start-Sleep -Seconds 1
  }
}
Write-Output '---- server.log tail ----'
Get-Content d:\\real-estate-marketplace\\backend\\server.log -Tail 400
