#!/usr/bin/env node

/**
 * Debug Production Session Creation
 * Let's see what's actually happening with session creation
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://calla.sg';

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
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

async function debugSessionCreation() {
  console.log('🔍 Debugging Session Creation on Production...\n');
  
  // First, let's register a coach and get a token
  console.log('1. Registering test coach...');
  const registerResponse = await makeRequest(`${PRODUCTION_URL}/api/register`, {
    method: 'POST',
    body: {
      name: 'Debug Coach',
      email: `debugcoach${Date.now()}@example.com`,
      password: 'testpass123',
      role: 'coach'
    }
  });
  
  console.log(`   Status: ${registerResponse.status}`);
  console.log(`   Response: ${JSON.stringify(registerResponse.data, null, 2)}`);
  
  if (registerResponse.status !== 201) {
    console.log('❌ Coach registration failed');
    return;
  }
  
  const token = registerResponse.data.token;
  console.log(`✅ Got token: ${token.substring(0, 20)}...\n`);
  
  // Now let's try different session creation formats
  const testCases = [
    {
      name: 'Minimal valid data',
      data: {
        title: 'Test Session',
        start_time: '2024-01-01T10:00:00.000Z',
        end_time: '2024-01-01T11:00:00.000Z'
      }
    },
    {
      name: 'With all optional fields',
      data: {
        title: 'Test Session',
        description: 'Test description',
        start_time: '2024-01-01T10:00:00.000Z',
        end_time: '2024-01-01T11:00:00.000Z',
        max_students: 5,
        price: 50
      }
    },
    {
      name: 'Future date',
      data: {
        title: 'Future Session',
        start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString()
      }
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n2. Testing: ${testCase.name}`);
    console.log(`   Data: ${JSON.stringify(testCase.data, null, 2)}`);
    
    const response = await makeRequest(`${PRODUCTION_URL}/api/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: testCase.data
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   Response: ${JSON.stringify(response.data, null, 2)}`);
    
    if (response.status === 201) {
      console.log('✅ Session creation successful!');
      break;
    } else {
      console.log('❌ Session creation failed');
    }
  }
  
  // Let's also check what endpoints exist
  console.log('\n3. Checking available endpoints...');
  const endpoints = [
    '/api/sessions',
    '/api/sessions/coach',
    '/api/sessions/available',
    '/api/sessions/calendar'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${PRODUCTION_URL}${endpoint}`);
      console.log(`   ${endpoint}: ${response.status}`);
    } catch (error) {
      console.log(`   ${endpoint}: ERROR - ${error.message}`);
    }
  }
}

debugSessionCreation().catch(console.error);
