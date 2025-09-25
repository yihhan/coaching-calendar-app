#!/usr/bin/env node

/**
 * Test Session Creation Without Validation
 * This script tests if the issue is with validation or the actual logic
 */

const https = require('https');

const PRODUCTION_URL = 'https://calla.sg';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : require('http');
    
    const requestOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };
    
    const req = client.request(url, requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testValidationIssue() {
  console.log('🔍 Testing Validation Issue...');
  
  // Register and login coach
  const coachEmail = `valcoach${Date.now()}@example.com`;
  const coachData = {
    name: 'Val Coach',
    email: coachEmail,
    password: 'testpass123',
    role: 'coach'
  };
  
  console.log('📝 Registering coach...');
  const registerResponse = await makeRequest(`${PRODUCTION_URL}/api/register`, {
    method: 'POST',
    body: coachData
  });
  
  if (registerResponse.status !== 201) {
    console.log('❌ Registration failed');
    return;
  }
  
  console.log('🔑 Logging in coach...');
  const loginResponse = await makeRequest(`${PRODUCTION_URL}/api/login`, {
    method: 'POST',
    body: {
      email: coachEmail,
      password: 'testpass123'
    }
  });
  
  if (loginResponse.status !== 200) {
    console.log('❌ Login failed');
    return;
  }
  
  const token = loginResponse.data.token;
  console.log('✅ Coach logged in successfully');
  
  // Test different data formats
  const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
  
  console.log('📅 Testing different time formats...');
  
  // Test 1: Full ISO string
  console.log('\n🧪 Test 1: Full ISO string');
  const test1Data = {
    title: 'Test Session 1',
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString()
  };
  
  const response1 = await makeRequest(`${PRODUCTION_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: test1Data
  });
  
  console.log('📥 Response 1:', response1.status, JSON.stringify(response1.data, null, 2));
  
  // Test 2: ISO string without milliseconds
  console.log('\n🧪 Test 2: ISO string without milliseconds');
  const test2Data = {
    title: 'Test Session 2',
    start_time: startTime.toISOString().replace(/\.\d{3}Z$/, 'Z'),
    end_time: endTime.toISOString().replace(/\.\d{3}Z$/, 'Z')
  };
  
  const response2 = await makeRequest(`${PRODUCTION_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: test2Data
  });
  
  console.log('📥 Response 2:', response2.status, JSON.stringify(response2.data, null, 2));
  
  // Test 3: Different title formats
  console.log('\n🧪 Test 3: Different title formats');
  const test3Data = {
    title: 'A', // Single character
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString()
  };
  
  const response3 = await makeRequest(`${PRODUCTION_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: test3Data
  });
  
  console.log('📥 Response 3:', response3.status, JSON.stringify(response3.data, null, 2));
  
  // Test 4: Check if it's a middleware issue by testing a different endpoint
  console.log('\n🧪 Test 4: Testing profile endpoint (should work)');
  const profileResponse = await makeRequest(`${PRODUCTION_URL}/api/profile`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('📥 Profile response:', profileResponse.status, profileResponse.data);
}

testValidationIssue().catch(console.error);
