$env:DATABASE_URL = 'postgres://propertyark_user:oBphdzVn3C4eyBBIzoCKA4v8LUaWSdej@dpg-d61qns24d50c7380u57g-a/propertyark'
$env:DB_REQUIRE_SSL = 'true'
$env:DB_REJECT_UNAUTHORIZED = 'false'

Set-Location -Path $PSScriptRoot
Write-Host "Running repo migration scripts in $PSScriptRoot"

# Run idempotent JS migration scripts included in the repo
if (Test-Path -Path "migration\add_missing_user_columns.js") {
	Write-Host 'Running add_missing_user_columns.js'
	node migration\add_missing_user_columns.js
}

if (Test-Path -Path "migration\ensure_verified_enum.js") {
	Write-Host 'Running ensure_verified_enum.js'
	node migration\ensure_verified_enum.js
}

Write-Host 'Done running repo migration scripts'