# Git Connect and Push Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Connecting to Git and Pushing Property Ark" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Try to add Git to PATH
$env:PATH += ";C:\Program Files\Git\cmd;C:\Program Files\Git\bin"

# Change to project directory
Set-Location "d:\real-estate-marketplace"

# Check Git
try {
    $gitVersion = & git --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Git is working: $gitVersion" -ForegroundColor Green
        Write-Host ""
        
        # Check remote
        Write-Host "Step 1: Checking remote configuration..." -ForegroundColor Cyan
        $remote = & git remote get-url origin 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Remote configured: $remote" -ForegroundColor Green
        } else {
            Write-Host "Setting remote to GitHub..." -ForegroundColor Yellow
            & git remote add origin https://github.com/KachiAlex/real-estate-marketplace.git
        }
        
        Write-Host ""
        Write-Host "Step 2: Checking git status..." -ForegroundColor Cyan
        & git status
        
        Write-Host ""
        Write-Host "Step 3: Adding all changes..." -ForegroundColor Cyan
        & git add .
        
        Write-Host ""
        Write-Host "Step 4: Committing changes..." -ForegroundColor Cyan
        & git commit -m "Rebrand from Kiki Estates to Property Ark - Update all branding, components, and documentation"
        
        Write-Host ""
        Write-Host "Step 5: Pushing to GitHub..." -ForegroundColor Cyan
        & git push -u origin master
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Trying 'main' branch..." -ForegroundColor Yellow
            & git push -u origin main
        }
        
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your Property Ark rebranding is now on GitHub:" -ForegroundColor Cyan
        Write-Host "https://github.com/KachiAlex/real-estate-marketplace" -ForegroundColor White
        
    } else {
        Write-Host "Git is not accessible. Please:" -ForegroundColor Red
        Write-Host "1. Restart your terminal (close and reopen)" -ForegroundColor Yellow
        Write-Host "2. Or run: `$env:PATH += ';C:\Program Files\Git\cmd'" -ForegroundColor Yellow
        Write-Host "3. Then run this script again" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Git command failed. Please restart your terminal and try again." -ForegroundColor Red
}

Write-Host ""

