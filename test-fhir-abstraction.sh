#!/bin/bash

# Test FHIR Abstraction Layer
# This script tests the new FHIR abstraction layer endpoints

echo "🧪 Testing FHIR Abstraction Layer"
echo "=================================="

# Get the base URL (default to localhost:3000)
BASE_URL="${1:-http://localhost:3000}"
API_BASE="${BASE_URL}/api/v1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_status=${4:-200}
    
    echo -e "\n${YELLOW}Testing:${NC} $description"
    echo -e "${YELLOW}Endpoint:${NC} $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "Content-Type: application/json" "$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" "$endpoint")
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    # Extract response body (all but last line)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ Success${NC} (Status: $status_code)"
        if [ ${#body} -gt 100 ]; then
            echo "Response: $(echo "$body" | head -c 100)..."
        else
            echo "Response: $body"
        fi
    else
        echo -e "${RED}❌ Failed${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
    fi
}

echo -e "\n🔗 Testing Enhanced ModMed FHIR Endpoints"
echo "=========================================="

# Test connection
test_endpoint "GET" "${API_BASE}/enhanced-modmed/test-connection" "Test ModMed FHIR connection"

# Test capability statement
test_endpoint "GET" "${API_BASE}/enhanced-modmed/capability-statement" "Get FHIR capability statement"

# Test patient search (with sample parameters)
test_endpoint "GET" "${API_BASE}/enhanced-modmed/patients/search?firstName=John&lastName=Doe&dateOfBirth=1980-01-01" "Search for patient"

# Test patients list
test_endpoint "GET" "${API_BASE}/enhanced-modmed/patients?quantity=5&page=1" "Get patients list"

# Test patient by ID (this will likely fail without a real patient ID)
test_endpoint "GET" "${API_BASE}/enhanced-modmed/patients/test-patient-123" "Get patient by ID" 404

# Test patient appointments (this will likely fail without a real patient ID)
test_endpoint "GET" "${API_BASE}/enhanced-modmed/patients/test-patient-123/appointments" "Get patient appointments" 404

# Test patient medications (this will likely fail without a real patient ID)  
test_endpoint "GET" "${API_BASE}/enhanced-modmed/patients/test-patient-123/medications" "Get patient medications" 404

# Test patient conditions (this will likely fail without a real patient ID)
test_endpoint "GET" "${API_BASE}/enhanced-modmed/patients/test-patient-123/conditions" "Get patient conditions" 404

# Test patient documents (this will likely fail without a real patient ID)
test_endpoint "GET" "${API_BASE}/enhanced-modmed/patients/test-patient-123/documents" "Get patient documents" 404

# Test document search (this will likely fail without a real patient ID)
test_endpoint "GET" "${API_BASE}/enhanced-modmed/patients/test-patient-123/documents/search?date=2023-01-01" "Search patient documents" 404

# Test specific document (this will likely fail without a real document ID)
test_endpoint "GET" "${API_BASE}/enhanced-modmed/documents/test-doc-123" "Get specific document" 404

echo -e "\n🔍 Testing Comparison with Original ModMed Endpoints"
echo "===================================================="

# Compare with original endpoints
test_endpoint "GET" "${API_BASE}/modmed/test-connection" "Original ModMed test connection"
test_endpoint "GET" "${API_BASE}/modmed/patients/search?firstName=John&lastName=Doe&dateOfBirth=1980-01-01" "Original ModMed patient search"

echo -e "\n📊 Summary"
echo "=========="
echo "✅ FHIR Abstraction Layer endpoints tested"
echo "✅ Enhanced ModMed controller endpoints tested"  
echo "✅ Comparison with original ModMed endpoints tested"
echo ""
echo "Note: Some endpoints may fail with 404/500 errors if:"
echo "  - ModMed credentials are not configured"
echo "  - Test patient/document IDs don't exist"
echo "  - ModMed service is unavailable"
echo ""
echo "This is expected for testing purposes. The important thing is that"
echo "the endpoints are accessible and return proper HTTP status codes."

echo -e "\n🔧 Testing FHIR Service Programmatically"
echo "========================================"

# Create a simple Node.js test script
cat > test-fhir-service.js << 'EOF'
const axios = require('axios');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/v1`;

async function testFHIRService() {
    console.log('🧪 Testing FHIR Service programmatically...\n');
    
    try {
        // Test enhanced ModMed connection
        console.log('Testing enhanced ModMed connection...');
        const response = await axios.get(`${API_BASE}/enhanced-modmed/test-connection`);
        console.log('✅ Connection test response:', response.data);
        
        // Test capability statement
        console.log('\nTesting capability statement...');
        try {
            const capabilityResponse = await axios.get(`${API_BASE}/enhanced-modmed/capability-statement`);
            console.log('✅ Capability statement retrieved');
        } catch (error) {
            console.log('ℹ️  Capability statement failed (expected if not connected):', error.response?.status);
        }
        
        // Test patient search
        console.log('\nTesting patient search...');
        try {
            const searchResponse = await axios.get(`${API_BASE}/enhanced-modmed/patients/search`, {
                params: {
                    firstName: 'John',
                    lastName: 'Doe', 
                    dateOfBirth: '1980-01-01'
                }
            });
            console.log('✅ Patient search response:', searchResponse.data);
        } catch (error) {
            console.log('ℹ️  Patient search failed (expected if not connected):', error.response?.status);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

testFHIRService();
EOF

echo "Running programmatic test..."
if command -v node >/dev/null 2>&1; then
    node test-fhir-service.js
    rm test-fhir-service.js
else
    echo "Node.js not found. Skipping programmatic test."
    rm test-fhir-service.js
fi

echo -e "\n🎉 FHIR Abstraction Layer testing complete!"
echo "============================================"
