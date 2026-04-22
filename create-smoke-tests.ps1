@"
# Phase 4 Smoke Tests

param([string]`$BaseUrl = "http://localhost:5001")

`$testsRun = 0
`$testsPassed = 0
`$testsFailed = 0

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Phase 4 Smoke Tests" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Base URL: `$BaseUrl" -ForegroundColor Cyan
Write-Host ""

function Test-Endpoint {
    param([string]`$Name, [string]`$Method, [string]`$Path, [int]`$ExpectedStatus = 200)
    
    `$script:testsRun++
    `$url = "`$BaseUrl`$Path"
    
    Write-Host "[`$testsRun] Testing: `$Name" -ForegroundColor Magenta
    Write-Host "  `$Method `$Path" -ForegroundColor Magenta

    try {
        `$response = Invoke-WebRequest -Uri `$url -Method `$Method -TimeoutSec 5 -ErrorAction Continue 2>$null
        
        if (`$response.StatusCode -eq `$ExpectedStatus) {
            Write-Host "  + PASS (HTTP `$(`$response.StatusCode))" -ForegroundColor Green
            `$script:testsPassed++
        } else {
            Write-Host "  - FAIL (Expected `$ExpectedStatus, got `$(`$response.StatusCode))" -ForegroundColor Red
            `$script:testsFailed++
        }
    }
    catch {
        Write-Host "  - FAIL: `$(`$_.Exception.Message)" -ForegroundColor Red
        `$script:testsFailed++
    }
}

Write-Host ""
Write-Host "PHASE 4.1: Admin Analytics" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

Test-Endpoint -Name "Analytics Dashboard" -Method GET -Path "/api/admin/analytics/dashboard"
Test-Endpoint -Name "Transaction Analytics" -Method GET -Path "/api/admin/analytics/transactions"
Test-Endpoint -Name "User Analytics" -Method GET -Path "/api/admin/analytics/users"
Test-Endpoint -Name "Property Analytics" -Method GET -Path "/api/admin/analytics/properties"
Test-Endpoint -Name "Revenue Analytics" -Method GET -Path "/api/admin/analytics/revenue"
Test-Endpoint -Name "Dispute Analytics" -Method GET -Path "/api/admin/analytics/disputes"
Test-Endpoint -Name "Engagement Metrics" -Method GET -Path "/api/admin/analytics/engagement"

Write-Host ""
Write-Host "PHASE 4.2: Advanced Search" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

Test-Endpoint -Name "Basic Search" -Method GET -Path "/api/search?q=property"
`$advPath = "/api/search/advanced?location=downtown&minPrice=100000"
Test-Endpoint -Name "Advanced Search" -Method GET -Path `$advPath
Test-Endpoint -Name "Autocomplete" -Method GET -Path "/api/search/autocomplete?q=pro"
Test-Endpoint -Name "Search Facets" -Method GET -Path "/api/search/facets"
Test-Endpoint -Name "Search Suggestions" -Method GET -Path "/api/search/suggestions?q=luxury"
Test-Endpoint -Name "Popular Searches" -Method GET -Path "/api/search/popular"

Write-Host ""
Write-Host "PHASE 4.3: Notifications" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

Test-Endpoint -Name "Alerts Preferences" -Method GET -Path "/api/alerts-preferences/test-user"
Test-Endpoint -Name "Notification Channels" -Method GET -Path "/api/notifications/channels"

Write-Host ""
Write-Host "PHASE 4.4: Chat Enhancement" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

Test-Endpoint -Name "Search Messages" -Method GET -Path "/api/chat/conversations/conv_test/search?q=test"
Test-Endpoint -Name "Get Conversations" -Method GET -Path "/api/chat/conversations"

Write-Host ""
Write-Host "PHASE 4.5: Reviews" -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Cyan

Test-Endpoint -Name "Property Rating" -Method GET -Path "/api/reviews/properties/prop_test/rating"
Test-Endpoint -Name "Property Reviews" -Method GET -Path "/api/reviews/properties/prop_test/reviews"
Test-Endpoint -Name "Trending Reviews" -Method GET -Path "/api/reviews/trending"
Test-Endpoint -Name "Verified Purchase" -Method GET -Path "/api/reviews/properties/prop_test/verified-purchase/user_test"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Summary" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Tests Run:    `$testsRun" -ForegroundColor Cyan
Write-Host "Tests Passed: `$testsPassed" -ForegroundColor Green
Write-Host "Tests Failed: `$testsFailed" -ForegroundColor Red
Write-Host ""
`$passRate = if (`$testsRun -gt 0) { [math]::Round((`$testsPassed / `$testsRun) * 100, 2) } else { 0 }
Write-Host "Pass Rate: `$passRate %" -ForegroundColor Cyan
"@ | Out-File "d:\real-estate-marketplace\smoke-tests-phase4.ps1" -Encoding UTF8
