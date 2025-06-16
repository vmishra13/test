const http = require('http');

const data = JSON.stringify({
  grant_type: 'password',
  username: 'admin@example.com',
  password: 'password123',
  client_id: 'reliacare-client'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/auth/token',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let responseData = '';
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('\n--- TOKEN RESPONSE ---');
    try {
      const parsed = JSON.parse(responseData);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error(`Request error: ${error}`);
});

req.write(data);
req.end();
