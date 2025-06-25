/**
 * Test script for secure treatment plan endpoints
 * This script tests the newly implemented secure treatment plan service
 */

const API_BASE = 'http://localhost:3000/api';
const TEST_TOKEN = 'your-test-token-here'; // Replace with actual test token

async function testSecureTreatmentPlans() {
  console.log('🔒 Testing Secure Treatment Plan Endpoints');
  console.log('='.repeat(50));

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TEST_TOKEN}`
  };

  try {
    // Test 1: Get all treatment plans
    console.log('\n1. Testing GET /api/plans');
    const getPlansResponse = await fetch(`${API_BASE}/plans`, {
      method: 'GET',
      headers
    });
    
    if (getPlansResponse.ok) {
      const plansData = await getPlansResponse.json();
      console.log('✅ GET /api/plans - Success');
      console.log('Response:', JSON.stringify(plansData, null, 2));
    } else {
      console.log('❌ GET /api/plans - Failed');
      console.log('Status:', getPlansResponse.status);
      console.log('Response:', await getPlansResponse.text());
    }

    // Test 2: Get specific treatment plan
    console.log('\n2. Testing GET /api/plans/1');
    const getPlanResponse = await fetch(`${API_BASE}/plans/1`, {
      method: 'GET',
      headers
    });
    
    if (getPlanResponse.ok) {
      const planData = await getPlanResponse.json();
      console.log('✅ GET /api/plans/1 - Success');
      console.log('Response:', JSON.stringify(planData, null, 2));
    } else {
      console.log('❌ GET /api/plans/1 - Failed');
      console.log('Status:', getPlanResponse.status);
      console.log('Response:', await getPlanResponse.text());
    }

    // Test 3: Create treatment plan
    console.log('\n3. Testing POST /api/plans');
    const createPlanResponse = await fetch(`${API_BASE}/plans`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Test Recovery Plan',
        description: 'Test treatment plan for security validation',
        duration: '4 weeks',
        patientId: 123,
        exercises: [1, 2],
        medications: [1],
        procedures: []
      })
    });
    
    if (createPlanResponse.ok) {
      const createData = await createPlanResponse.json();
      console.log('✅ POST /api/plans - Success');
      console.log('Response:', JSON.stringify(createData, null, 2));
    } else {
      console.log('❌ POST /api/plans - Failed');
      console.log('Status:', createPlanResponse.status);
      console.log('Response:', await createPlanResponse.text());
    }

    // Test 4: Search treatment plans
    console.log('\n4. Testing GET /api/plans/search?q=recovery');
    const searchResponse = await fetch(`${API_BASE}/plans/search?q=recovery`, {
      method: 'GET',
      headers
    });
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('✅ GET /api/plans/search - Success');
      console.log('Response:', JSON.stringify(searchData, null, 2));
    } else {
      console.log('❌ GET /api/plans/search - Failed');
      console.log('Status:', searchResponse.status);
      console.log('Response:', await searchResponse.text());
    }

    // Test 5: Test authorization failure (invalid client access)
    console.log('\n5. Testing Authorization Failure - Different Client Access');
    const invalidClientResponse = await fetch(`${API_BASE}/plans?clientId=999`, {
      method: 'GET',
      headers
    });
    
    if (invalidClientResponse.status === 403) {
      console.log('✅ Authorization Test - Correctly blocked unauthorized access');
      console.log('Response:', await invalidClientResponse.text());
    } else {
      console.log('⚠️ Authorization Test - May have security issue');
      console.log('Status:', invalidClientResponse.status);
      console.log('Response:', await invalidClientResponse.text());
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }

  console.log('\n' + '='.repeat(50));
  console.log('🔒 Secure Treatment Plan Tests Complete');
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testSecureTreatmentPlans };
} else {
  // Run tests if called directly
  testSecureTreatmentPlans();
}
