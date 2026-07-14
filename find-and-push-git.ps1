# Find Git and Push to GitHub
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Finding Git and Pushing Property Ark" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Search for Git in common locations
$gitPaths = @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files (x86)\Git\cmd\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
    "$env:LOCALAPPDATA\GitHubDesktop\resources\app\git\cmd\git.exe",
    "$env:ProgramFiles\Git\cmd\git.exe"
)

$gitExe = $null
foreach ($path in $gitPaths) {
    if (Test-Path $path) {
        $gitExe = $path
        Write-Host "Found Git at: $path" -ForegroundColor Green
        $gitDir = Split-Path (Split-Path $path) -Parent
        $env:PATH = "$gitDir\cmd;$env:PATH"
        break
    }
}

# If not found, try searching
if (-not $gitExe) {
    Write-Host "Searching for Git..." -ForegroundColor Yellow
    $foundGit = Get-ChildItem -Path "C:\Program Files" -Filter "git.exe" -Recurse -ErrorAction SilentlyContinue -Depth 3 | Select-Object -First 1
    if ($foundGit) {
        $gitExe = $foundGit.FullName
        Write-Host "Found Git at: $gitExe" -ForegroundColor Green
        $gitDir = Split-Path (Split-Path $gitExe) -Parent
        $env:PATH = "$gitDir\cmd;$env:PATH"
    }
}

# Test Git
try {
    $gitVersion = & git --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Git is working: $gitVersion" -ForegroundColor Green
        Write-Host ""
        
        # Change to project directory
        Set-Location "d:\real-estate-marketplace"
        
        Write-Host "Step 1: Checking status..." -ForegroundColor Cyan
        & git status
        
        Write-Host ""
        Write-Host "Step 2: Adding all changes..." -ForegroundColor Cyan
        & git add .
        
        Write-Host ""
        Write-Host "Step 3: Committing..." -ForegroundColor Cyan
        & git commit -m "Rebrand from Kiki Estates to Property Ark - Update all branding, components, and documentation"
        
        Write-Host ""
        Write-Host "Step 4: Pushing to GitHub..." -ForegroundColor Cyan
        & git push -u origin master
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Trying 'main' branch..." -ForegroundColor Yellow
            & git push -u origin main
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "Push complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    }
} catch {
    Write-Host ""
    Write-Host "ERROR: Git not found or not accessible!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "1. Install Git for Windows: https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "2. Use GitHub Desktop GUI to commit and push" -ForegroundColor White
    Write-Host "3. Restart your terminal after installing Git" -ForegroundColor White
}

