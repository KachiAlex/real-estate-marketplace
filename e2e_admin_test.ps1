$ErrorActionPreference = 'Stop'

try {
    Write-Output "== Register admin =="
    $adminBody = @{ email='ci.admin+test@example.com'; password='Password123!'; firstName='CI'; lastName='Admin'; role='admin' } | ConvertTo-Json
    $adminResp = Invoke-RestMethod -Uri 'http://localhost:5001/api/auth/register' -Method Post -ContentType 'application/json' -Body $adminBody -TimeoutSec 30
    Write-Output "ADMIN REGISTERED:"
    $adminResp | ConvertTo-Json -Depth 5

    Write-Output "\n== Register user =="
    $userBody = @{ email='ci.user+test@example.com'; password='Password123!'; firstName='CI'; lastName='User'; role='user' } | ConvertTo-Json
    $userResp = Invoke-RestMethod -Uri 'http://localhost:5001/api/auth/register' -Method Post -ContentType 'application/json' -Body $userBody -TimeoutSec 30
    Write-Output "USER REGISTERED:"
    $userResp | ConvertTo-Json -Depth 5

    Write-Output "\n== Create support inquiry as user =="
    $inquiryBody = @{ category='general'; message='E2E test support inquiry from CI user'; contactEmail='ci.user+test@example.com' } | ConvertTo-Json
    $hdrs = @{ Authorization = "Bearer $($userResp.accessToken)" }
    $inqResp = Invoke-RestMethod -Uri 'http://localhost:5001/api/support/inquiry' -Method Post -ContentType 'application/json' -Body $inquiryBody -Headers $hdrs -TimeoutSec 30
    Write-Output "INQUIRY CREATED:"
    $inqResp | ConvertTo-Json -Depth 5

    Write-Output "\n== Fetch admin inquiries =="
    $hdrsAdmin = @{ Authorization = "Bearer $($adminResp.accessToken)" }
    $adminInquiries = Invoke-RestMethod -Uri 'http://localhost:5001/api/admin/support/inquiries' -Method Get -Headers $hdrsAdmin -TimeoutSec 30
    Write-Output "ADMIN INQUIRIES:"
    $adminInquiries | ConvertTo-Json -Depth 6

} catch {
    Write-Output 'ERROR:'
    Write-Output $_.Exception.Message
    if ($_.Exception.Response) {
        try { $_.Exception.Response | Select-Object -ExpandProperty StatusCode } catch {}
        try { $_.Exception.Response.GetResponseStream() | % { [System.IO.StreamReader]::new($_).ReadToEnd() } } catch {}
    }
    exit 1
}
