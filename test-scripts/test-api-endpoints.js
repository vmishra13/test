#!/usr/bin/env node

const http = require('http');

const baseUrl = 'http://localhost:3000';
const endpoints = [
  '/api/v1/auth',
  '/api/v1/users', 
  '/api/v1/clients',
  '/api/v1/plans',
  '/api/v1/exercises',
  '/api/v1/procedures', 
  '/api/v1/medications',
  '/api/v1/email',
  '/api/v1/contacts',
  '/api/v1/roles',
  '/api/v1/todos',
  '/api/v1/media',
  '/api/v1/msg-groups',
  '/api/v1/messages'
];

async function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const req = http.get(`${baseUrl}${endpoint}`, (res) => {
      resolve({
        endpoint,
        status: res.statusCode,
        message: `${res.statusCode === 404 ? 'NOT FOUND' : 'ACCESSIBLE'}`
      });
    });
    
    req.on('error', (err) => {
      resolve({
        endpoint,
        status: 'ERROR',
        message: err.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        endpoint,
        status: 'TIMEOUT',
        message: 'Request timeout'
      });
    });
  });
}

async function testAllEndpoints() {
  console.log('🔍 Testing API Endpoints...\n');
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    const status = result.status === 404 ? '❌' : result.status === 'ERROR' ? '💥' : result.status === 'TIMEOUT' ? '⏰' : '✅';
    console.log(`${status} ${endpoint} - ${result.message}`);
  }
}

if (require.main === module) {
  testAllEndpoints().catch(console.error);
}
