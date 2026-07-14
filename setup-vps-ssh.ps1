# Property Ark - VPS SSH Key Setup
# Run this ONCE to enable passwordless SSH login to the VPS.

$VPS_IP = "161.97.107.107"
$VPS_USER = "root"
$KEY_NAME = "propertyark_vps"
$SSH_DIR = "$env:USERPROFILE\.ssh"
$KEY_PATH = "$SSH_DIR\$KEY_NAME"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VPS SSH Key Setup" -ForegroundColor Cyan
Write-Host "Server: $VPS_USER@$VPS_IP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Ensure .ssh directory exists
if (-not (Test-Path $SSH_DIR)) {
    New-Item -ItemType Directory -Path $SSH_DIR -Force | Out-Null
    Write-Host "Created .ssh directory: $SSH_DIR" -ForegroundColor Green
}

# Generate SSH key if it doesn't exist
if (-not (Test-Path $KEY_PATH)) {
    Write-Host "Generating SSH key pair: $KEY_NAME ..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -C "propertyark-vps-deploy" -f $KEY_PATH -N '""'
    Write-Host "SSH key generated." -ForegroundColor Green
} else {
    Write-Host "SSH key already exists: $KEY_PATH" -ForegroundColor Green
}

# Copy public key to VPS (Windows-compatible, no ssh-copy-id required)
Write-Host ""
Write-Host "Copying public key to VPS. You will be prompted for the root password ONCE." -ForegroundColor Yellow

$pubKey = (Get-Content "$KEY_PATH.pub" -Raw).Trim()
$REMOTE_USER_HOST = "${VPS_USER}@${VPS_IP}"

ssh -o PasswordAuthentication=yes -o PubkeyAuthentication=no -o StrictHostKeyChecking=no $REMOTE_USER_HOST "mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo '$pubKey' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Public key copied successfully." -ForegroundColor Green

    # Test passwordless connection
    Write-Host ""
    Write-Host "Testing passwordless SSH connection..." -ForegroundColor Yellow
    $testResult = ssh -i "$KEY_PATH" -o StrictHostKeyChecking=no -o PasswordAuthentication=no $REMOTE_USER_HOST "echo 'Passwordless SSH OK'" 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host $testResult -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "SSH key setup complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "You can now run deploy-vps.ps1 without entering a password." -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "Passwordless SSH test failed." -ForegroundColor Red
        Write-Host "Error: $testResult" -ForegroundColor Red
    }
} else {
    Write-Host ""
    Write-Host "Failed to copy public key to VPS." -ForegroundColor Red
    Write-Host "Please check that the server is online and the password is correct." -ForegroundColor Yellow
}
