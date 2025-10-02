#!/bin/bash

# Test script for Vercel Cron Functions
# Run this script to test the cron endpoints locally

echo "🧪 Testing Stronghold Cron Endpoints"
echo "======================================"

# Configuration
BASE_URL="http://localhost:3000"
CRON_SECRET="stronghold_cron_secret_2024_secure_token_xyz789"

echo "📍 Base URL: $BASE_URL"
echo "🔐 Using CRON_SECRET for authentication"
echo ""

# Test 1: Check Expirations Endpoint
echo "🔍 Testing: /api/cron/check-expirations"
echo "----------------------------------------"
curl -X GET "$BASE_URL/api/cron/check-expirations" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"

echo ""
echo ""

# Test 2: Dead Man's Switch Endpoint
echo "💀 Testing: /api/cron/dead-mans-switch"
echo "---------------------------------------"
curl -X GET "$BASE_URL/api/cron/dead-mans-switch" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"

echo ""
echo ""

# Test 3: Unauthorized Access Test
echo "🚫 Testing: Unauthorized access (should fail)"
echo "----------------------------------------------"
curl -X GET "$BASE_URL/api/cron/check-expirations" \
  -H "Authorization: Bearer wrong_secret" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -s | jq '.' 2>/dev/null || echo "Response received (jq not available for formatting)"

echo ""
echo "✅ Cron endpoint testing completed!"
echo ""
echo "📝 Notes:"
echo "   - HTTP 200 + success:true = Working correctly"
echo "   - HTTP 401 = Authentication working correctly"
echo "   - HTTP 500 = Server error (check logs)"
echo ""
echo "💡 Next steps:"
echo "   1. Deploy to Vercel"
echo "   2. Set CRON_SECRET environment variable on Vercel"
echo "   3. Verify cron jobs run automatically"