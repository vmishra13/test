#!/usr/bin/env node

const http = require('http');

// Test function to make HTTP requests
function testEndpoint(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/v1${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data,
          path: path
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Test our new API endpoints
async function testAPIs() {
  console.log('🧪 Testing ReliaCare API endpoints...\n');

  const endpoints = [
    '/clients',
    '/plans',
    '/exercises',
    '/procedures',
    '/medications',
    '/users'
  ];

  for (const endpoint of endpoints) {
    try {
      const result = await testEndpoint(endpoint);
      console.log(`✅ ${endpoint}: Status ${result.statusCode}`);
    } catch (error) {
      console.log(`❌ ${endpoint}: Error - ${error.message}`);
    }
  }

  console.log('\n🎉 API testing complete!');
}

testAPIs();
