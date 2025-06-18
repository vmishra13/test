const fetch = require('node-fetch');

async function testAuth() {
  console.log('🔑 Testing authentication flow...\n');
  
  try {
    // Step 1: Get token
    console.log('Step 1: Getting authentication token...');
    const tokenResponse = await fetch('http://localhost:3000/api/v1/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'password',
        username: 'admin@example.com',
        password: 'password123',
        client_id: 'reliacare-client'
      })
    });
    
    const tokenData = await tokenResponse.json();
    console.log('Token response status:', tokenResponse.status);
    console.log('Token response:', JSON.stringify(tokenData, null, 2));
    
    if (!tokenResponse.ok) {
      console.log('❌ Failed to get token');
      return;
    }
    
    if (!tokenData.access_token) {
      console.log('❌ No access_token in response');
      return;
    }
    
    const accessToken = tokenData.access_token;
    console.log('✅ Got access token:', accessToken.substring(0, 50) + '...');
    
    // Step 2: Use token to access protected endpoint
    console.log('\nStep 2: Testing protected endpoint with token...');
    const usersResponse = await fetch('http://localhost:3000/api/v1/users', {
      method: 'GET',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const usersData = await usersResponse.json();
    console.log('Users response status:', usersResponse.status);
    console.log('Users response:', JSON.stringify(usersData, null, 2));
    
    if (usersResponse.ok) {
      console.log('✅ Successfully accessed protected endpoint');
    } else {
      console.log('❌ Failed to access protected endpoint');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuth();
