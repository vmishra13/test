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

async function testProfileUpdate() {
  console.log('🧪 Testing Profile Update with Core Fields...');
  
  try {
    // Test data that includes both core fields and extraInfo fields
    const profileUpdateData = {
      // Core user fields
      firstName: 'UpdatedJohn',
      lastName: 'UpdatedDoe',
      email: 'updated.john.doe@example.com',
      dob: '1985-05-20',
      gender: 'Male',
      timeZone: 'America/New_York',
      
      // ExtraInfo fields
      phoneNumber: '+1-555-9999',
      address: {
        street: '456 Updated St',
        city: 'Updated City',
        state: 'NY',
        zipCode: '10001'
      },
      emergencyContact: 'Updated Emergency Contact',
      emergencyPhoneNumber: '+1-555-8888',
      preferences: {
        notifications: true,
        language: 'en',
        theme: 'dark'
      }
    };
    
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
    
    const response = await makeRequest(options, profileUpdateData);
    
    console.log('📊 Update Response Status:', response.statusCode);
    console.log('📋 Update Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.statusCode === 200) {
      console.log('✅ Profile update endpoint is working!');
      
      // Check if core fields were updated
      const userData = response.data.data;
      if (userData) {
        console.log('\n🔍 Verifying Updated Fields:');
        console.log(`First Name: ${userData.firstName || 'NOT UPDATED'}`);
        console.log(`Last Name: ${userData.lastName || 'NOT UPDATED'}`);
        console.log(`Email: ${userData.email || 'NOT UPDATED'}`);
        console.log(`DOB: ${userData.dob || 'NOT UPDATED'}`);
        console.log(`Gender: ${userData.gender || 'NOT UPDATED'}`);
        console.log(`Phone: ${userData.phoneNumber || 'NOT UPDATED'}`);
        console.log(`Emergency Contact: ${userData.emergencyContact || 'NOT UPDATED'}`);
        
        // Check if any core fields were actually updated
        const coreFieldsUpdated = [
          userData.firstName === 'UpdatedJohn',
          userData.lastName === 'UpdatedDoe', 
          userData.email === 'updated.john.doe@example.com'
        ].some(Boolean);
        
        if (coreFieldsUpdated) {
          console.log('✅ Core fields ARE being updated!');
        } else {
          console.log('❌ Core fields are NOT being updated - only extraInfo');
        }
      }
    } else {
      console.log('❌ Profile update failed');
      if (response.data.message && response.data.message.includes('extrainfo')) {
        console.log('🔍 The extrainfo-only issue might still be present');
      }
    }
  } catch (error) {
    console.error('🚨 Profile update test failed:', error.message);
  }
}

async function runTest() {
  console.log('🚀 Testing Profile Update Fix...\n');
  
  // Wait a moment for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  await testProfileUpdate();
  
  console.log('\n🏁 Profile update test completed!');
}

runTest().catch(console.error);
