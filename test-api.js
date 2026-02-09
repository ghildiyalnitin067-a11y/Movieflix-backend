/**
 * API Test Script
 * Tests all endpoints including protected routes
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5000;

// Helper function to make HTTP requests
function makeRequest(path, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log('🧪 Starting API Tests...\n');

  // Test 1: Public endpoints
  console.log('1️⃣ Testing Public Endpoints...');
  const home = await makeRequest('/');
  console.log(`   GET / - Status: ${home.status}`, home.data.status === 'running' ? '✅' : '❌');

  const status = await makeRequest('/api/status');
  console.log(`   GET /api/status - Status: ${status.status}`, status.data.status === 'success' ? '✅' : '❌');

  const health = await makeRequest('/api/health');
  console.log(`   GET /api/health - Status: ${health.status}`, health.data.status === 'healthy' ? '✅' : '❌');

  // Test 2: POST data endpoint
  console.log('\n2️⃣ Testing POST /api/data...');
  const postData = await makeRequest('/api/data', 'POST', {}, {
    name: 'Test User',
    email: 'test@example.com',
    message: 'Test message'
  });
  console.log(`   Valid data - Status: ${postData.status}`, postData.data.status === 'success' ? '✅' : '❌');

  const postInvalid = await makeRequest('/api/data', 'POST', {}, { name: 'Test' });
  console.log(`   Invalid data - Status: ${postInvalid.status}`, postInvalid.data.status === 'error' ? '✅' : '❌');

  // Test 3: Protected endpoints (without token)
  console.log('\n3️⃣ Testing Protected Endpoints (No Token)...');
  const usersNoAuth = await makeRequest('/api/users');
  console.log(`   GET /api/users - Status: ${usersNoAuth.status}`, usersNoAuth.status === 401 ? '✅' : '❌');

  const meNoAuth = await makeRequest('/api/users/me');
  console.log(`   GET /api/users/me - Status: ${meNoAuth.status}`, meNoAuth.status === 401 ? '✅' : '❌');

  // Test 4: Protected endpoints (with invalid token)
  console.log('\n4️⃣ Testing Protected Endpoints (Invalid Token)...');
  const usersInvalid = await makeRequest('/api/users', 'GET', {
    'Authorization': 'Bearer invalid_token'
  });
  console.log(`   GET /api/users - Status: ${usersInvalid.status}`, usersInvalid.status === 401 ? '✅' : '❌');

  // Test 5: 404 handler
  console.log('\n5️⃣ Testing 404 Handler...');
  const notFound = await makeRequest('/api/nonexistent');
  console.log(`   GET /api/nonexistent - Status: ${notFound.status}`, notFound.status === 404 ? '✅' : '❌');

  console.log('\n✨ All tests completed!');
}

runTests().catch(console.error);
