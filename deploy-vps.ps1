# Property Ark - VPS Deployment Script
# Requires SSH key setup (run setup-vps-ssh.ps1 once first).
# Usage: .\deploy-vps.ps1 [-SkipBuild]
#   -SkipBuild: Skip local frontend build (use existing build/ folder)

param(
    [switch]$SkipBuild
)

$VPS_IP = "161.97.107.107"
$VPS_USER = "root"
$KEY_NAME = "propertyark_vps"
$SSH_PATH = "$env:USERPROFILE\.ssh\$KEY_NAME"
$REMOTE_USER_HOST = "${VPS_USER}@${VPS_IP}"
$REMOTE_APP_DIR = "/var/www/propertyark"
$PM2_PROCESS = "propertyark-api"
$DEPLOY_TARBALL = "deploy-package.tar.gz"

$SSH_OPTS = "-i $SSH_PATH -o StrictHostKeyChecking=no -o PasswordAuthentication=no"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Property Ark - VPS Deployment" -ForegroundColor Cyan
Write-Host "Server: $REMOTE_USER_HOST" -ForegroundColor Cyan
Write-Host "App dir: $REMOTE_APP_DIR" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Pre-flight checks ──────────────────────────────────────────────

if (-not (Test-Path $SSH_PATH)) {
    Write-Host "SSH key not found: $SSH_PATH" -ForegroundColor Red
    Write-Host "Please run setup-vps-ssh.ps1 first." -ForegroundColor Yellow
    exit 1
}

$sshCmd = Get-Command ssh -ErrorAction SilentlyContinue
if (-not $sshCmd) {
    Write-Host "OpenSSH client (ssh) is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Install it via Windows Settings > Apps > Optional features > OpenSSH Client" -ForegroundColor Yellow
    exit 1
}

# Test SSH connection
Write-Host "[1/7] Testing SSH connection..." -ForegroundColor Yellow
$testResult = ssh $SSH_OPTS $REMOTE_USER_HOST "echo 'SSH connection OK'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "SSH connection failed." -ForegroundColor Red
    Write-Host "If this is the first time, run setup-vps-ssh.ps1 to copy your SSH key." -ForegroundColor Yellow
    Write-Host "Error: $testResult" -ForegroundColor Red
    exit 1
}
Write-Host "  OK" -ForegroundColor Green

# ── Build frontend locally ──────────────────────────────────────────

if (-not $SkipBuild) {
    Write-Host ""
    Write-Host "[2/7] Building frontend..." -ForegroundColor Yellow
    & npx cross-env DISABLE_ESLINT_PLUGIN=true CI=false GENERATE_SOURCEMAP=false react-scripts build 2>&1 | Select-Object -Last 5
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Frontend build failed!" -ForegroundColor Red
        exit 1
    }
    Write-Host "  Build complete" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[2/7] Skipping frontend build (-SkipBuild)" -ForegroundColor DarkGray
}

# ── Create deployment tarball ───────────────────────────────────────

Write-Host ""
Write-Host "[3/7] Creating deployment tarball..." -ForegroundColor Yellow
if (Test-Path $DEPLOY_TARBALL) { Remove-Item $DEPLOY_TARBALL -Force }

tar -czf $DEPLOY_TARBALL `
    --exclude=node_modules --exclude=.git --exclude=mobile --exclude=android `
    --exclude=ios --exclude=cypress --exclude=api --exclude=packages `
    --exclude=backups --exclude=functions --exclude=azure-functions `
    --exclude=.devin --exclude=.kiro --exclude=.expo --exclude=.eas `
    --exclude=.vscode --exclude=docs --exclude=scripts `
    backend src public build package.json package-lock.json tailwind.config.js postcss.config.js 2>&1

if (-not (Test-Path $DEPLOY_TARBALL)) {
    Write-Host "Failed to create tarball!" -ForegroundColor Red
    exit 1
}
$sizeMB = [math]::Round((Get-Item $DEPLOY_TARBALL).Length / 1MB, 1)
Write-Host "  Tarball created: $sizeMB MB" -ForegroundColor Green

# ── Upload to VPS ───────────────────────────────────────────────────

Write-Host ""
Write-Host "[4/7] Uploading to VPS..." -ForegroundColor Yellow
scp $SSH_OPTS $DEPLOY_TARBALL "${REMOTE_USER_HOST}:/tmp/$DEPLOY_TARBALL"
if ($LASTEXITCODE -ne 0) {
    Write-Host "Upload failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Uploaded" -ForegroundColor Green

# ── Extract and install on VPS ──────────────────────────────────────

Write-Host ""
Write-Host "[5/7] Extracting and installing dependencies on VPS..." -ForegroundColor Yellow

$remoteCmd = @"
set -e
echo '  Backing up current deployment...'
TS=`$(date +%Y%m%d%H%M%S)
cp -r $REMOTE_APP_DIR/backend $REMOTE_APP_DIR/backend.bak.`${TS} 2>/dev/null || true
cp -r $REMOTE_APP_DIR/build $REMOTE_APP_DIR/build.bak.`${TS} 2>/dev/null || true

echo '  Extracting new code...'
cd $REMOTE_APP_DIR
tar -xzf /tmp/$DEPLOY_TARBALL

echo '  Installing dependencies...'
npm install --production 2>&1 | tail -5

echo '  Cleaning up...'
rm /tmp/$DEPLOY_TARBALL
"@

ssh $SSH_OPTS $REMOTE_USER_HOST $remoteCmd 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Extraction/install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  Dependencies installed" -ForegroundColor Green

# ── Restart PM2 ─────────────────────────────────────────────────────

Write-Host ""
Write-Host "[6/7] Restarting PM2 process..." -ForegroundColor Yellow
ssh $SSH_OPTS $REMOTE_USER_HOST "pm2 restart $PM2_PROCESS --update-env && sleep 3 && pm2 save" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "PM2 restart failed!" -ForegroundColor Red
    exit 1
}
Write-Host "  PM2 restarted and state saved" -ForegroundColor Green

# ── Verify deployment ───────────────────────────────────────────────

Write-Host ""
Write-Host "[7/7] Verifying deployment..." -ForegroundColor Yellow
$verifyResult = ssh $SSH_OPTS $REMOTE_USER_HOST "pm2 list && echo '---' && curl -s https://propertyark.africa/api/health && echo '' && curl -s -o /dev/null -w 'Frontend: %{http_code}' https://propertyark.africa/ && echo ''" 2>&1
Write-Host $verifyResult -ForegroundColor White

# ── Cleanup ─────────────────────────────────────────────────────────

Remove-Item $DEPLOY_TARBALL -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Site:   https://propertyark.africa" -ForegroundColor Cyan
Write-Host "API:    https://propertyark.africa/api/health" -ForegroundColor Cyan
Write-Host "PM2:    pm2 logs $PM2_PROCESS" -ForegroundColor Cyan
Write-Host ""
