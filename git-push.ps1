# Git Push Script for Property Ark Rebranding
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Git Push - Property Ark Rebranding" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Try to find Git
$gitPaths = @(
    "C:\Program Files\Git\cmd\git.exe",
    "C:\Program Files (x86)\Git\cmd\git.exe",
    "$env:LOCALAPPDATA\Programs\Git\cmd\git.exe",
    "$env:ProgramFiles\Git\cmd\git.exe",
    "$env:ProgramFiles(x86)\Git\cmd\git.exe"
)

$gitExe = $null
foreach ($path in $gitPaths) {
    if (Test-Path $path) {
        $gitExe = $path
        Write-Host "Found Git at: $path" -ForegroundColor Green
        break
    }
}

if (-not $gitExe) {
    # Try to use git from PATH
    try {
        $gitCheck = Get-Command git -ErrorAction Stop
        $gitExe = "git"
        Write-Host "Found Git in PATH" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Git not found!" -ForegroundColor Red
        Write-Host "Please install Git for Windows from: https://git-scm.com/download/win" -ForegroundColor Yellow
        Write-Host "Or add Git to your PATH environment variable." -ForegroundColor Yellow
        exit 1
    }
}

# Function to run git commands
function Run-Git {
    param([string]$command)
    Write-Host "Running: git $command" -ForegroundColor Yellow
    if ($gitExe -eq "git") {
        & git $command.Split(' ')
    } else {
        & $gitExe $command.Split(' ')
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error running git command!" -ForegroundColor Red
        exit 1
    }
}

# Change to project directory
Set-Location "d:\real-estate-marketplace"

Write-Host "Step 1: Checking git status..." -ForegroundColor Cyan
Run-Git "status"

Write-Host ""
Write-Host "Step 2: Adding all changes..." -ForegroundColor Cyan
Run-Git "add ."

Write-Host ""
Write-Host "Step 3: Committing changes..." -ForegroundColor Cyan
Run-Git "commit -m `"Rebrand from Kiki Estates to Property Ark - Update all branding, components, and documentation`""

Write-Host ""
Write-Host "Step 4: Setting remote if needed..." -ForegroundColor Cyan
$remoteCheck = Run-Git "remote get-url origin" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Adding remote origin..." -ForegroundColor Yellow
    Run-Git "remote add origin https://github.com/KachiAlex/real-estate-marketplace.git"
} else {
    Write-Host "Remote already configured: $remoteCheck" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 5: Pushing to remote..." -ForegroundColor Cyan
Run-Git "push -u origin main"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Git push complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

