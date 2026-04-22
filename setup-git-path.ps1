# Setup Git PATH Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Setting up Git in PATH" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Common Git installation paths
$gitPaths = @(
    "C:\Program Files\Git\cmd",
    "C:\Program Files (x86)\Git\cmd",
    "$env:LOCALAPPDATA\Programs\Git\cmd",
    "$env:LOCALAPPDATA\GitHubDesktop\resources\app\git\cmd"
)

$gitFound = $false
foreach ($gitPath in $gitPaths) {
    if (Test-Path "$gitPath\git.exe") {
        Write-Host "Found Git at: $gitPath" -ForegroundColor Green
        $env:PATH += ";$gitPath"
        $gitFound = $true
        
        Write-Host ""
        Write-Host "Testing Git..." -ForegroundColor Yellow
        $version = & git --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Git is working: $version" -ForegroundColor Green
            Write-Host ""
            Write-Host "Git is now accessible in this terminal session!" -ForegroundColor Green
            Write-Host ""
            Write-Host "To make this permanent:" -ForegroundColor Yellow
            Write-Host "1. Press Win + X, select 'System'" -ForegroundColor White
            Write-Host "2. Click 'Advanced system settings'" -ForegroundColor White
            Write-Host "3. Click 'Environment Variables'" -ForegroundColor White
            Write-Host "4. Under 'User variables', select 'Path' and click 'Edit'" -ForegroundColor White
            Write-Host "5. Click 'New' and add: $gitPath" -ForegroundColor White
            Write-Host "6. Click OK on all dialogs" -ForegroundColor White
            Write-Host "7. Restart your terminal" -ForegroundColor White
            break
        }
    }
}

if (-not $gitFound) {
    Write-Host "Git not found in standard locations." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Git for Windows:" -ForegroundColor Yellow
    Write-Host "1. Download from: https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "2. During installation, select:" -ForegroundColor White
    Write-Host "   'Git from the command line and also from 3rd-party software'" -ForegroundColor Green
    Write-Host "3. Restart your terminal after installation" -ForegroundColor White
}

Write-Host ""

