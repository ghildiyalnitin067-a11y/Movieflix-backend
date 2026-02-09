/**
 * Edge Case & Error Handling Tests
 * Tests boundary conditions, invalid data, and error scenarios
 */

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

console.log('🔍 Testing Edge Cases & Error Scenarios...\n');

const tests = {
  passed: 0,
  failed: 0,
  total: 0
};

const testCase = async (name, testFn) => {
  tests.total++;
  try {
    await testFn();
    console.log(`✅ ${name}`);
    tests.passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    tests.failed++;
  }
};

// Run all edge case tests
const runEdgeCaseTests = async () => {
  
  console.log('📋 EDGE CASE TESTS');
  console.log('═══════════════════════════════════════\n');

  // Test 1: Empty request body
  await testCase('POST /testimonials with empty body', async () => {
    try {
      await axios.post(`${API_BASE}/testimonials`, {});
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 400) {
        throw new Error(`Expected 401 or 400, got ${error.response?.status}`);
      }
    }
  });

  // Test 2: Invalid email format
  await testCase('POST /data with invalid email', async () => {
    try {
      await axios.post(`${API_BASE}/data`, {
        name: 'Test',
        email: 'invalid-email-format'
      });
    } catch (error) {
      // Should accept any data for now, just checking it doesn't crash
      if (error.response?.status >= 500) {
        throw new Error('Server crashed on invalid email');
      }
    }
  });

  // Test 3: Very long strings
  await testCase('POST /data with extremely long name', async () => {
    const longName = 'A'.repeat(1000);
    try {
      await axios.post(`${API_BASE}/data`, {
        name: longName,
        email: 'test@test.com'
      });
    } catch (error) {
      if (error.response?.status >= 500) {
        throw new Error('Server crashed on long string');
      }
    }
  });

  // Test 4: Special characters in data
  await testCase('POST /data with special characters', async () => {
    try {
      await axios.post(`${API_BASE}/data`, {
        name: '<script>alert("xss")</script>',
        email: 'test@test.com',
        message: 'Special chars: !@#$%^&*()'
      });
    } catch (error) {
      if (error.response?.status >= 500) {
        throw new Error('Server crashed on special characters');
      }
    }
  });

  // Test 5: SQL Injection attempt
  await testCase('POST /data with SQL injection attempt', async () => {
    try {
      await axios.post(`${API_BASE}/data`, {
        name: "'; DROP TABLE users; --",
        email: 'test@test.com'
      });
    } catch (error) {
      if (error.response?.status >= 500) {
        throw new Error('Server crashed on SQL injection attempt');
      }
    }
  });

  // Test 6: Invalid ObjectId format
  await testCase('GET /users with invalid ObjectId', async () => {
    try {
      await axios.get(`${API_BASE}/users/not-a-valid-object-id`);
    } catch (error) {
      if (error.response?.status !== 401 && error.response?.status !== 404) {
        throw new Error(`Expected 401 or 404, got ${error.response?.status}`);
      }
    }
  });

  // Test 7: Negative pagination values
  await testCase('GET /plans with negative page number', async () => {
    const response = await axios.get(`${API_BASE}/plans?page=-1&limit=-10`);
    // Should handle gracefully, not crash
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  });

  // Test 8: Excessive pagination limit
  await testCase('GET /plans with excessive limit (10000)', async () => {
    const response = await axios.get(`${API_BASE}/plans?limit=10000`);
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
  });

  // Test 9: Malformed JSON
  await testCase('POST with malformed JSON', async () => {
    try {
      await axios.post(`${API_BASE}/data`, 'not valid json', {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`Expected 400, got ${error.response?.status}`);
      }
    }
  });

  // Test 10: Missing required fields
  await testCase('POST /data without required fields', async () => {
    try {
      await axios.post(`${API_BASE}/data`, { message: 'Missing name and email' });
    } catch (error) {
      if (error.response?.status !== 400) {
        throw new Error(`Expected 400, got ${error.response?.status}`);
      }
    }
  });

  // Test 11: Unicode and emojis
  await testCase('POST /data with unicode and emojis', async () => {
    try {
      await axios.post(`${API_BASE}/data`, {
        name: 'Test User 🎉',
        email: 'test@test.com',
        message: 'Unicode: 你好世界 🌍 ñáéíóú'
      });
    } catch (error) {
      if (error.response?.status >= 500) {
        throw new Error('Server crashed on unicode');
      }
    }
  });

  // Test 12: Null values
  await testCase('POST /data with null values', async () => {
    try {
      await axios.post(`${API_BASE}/data`, {
        name: null,
        email: null,
        message: null
      });
    } catch (error) {
      if (error.response?.status >= 500) {
        throw new Error('Server crashed on null values');
      }
    }
  });

  // Test 13: Array instead of object
  await testCase('POST /data with array instead of object', async () => {
    try {
      await axios.post(`${API_BASE}/data`, [1, 2, 3]);
    } catch (error) {
      if (error.response?.status >= 500) {
        throw new Error('Server crashed on array input');
      }
    }
  });

  // Test 14: Number instead of string for name
  await testCase('POST /data with number as name', async () => {
    try {
      await axios.post(`${API_BASE}/data`, {
        name: 12345,
        email: 'test@test.com'
      });
    } catch (error) {
      if (error.response?.status >= 500) {
        throw new Error('Server crashed on wrong type');
      }
    }
  });

  // Test 15: Empty string values
  await testCase('POST /data with empty strings', async () => {
    try {
      await axios.post(`${API_BASE}/data`, {
        name: '',
        email: '',
        message: ''
      });
    } catch (error) {
      if (error.response?.status >= 500) {
        throw new Error('Server crashed on empty strings');
      }
    }
  });

  console.log('\n═══════════════════════════════════════');
  console.log('📊 EDGE CASE TEST RESULTS');
  console.log('═══════════════════════════════════════');
  console.log(`Total Tests:  ${tests.total}`);
  console.log(`Passed:       ${tests.passed} ✅`);
  console.log(`Failed:       ${tests.failed} ❌`);
  console.log(`Success Rate: ${Math.round((tests.passed / tests.total) * 100)}%`);
  console.log('═══════════════════════════════════════');

  if (tests.failed === 0) {
    console.log('\n🎉 All edge case tests passed! Server handles errors gracefully.');
  } else {
    console.log('\n⚠️  Some edge case tests failed. Review server error handling.');
  }
};

runEdgeCaseTests().catch(console.error);
