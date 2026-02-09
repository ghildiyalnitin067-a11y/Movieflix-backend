/**
 * Comprehensive API Testing Script
 * Tests all backend endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

console.log('🧪 Testing All API Endpoints...\n');
console.log('═══════════════════════════════════════');

const tests = {
  passed: 0,
  failed: 0,
  total: 0
};

// Test function
const testEndpoint = async (name, method, endpoint, data = null, authToken = null) => {
  tests.total++;
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {}
    };
    
    if (data) config.data = data;
    if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
    
    const response = await axios(config);
    console.log(`✅ ${name}`);
    console.log(`   ${method} ${endpoint} - Status: ${response.status}`);
    if (response.data && typeof response.data === 'object') {
      if (Array.isArray(response.data.data)) {
        console.log(`   Data: ${response.data.data.length} items`);
      } else if (response.data.count !== undefined) {
        console.log(`   Count: ${response.data.count}`);
      }
    }
    tests.passed++;
    return { success: true, data: response.data };
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   ${method} ${endpoint} - Error: ${error.response?.status || error.message}`);
    if (error.response?.data?.message) {
      console.log(`   Message: ${error.response.data.message}`);
    }
    tests.failed++;
    return { success: false, error: error.message };
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('\n📋 PUBLIC ENDPOINTS (No Auth Required)');
  console.log('─────────────────────────────────────');
  
  // Public endpoints
  await testEndpoint('Health Check', 'GET', '/health');
  await testEndpoint('Server Status', 'GET', '/status');
  await testEndpoint('Get Plans', 'GET', '/plans');
  await testEndpoint('Get Testimonials', 'GET', '/testimonials');
  
  console.log('\n🔐 AUTHENTICATED ENDPOINTS (Require Firebase Token)');
  console.log('─────────────────────────────────────');
  
  // These will fail without auth token (expected behavior)
  await testEndpoint('Get Current User (No Auth)', 'GET', '/users/me');
  await testEndpoint('Get All Users (No Auth)', 'GET', '/users');
  await testEndpoint('Get My List (No Auth)', 'GET', '/mylist');
  
  console.log('\n📝 DATA MODIFICATION ENDPOINTS');
  console.log('─────────────────────────────────────');
  
  // Test POST without auth (should fail)
  await testEndpoint('Create Testimonial (No Auth)', 'POST', '/testimonials', {
    name: 'Test User',
    role: 'Tester',
    rating: 5,
    text: 'This is a test testimonial'
  });
  
  // Test with invalid data
  await testEndpoint('Create Plan (No Auth)', 'POST', '/plans', {
    name: 'test',
    displayName: 'Test Plan',
    price: { monthly: 99, yearly: 999 }
  });
  
  console.log('\n🔍 ERROR HANDLING TESTS');
  console.log('─────────────────────────────────────');
  
  // Test 404
  await testEndpoint('Non-existent Route', 'GET', '/nonexistent');
  
  // Test invalid ID format
  await testEndpoint('Invalid User ID', 'GET', '/users/invalid-id');
  
  console.log('\n═══════════════════════════════════════');
  console.log('📊 TEST RESULTS');
  console.log('═══════════════════════════════════════');
  console.log(`Total Tests:  ${tests.total}`);
  console.log(`Passed:       ${tests.passed} ✅`);
  console.log(`Failed:       ${tests.failed} ❌`);
  console.log(`Success Rate: ${Math.round((tests.passed / tests.total) * 100)}%`);
  console.log('═══════════════════════════════════════');
  
  if (tests.failed === 0) {
    console.log('\n🎉 All tests passed! API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the results above.');
    console.log('   Note: Auth-required endpoints failing without token is EXPECTED behavior.');
  }
};

runAllTests().catch(console.error);
