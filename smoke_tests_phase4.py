#!/usr/bin/env python3
"""
Phase 4 Smoke Tests
Validates all Phase 4 endpoints are functional
"""

import requests
import json
import sys
from urllib.parse import urljoin

BASE_URL = "http://localhost:5001"

tests_run = 0
tests_passed = 0
tests_failed = 0

def test_endpoint(name, method, path, expected_status=200):
    """Test a single endpoint"""
    global tests_run, tests_passed, tests_failed
    
    tests_run += 1
    url = urljoin(BASE_URL, path)
    
    print(f"\n[{tests_run}] Testing: {name}")
    print(f"    {method} {path}")
    
    try:
        if method == "GET":
            response = requests.get(url, timeout=5)
        elif method == "POST":
            response = requests.post(url, json={}, timeout=5)
        else:
            response = requests.request(method, url, timeout=5)
        
        if response.status_code == expected_status:
            print(f"    ✓ PASS (HTTP {response.status_code})")
            tests_passed += 1
        else:
            print(f"    ✗ FAIL (Expected {expected_status}, got {response.status_code})")
            tests_failed += 1
    except requests.exceptions.ConnectionError:
        print(f"    ✗ FAIL (Connection refused - server not running?)")
        tests_failed += 1
    except requests.exceptions.Timeout:
        print(f"    ✗ FAIL (Request timeout)")
        tests_failed += 1
    except Exception as e:
        print(f"    ✗ FAIL: {str(e)}")
        tests_failed += 1

print("\n" + "="*50)
print("Phase 4 Smoke Tests")
print("="*50)
print(f"Base URL: {BASE_URL}\n")

# Phase 4.1: Analytics
print("\nPHASE 4.1: Admin Analytics")
print("-" * 50)
test_endpoint("Analytics Dashboard", "GET", "/api/admin/analytics/dashboard", 200)
test_endpoint("Transaction Analytics", "GET", "/api/admin/analytics/transactions", 200)
test_endpoint("User Analytics", "GET", "/api/admin/analytics/users", 200)
test_endpoint("Property Analytics", "GET", "/api/admin/analytics/properties", 200)
test_endpoint("Revenue Analytics", "GET", "/api/admin/analytics/revenue", 200)
test_endpoint("Dispute Analytics", "GET", "/api/admin/analytics/disputes", 200)
test_endpoint("Engagement Metrics", "GET", "/api/admin/analytics/engagement", 200)

# Phase 4.2: Search
print("\n\nPHASE 4.2: Advanced Search")
print("-" * 50)
test_endpoint("Basic Search", "GET", "/api/search?q=property", 200)
test_endpoint("Advanced Search", "GET", "/api/search/advanced?location=downtown&minPrice=100000", 200)
test_endpoint("Autocomplete", "GET", "/api/search/autocomplete?q=pro", 200)
test_endpoint("Search Facets", "GET", "/api/search/facets", 200)
test_endpoint("Search Suggestions", "GET", "/api/search/suggestions?q=luxury", 200)
test_endpoint("Popular Searches", "GET", "/api/search/popular", 200)

# Phase 4.3: Notifications
print("\n\nPHASE 4.3: Notifications & Alerts")
print("-" * 50)
test_endpoint("Alerts Preferences", "GET", "/api/alerts-preferences/test-user", 200)
test_endpoint("Notification Channels", "GET", "/api/notifications/channels", 200)

# Phase 4.4: Chat
print("\n\nPHASE 4.4: Chat Enhancement")
print("-" * 50)
test_endpoint("Search Messages", "GET", "/api/chat/conversations/conv_test/search?q=test", 200)
test_endpoint("Get Conversations", "GET", "/api/chat/conversations", 200)

# Phase 4.5: Reviews
print("\n\nPHASE 4.5: Reviews & Ratings")
print("-" * 50)
test_endpoint("Property Rating", "GET", "/api/reviews/properties/prop_test/rating", 200)
test_endpoint("Property Reviews", "GET", "/api/reviews/properties/prop_test/reviews", 200)
test_endpoint("Trending Reviews", "GET", "/api/reviews/trending", 200)
test_endpoint("Verified Purchase", "GET", "/api/reviews/properties/prop_test/verified-purchase/user_test", 200)

# Summary
print("\n\n" + "="*50)
print("Smoke Test Summary")
print("="*50)
print(f"Tests Run:    {tests_run}")
print(f"Tests Passed: {tests_passed}")
print(f"Tests Failed: {tests_failed}")

if tests_run > 0:
    pass_rate = (tests_passed / tests_run) * 100
    print(f"Pass Rate:    {pass_rate:.2f}%")

print("\n")
if tests_failed == 0:
    print("✓ All smoke tests PASSED")
    sys.exit(0)
else:
    print("✗ Some tests FAILED - Review errors above")
    sys.exit(1)
