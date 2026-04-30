Write-Output 'Reproducing /api/properties with verbose output';
try {
  $r = Invoke-RestMethod -Uri 'http://localhost:5001/api/properties' -Method Get -TimeoutSec 60
  Write-Output 'HTTP 200'
  $r | ConvertTo-Json -Depth 8 | Write-Output
} catch {
  Write-Output 'REQUEST ERROR:'
  $_.Exception | Format-List -Force | Write-Output
}
Write-Output '---- server.log tail ----'
Get-Content d:\\real-estate-marketplace\\backend\\server.log -Tail 600 | Write-Output
