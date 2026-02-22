$max=60
for ($i=0;$i -lt $max;$i++) {
    try {
        docker version > $null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host 'docker-ready'
            exit 0
        }
    } catch {}
    Start-Sleep -Seconds 2
    Write-Host "waiting for docker... $((($i+1)*2))s elapsed"
}
Write-Host 'docker-timeout'
exit 1
