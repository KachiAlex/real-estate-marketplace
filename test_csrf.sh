#!/bin/bash
# Step 1: Get CSRF token and save cookies
RESPONSE=$(curl -s -k -c /tmp/csrf_cookies.txt https://localhost/api/csrf-token)
echo "CSRF token response: $RESPONSE"

# Extract token using python3
TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Extracted token: $TOKEN"

# Show cookies
echo "Cookies:"
cat /tmp/csrf_cookies.txt

# Step 2: Make POST with cookie and token
echo ""
echo "Making POST request..."
POST_RESULT=$(curl -s -k -b /tmp/csrf_cookies.txt -X POST https://localhost/api/payments/initialize \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{"amount":1000,"paymentMethod":"paystack"}' \
  -w "\nHTTP Status: %{http_code}")
echo "POST result: $POST_RESULT"
