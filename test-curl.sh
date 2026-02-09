#!/bin/bash

# Comprehensive API Testing with curl
# Tests all endpoints including edge cases

API_BASE="http://localhost:5001/api"

echo "🧪 Comprehensive API Testing with curl"
echo "═══════════════════════════════════════"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5
    
    echo -n "Testing: $name... "
    
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$API_BASE$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_BASE$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $http_code)"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $http_code)"
        ((FAILED++))
    fi
}

echo "📋 PUBLIC ENDPOINTS"
echo "─────────────────────────────────────"
test_endpoint "Health Check" "GET" "/health" "" "200"
test_endpoint "Server Status" "GET" "/status" "" "200"
test_endpoint "Get Plans" "GET" "/plans" "" "200"
test_endpoint "Get Testimonials" "GET" "/testimonials" "" "200"

echo ""
echo "🔐 AUTHENTICATED ENDPOINTS (Should return 401)"
echo "─────────────────────────────────────"
test_endpoint "Get Current User (No Auth)" "GET" "/users/me" "" "401"
test_endpoint "Get All Users (No Auth)" "GET" "/users" "" "401"
test_endpoint "Get My List (No Auth)" "GET" "/mylist" "" "401"

echo ""
echo "📝 DATA MODIFICATION (Should return 401)"
echo "─────────────────────────────────────"
test_endpoint "Create Testimonial (No Auth)" "POST" "/testimonials" '{"name":"Test","text":"Test"}' "401"
test_endpoint "Create Plan (No Auth)" "POST" "/plans" '{"name":"test"}' "401"

echo ""
echo "🔍 ERROR HANDLING"
echo "─────────────────────────────────────"
test_endpoint "Non-existent Route" "GET" "/nonexistent" "" "404"
test_endpoint "Invalid JSON" "POST" "/data" 'not valid json' "400"
test_endpoint "Missing Required Fields" "POST" "/data" '{"message":"test"}' "400"

echo ""
echo "🧪 EDGE CASES"
echo "─────────────────────────────────────"
test_endpoint "Empty Body" "POST" "/data" '{}' "400"
test_endpoint "SQL Injection Attempt" "POST" "/data" '{"name":"'\''; DROP TABLE users; --","email":"test@test.com"}' "400"
test_endpoint "Very Long String" "POST" "/data" "{\"name\":\"$(printf 'A%.0s' {1..1000})\",\"email\":\"test@test.com\"}" "200"
test_endpoint "Unicode & Emojis" "POST" "/data" '{"name":"Test 🎉","email":"test@test.com","message":"你好世界 🌍"}' "200"

echo ""
echo "═══════════════════════════════════════"
echo "📊 TEST RESULTS"
echo "═══════════════════════════════════════"
echo "Total Tests:  $((PASSED + FAILED))"
echo -e "Passed:       ${GREEN}$PASSED${NC} ✅"
echo -e "Failed:       ${RED}$FAILED${NC} ❌"
echo "Success Rate: $(awk "BEGIN {printf \"%.0f%%\", ($PASSED/($PASSED+$FAILED))*100}")"
echo "═══════════════════════════════════════"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed!${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠️  Some tests failed. Review the results above.${NC}"
fi
