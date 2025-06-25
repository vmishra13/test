#!/usr/bin/env node

const http = require('http');

const makeRequest = (options, postData = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    
    req.end();
  });
};

async function testAllProfileEndpoints() {
  console.log('🧪 Testing All Profile Endpoints...\n');
  
  const baseOptions = {
    hostname: 'localhost',
    port: 3000,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token'
    }
  };
  
  const endpoints = [
    { method: 'GET', path: '/api/v1/users/profile', name: 'Get Profile' },
    { method: 'PUT', path: '/api/v1/users/profile', name: 'Update Profile', data: { firstName: 'Test' } },
    { method: 'PUT', path: '/api/v1/users/profile/personal-info', name: 'Update Personal Info', data: { allergies: 'None' } },
    { method: 'GET', path: '/api/v1/users/profile/onboarding-status', name: 'Onboarding Status' },
    { method: 'POST', path: '/api/v1/users/profile/complete-onboarding', name: 'Complete Onboarding', data: {} }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📍 Testing: ${endpoint.name}`);
      console.log(`   ${endpoint.method} ${endpoint.path}`);
      
      const options = {
        ...baseOptions,
        method: endpoint.method,
        path: endpoint.path
      };
      
      const response = await makeRequest(options, endpoint.data);
      
      console.log(`   Status: ${response.statusCode}`);
      
      if (response.statusCode === 403) {
        console.log(`   ❌ FORBIDDEN: ${response.data.message}`);
        console.log(`   Error: ${JSON.stringify(response.data, null, 2)}`);
      } else if (response.statusCode === 200 || response.statusCode === 201) {
        console.log(`   ✅ SUCCESS: ${response.data.message || 'OK'}`);
      } else {
        console.log(`   ⚠️  OTHER: ${response.data.message || 'Unknown'}`);
        console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
      }
      
    } catch (error) {
      console.log(`   🚨 ERROR: ${error.message}`);
    }
  }
  
  // Also test the problematic patterns that might trigger requireResourceOwner
  console.log('\n\n🔍 Testing Potential Route Conflicts...');
  
  const conflictTests = [
    { method: 'GET', path: '/api/v1/users/123', name: 'Get User by ID (might conflict)' },
    { method: 'GET', path: '/api/v1/users/profile/123', name: 'Profile with ID suffix' }
  ];
  
  for (const test of conflictTests) {
    try {
      console.log(`\n📍 Testing: ${test.name}`);
      console.log(`   ${test.method} ${test.path}`);
      
      const options = {
        ...baseOptions,
        method: test.method,
        path: test.path
      };
      
      const response = await makeRequest(options);
      console.log(`   Status: ${response.statusCode} - ${response.data.message || 'No message'}`);
      
    } catch (error) {
      console.log(`   🚨 ERROR: ${error.message}`);
    }
  }
}

async function runTests() {
  console.log('🚀 Profile Endpoint Debugging...\n');
  
  // Wait a moment for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testAllProfileEndpoints();
  
  console.log('\n🏁 Profile endpoint tests completed!');
}

runTests().catch(console.error);
