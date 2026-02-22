$endpoints = @( 'http://127.0.0.1:5001/api/health', 'http://127.0.0.1:5001/api/properties', 'http://127.0.0.1:5001/api/upload/vendor/kyc/signed' )
foreach ($u in $endpoints) {
    Write-Host '---' $u
    try {
        $r = Invoke-RestMethod -Uri $u -Method Get -TimeoutSec 15
        Write-Host 'HTTP 200 OK'
        $r | ConvertTo-Json -Depth 4 | Write-Host
    } catch {
        Write-Host 'ERROR:' ($_.Exception.Message)
        if ($_.Exception.Response) {
            $sr = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            Write-Host $sr.ReadToEnd()
        }
    }
}
