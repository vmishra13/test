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

async function testProfileUpdateError() {
  console.log('🧪 Testing Profile Update Error...\n');
  
  try {
    const testData = {
      firstName: 'TestUser',
      lastName: 'LastName',
      email: 'test@example.com',
      dob: '1990-01-15',
      gender: 'Male',
      timeZone: 'America/New_York'
    };
    
    console.log('📤 Sending update request with:', JSON.stringify(testData, null, 2));
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/v1/users/profile',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }
    };
    
    const response = await makeRequest(options, testData);
    
    console.log('📊 Response Status:', response.statusCode);
    console.log('📋 Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('🚨 Request failed:', error.message);
  }
}

async function runTest() {
  console.log('🚀 Starting Profile Update Error Debug...\n');
  
  // Wait a moment for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testProfileUpdateError();
  
  console.log('\n🏁 Test completed! Check server logs for detailed error information.');
}

runTest().catch(console.error);
