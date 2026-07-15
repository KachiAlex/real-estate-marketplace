#!/bin/bash
# Test CSRF flow through Cloudflare (external URL)
echo "=== Step 1: Get CSRF token through Cloudflare ==="
RESPONSE=$(curl -s -c /tmp/csrf_cf_cookies.txt -D /tmp/csrf_cf_headers.txt https://www.propertyark.africa/api/csrf-token)
echo "Response: $RESPONSE"
echo ""
echo "Set-Cookie headers:"
grep -i "set-cookie" /tmp/csrf_cf_headers.txt
echo ""
echo "Cookie jar:"
cat /tmp/csrf_cf_cookies.txt
echo ""

# Extract token
TOKEN=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")
echo "Token: $TOKEN"
echo ""

echo "=== Step 2: POST with CSRF token and cookie through Cloudflare ==="
POST_RESULT=$(curl -s -b /tmp/csrf_cf_cookies.txt -X POST https://www.propertyark.africa/api/payments/initialize \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $TOKEN" \
  -d '{"amount":1000,"paymentMethod":"paystack"}' \
  -D /tmp/csrf_post_headers.txt \
  -w "\nHTTP Status: %{http_code}")
echo "POST result: $POST_RESULT"
echo ""
echo "Response headers:"
cat /tmp/csrf_post_headers.txt
