Write-Output 'Starting smoke requests and capturing server.log tail';
try { $h = Invoke-RestMethod -Uri 'http://localhost:5001/api/health' -Method Get -TimeoutSec 15; Write-Output "HEALTH: $($h | ConvertTo-Json -Depth 5)" } catch { Write-Output "HEALTH request failed: $($_.Exception.Message)" }
try { $p = Invoke-RestMethod -Uri 'http://localhost:5001/api/properties' -Method Get -TimeoutSec 30; Write-Output "PROPERTIES: $($p | ConvertTo-Json -Depth 6)" } catch { Write-Output "PROPERTIES request failed: $($_.Exception.Message)" }
try { $u = Invoke-RestMethod -Uri 'http://localhost:5001/api/upload/vendor/kyc/signed' -Method Get -TimeoutSec 30; Write-Output "UPLOAD: $($u | ConvertTo-Json -Depth 6)" } catch { Write-Output "UPLOAD request failed: $($_.Exception.Message)" }
Write-Output '---- server.log tail ----'
Get-Content d:\real-estate-marketplace\backend\server.log -Tail 400
