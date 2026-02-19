<#
.SYNOPSIS
  Provision Azure resources and a Node‑18 Consumption Function App for `generateUploadSas`.

.DESCRIPTION
  Creates Resource Group (if missing), Storage account + container, and a Function App (Consumption, Node 18).
  Saves a publish profile you can copy into GitHub Actions secrets.

.PREREQS
  - Azure CLI installed and signed in (az login)
  - PowerShell (Windows)

.USAGE
  - Edit the variables below if you want different names, then run:
      .\scripts\create-azure-function.ps1

#>

param(
  [string]$ResourceGroup = "PropertyArk",
  [string]$Location = "canadacentral",
  [string]$FunctionAppName = "propertyarkfunctions",
  [string]$StorageBaseName = "propertyarkuploads",
  [string]$ContainerName = "uploads"
)

function AbortIfNoAz {
  if (-not (Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Error "Azure CLI (az) not found. Install from https://aka.ms/azcli and re-run this script."; exit 1
  }
}

function EnsureLoggedIn {
  try {
    az account show -o none 2>$null
  } catch {
    Write-Host "Not logged in to Azure CLI — opening browser for az login..." -ForegroundColor Yellow
    az login | Out-Null
  }
}

function Get-AvailableStorageName($base) {
  for ($i = 0; $i -lt 12; $i++) {
    $candidate = ($base + (Get-Random -Maximum 99999)).ToLower()
    $ok = az storage account check-name --name $candidate --query nameAvailable -o tsv 2>$null
    if ($ok -eq 'true') { return $candidate }
  }
  throw "Unable to generate an available storage account name from base '$base'"
}

# --- begin ---
AbortIfNoAz
EnsureLoggedIn

$sub = az account show --query "id" -o tsv
Write-Host "Using subscription: $sub" -ForegroundColor Cyan

Write-Host "Creating/ensuring resource group '$ResourceGroup' in $Location..." -ForegroundColor Cyan
az group create --name $ResourceGroup --location $Location | Out-Null

# pick a storage account name (must be globally unique)
$storageAccount = Get-AvailableStorageName $StorageBaseName
Write-Host "Creating storage account: $storageAccount" -ForegroundColor Cyan
az storage account create --name $storageAccount --resource-group $ResourceGroup --location $Location --sku Standard_LRS --kind StorageV2 | Out-Null

# get storage key
$storageKey = az storage account keys list --resource-group $ResourceGroup --account-name $storageAccount --query "[0].value" -o tsv
if (-not $storageKey) { Write-Error "Failed to retrieve storage account key."; exit 1 }

Write-Host "Creating blob container '$ContainerName' (private)..." -ForegroundColor Cyan
az storage container create --name $ContainerName --account-name $storageAccount --account-key $storageKey | Out-Null

# Create Function App (Consumption, Node 18)
Write-Host "Creating Function App '$FunctionAppName' (Consumption, Node 18)..." -ForegroundColor Cyan
$createResult = az functionapp create --resource-group $ResourceGroup --consumption-plan-location $Location --name $FunctionAppName --storage-account $storageAccount --runtime node --runtime-version 18 --os-type Linux 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Error "Function App creation failed:\n$createResult"; exit 1
}

# Configure app settings that the repo's function expects
Write-Host "Setting Function App application settings (storage account + container)..." -ForegroundColor Cyan
az functionapp config appsettings set --resource-group $ResourceGroup --name $FunctionAppName --settings AZURE_STORAGE_ACCOUNT_NAME=$storageAccount AZURE_STORAGE_ACCOUNT_KEY=$storageKey AZURE_BLOB_CONTAINER=$ContainerName | Out-Null

# Save publish profile (so you can add to GitHub Secrets)
$publishJsonPath = Join-Path -Path (Get-Location) -ChildPath "publishProfiles.json"
Write-Host "Saving Function App publishing profiles to: $publishJsonPath" -ForegroundColor Cyan
az functionapp deployment list-publishing-profiles -g $ResourceGroup -n $FunctionAppName -o json > $publishJsonPath

# Function URL may not exist until code is deployed — show host name instead
$hostname = az functionapp show -g $ResourceGroup -n $FunctionAppName --query defaultHostName -o tsv
Write-Host "Function App created: $FunctionAppName (host: $hostname)" -ForegroundColor Green

# Helpful next-step commands
Write-Host "\n--- Next steps ---" -ForegroundColor Yellow
Write-Host "1) Open '$publishJsonPath' and copy the publish profile XML into your GitHub secret named AZURE_FUNCTIONAPP_PUBLISH_PROFILE" -ForegroundColor White
Write-Host "2) Add GitHub Actions secret AZURE_FUNCTION_APP_NAME with value: $FunctionAppName" -ForegroundColor White
Write-Host "3) Push to main or run the Actions workflow '.github/workflows/deploy-azure-function.yml' to deploy the 'azure-functions/generateUploadSas' function." -ForegroundColor White
Write-Host "4) After CI deploy, get the function URL and add it to your backend host as AZURE_FUNCTION_URL:" -ForegroundColor White
Write-Host "   az functionapp function show -g $ResourceGroup -n $FunctionAppName --function-name generateUploadSas --query invokeUrlTemplate -o tsv" -ForegroundColor Gray

Write-Host "\nTo remove these resources later run:\n  az group delete -n $ResourceGroup --yes --no-wait" -ForegroundColor Magenta

Write-Host "Done." -ForegroundColor Green
