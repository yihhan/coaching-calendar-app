#!/usr/bin/env node

/**
 * Quick Session Creation Test
 * This script specifically tests session creation
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

async function testSessionCreation() {
  console.log('🔍 Testing Session Creation...');
  
  // Register and login coach
  const coachEmail = `sessioncoach${Date.now()}@example.com`;
  const coachData = {
    name: 'Session Coach',
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
    console.log('❌ Registration failed:', registerResponse.data);
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
    console.log('❌ Login failed:', loginResponse.data);
    return;
  }
  
  const token = loginResponse.data.token;
  console.log('✅ Coach logged in successfully');
  
  // Test session creation
  const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
  
  const sessionData = {
    title: 'Quick Test Session',
    description: 'Testing session creation',
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    max_students: 3,
    price: 50
  };
  
  console.log('📤 Creating session...');
  const sessionResponse = await makeRequest(`${PRODUCTION_URL}/api/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: sessionData
  });
  
  console.log('📥 Session creation response:', sessionResponse.status);
  console.log('📥 Response data:', JSON.stringify(sessionResponse.data, null, 2));
  
  if (sessionResponse.status === 201) {
    console.log('✅ Session creation is working!');
    console.log('🎉 The app is fully functional!');
  } else {
    console.log('❌ Session creation failed');
    console.log('🔍 This needs to be investigated');
  }
}

testSessionCreation().catch(console.error);
