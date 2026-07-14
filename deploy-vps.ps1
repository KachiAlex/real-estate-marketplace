# Property Ark - VPS Deployment Script
# Requires SSH key setup (run setup-vps-ssh.ps1 once first).

$VPS_IP = "161.97.107.107"
$VPS_USER = "root"
$KEY_NAME = "propertyark_vps"
$KEY_PATH = "$env:USERPROFILE\.ssh\$KEY_NAME"
$REMOTE_USER_HOST = "${VPS_USER}@${VPS_IP}"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Property Ark - VPS Deployment" -ForegroundColor Cyan
Write-Host "Server: $REMOTE_USER_HOST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if SSH key exists
if (-not (Test-Path $KEY_PATH)) {
    Write-Host "SSH key not found: $KEY_PATH" -ForegroundColor Red
    Write-Host "Please run setup-vps-ssh.ps1 first." -ForegroundColor Yellow
    exit 1
}

# Check if SSH is available
$sshCmd = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshCmd) {
    Write-Host "OpenSSH client (ssh) is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Install it via Windows Settings > Apps > Optional features > OpenSSH Client" -ForegroundColor Yellow
    exit 1
}

# Test SSH connection
Write-Host "Testing SSH connection..." -ForegroundColor Yellow
$testResult = ssh -i $KEY_PATH -o StrictHostKeyChecking=no -o PasswordAuthentication=no $REMOTE_USER_HOST "echo 'SSH connection OK'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "SSH connection failed." -ForegroundColor Red
    Write-Host "If this is the first time, run setup-vps-ssh.ps1 to copy your SSH key." -ForegroundColor Yellow
    Write-Host "Error: $testResult" -ForegroundColor Red
    exit 1
}

Write-Host $testResult -ForegroundColor Green
Write-Host ""

# Example deployment commands (customize as needed)

Write-Host "Step 1: Updating server packages..." -ForegroundColor Yellow
ssh -i $KEY_PATH -o StrictHostKeyChecking=no -o PasswordAuthentication=no $REMOTE_USER_HOST "apt-get update && apt-get upgrade -y"

Write-Host ""
Write-Host "Step 2: Checking server status..." -ForegroundColor Yellow
ssh -i $KEY_PATH -o StrictHostKeyChecking=no -o PasswordAuthentication=no $REMOTE_USER_HOST "uptime && df -h / && free -h"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "VPS deployment check complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "You can customize this script to:" -ForegroundColor Cyan
Write-Host "  - Sync backend files (scp / rsync)" -ForegroundColor Cyan
Write-Host "  - Restart services (nginx, pm2, docker)" -ForegroundColor Cyan
Write-Host "  - Run database migrations" -ForegroundColor Cyan
Write-Host ""
