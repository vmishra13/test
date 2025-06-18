#!/bin/bash

echo "🧪 Testing ModMed Integration"
echo "=============================="

# Test if server starts without errors
echo "1. Building project..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed"
    exit 1
fi

# Start server in background and test endpoints
echo "2. Starting server..."
npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test health endpoint
echo "3. Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/v1/health 2>/dev/null || echo "failed")
if [[ $HEALTH_RESPONSE == *"ok"* ]]; then
    echo "   ✅ Health endpoint working"
else
    echo "   ❌ Health endpoint failed"
fi

# Test ModMed test endpoint
echo "4. Testing ModMed connection..."
MODMED_RESPONSE=$(curl -s http://localhost:3000/v1/modmed/test 2>/dev/null || echo "failed")
if [[ $MODMED_RESPONSE == *"success"* ]]; then
    echo "   ✅ ModMed endpoint accessible"
    echo "   📄 Response: $MODMED_RESPONSE"
else
    echo "   ⚠️  ModMed endpoint response: $MODMED_RESPONSE"
fi

# Cleanup
echo "5. Cleaning up..."
kill $SERVER_PID 2>/dev/null
echo "   ✅ Server stopped"

echo ""
echo "🎉 Integration test complete!"
echo ""
echo "📋 Available ModMed endpoints:"
echo "   GET /v1/modmed/test"
echo "   GET /v1/modmed/patients/search?firstName=John&lastName=Doe&dateOfBirth=1990-01-01"
echo "   GET /v1/modmed/patients"
echo "   GET /v1/modmed/patients/:patientId/appointments"
echo "   GET /v1/modmed/patients/:patientId/documents"
