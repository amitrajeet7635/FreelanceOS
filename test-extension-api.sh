#!/bin/bash
# Test Extension API Routes

API_KEY="${1:-}"
FREELANCE_OS_URL="${2:-http://localhost:3000}"

if [ -z "$API_KEY" ]; then
  echo "Usage: ./test-extension-api.sh <api-key> [freelance-os-url]"
  echo ""
  echo "Example: ./test-extension-api.sh 0SpKduIPhlcMMsedO7lQAe955n7vwZ45wJARrJfb"
  exit 1
fi

echo "Testing Extension API Routes"
echo "=============================="
echo "API Key: ${API_KEY:0:10}..."
echo "URL: $FREELANCE_OS_URL"
echo ""

# Test 1: Ping endpoint
echo "1. Testing /api/ext/ping..."
PING_RESPONSE=$(curl -s -X GET \
  -H "Authorization: Bearer $API_KEY" \
  "$FREELANCE_OS_URL/api/ext/ping")

echo "Response: $PING_RESPONSE"
echo ""

# Test 2: Add lead endpoint
echo "2. Testing /api/ext/add-lead..."
ADD_LEAD_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "username": "test_instagram_user",
    "followers": "1.2K",
    "notes": "Test lead from API",
    "profileUrl": "https://instagram.com/test_instagram_user",
    "hasWebsite": "yes",
    "niche": "Fitness/Gym"
  }' \
  "$FREELANCE_OS_URL/api/ext/add-lead")

echo "Response: $ADD_LEAD_RESPONSE"
echo ""

# Test 3: Add duplicate lead
echo "3. Testing duplicate detection..."
DUPLICATE_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $API_KEY" \
  -d '{
    "username": "test_instagram_user",
    "followers": "1.2K",
    "notes": "Duplicate test",
    "profileUrl": "https://instagram.com/test_instagram_user",
    "hasWebsite": "no",
    "niche": "Other"
  }' \
  "$FREELANCE_OS_URL/api/ext/add-lead")

echo "Response: $DUPLICATE_RESPONSE"
echo ""

echo "✅ Tests completed. Check responses above for success."
