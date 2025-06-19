#!/bin/bash

# ReliaCare API Endpoint Test Script
# This script tests all the newly created API endpoints

BASE_URL="http://localhost:3000/api/v1"

echo "🧪 Testing ReliaCare API Endpoints"
echo "=================================="
echo "Base URL: $BASE_URL"
echo ""

# Function to test GET endpoints
test_get_endpoint() {
    local endpoint=$1
    local description=$2
    
    echo "Testing: $description"
    echo "GET $endpoint"
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL$endpoint")
    http_code=$(echo "$response" | tail -n1 | cut -d: -f2)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" == "200" ] || [ "$http_code" == "401" ]; then
        echo "✅ Status: $http_code"
        echo "📝 Response: $(echo $body | jq -r '.message // .error // "No message"' 2>/dev/null || echo 'JSON parse error')"
    else
        echo "❌ Status: $http_code"
        echo "📝 Response: $body"
    fi
    echo ""
}

# Test all GET endpoints
echo "🔍 Testing GET Endpoints"
echo "------------------------"

test_get_endpoint "/clients" "List all clients"
test_get_endpoint "/clients/1" "Get specific client"
test_get_endpoint "/clients/1/fhir-config" "Get FHIR configuration"

test_get_endpoint "/plans" "List all treatment plans"
test_get_endpoint "/plans/1" "Get specific plan"
test_get_endpoint "/plans/1/pre-op-learning" "Get pre-op learning"

test_get_endpoint "/exercises" "List all exercises"
test_get_endpoint "/exercises/1" "Get specific exercise"

test_get_endpoint "/procedures" "List all procedures"
test_get_endpoint "/procedures/1" "Get specific procedure"

test_get_endpoint "/medications" "List all medications"
test_get_endpoint "/medications/1" "Get specific medication"

test_get_endpoint "/users" "List all users"
test_get_endpoint "/users/1" "Get specific user"

echo "📊 Test Summary"
echo "==============="
echo "All endpoints tested!"
echo "Note: 401 Unauthorized responses are expected since authentication is required"
echo ""
echo "🔑 To test with authentication:"
echo "1. First login: POST $BASE_URL/auth/login"
echo "2. Use the returned token in Authorization header"
echo "3. Example: curl -H 'Authorization: Bearer <token>' $BASE_URL/clients"
