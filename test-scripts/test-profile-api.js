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

async function testProfileEndpoint() {
  console.log('🧪 Testing Profile Endpoint...');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/users/profile',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    };
    
    const response = await makeRequest(options);
    
    console.log('📊 Response Status:', response.statusCode);
    console.log('📋 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✅ Profile endpoint is working correctly!');
    } else {
      console.log('❌ Profile endpoint returned an error');
      if (response.data.message && response.data.message.includes('isAdmin')) {
        console.log('🔍 The isAdmin error is still present');
      }
    }
  } catch (error) {
    console.error('🚨 Request failed:', error.message);
  }
}

async function testHealthEndpoint() {
  console.log('🏥 Testing Health Endpoint...');
  
  try {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    console.log('📊 Health Status:', response.statusCode);
    console.log('📋 Health Data:', JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✅ Server is healthy!');
    } else {
      console.log('❌ Server health check failed');
    }
  } catch (error) {
    console.error('🚨 Health check failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');
  
  // Wait a moment for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testHealthEndpoint();
  console.log('');
  await testProfileEndpoint();
  
  console.log('\n🏁 Tests completed!');
}

runTests().catch(console.error);
