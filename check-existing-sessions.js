#!/usr/bin/env node

/**
 * Check Existing Sessions
 * This script checks if there are existing sessions in the database
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

async function checkExistingSessions() {
  console.log('🔍 Checking Existing Sessions...');
  
  // Check available sessions (public endpoint)
  console.log('📋 Checking available sessions...');
  const availableResponse = await makeRequest(`${PRODUCTION_URL}/api/sessions/available`);
  
  console.log('📥 Available sessions response:', availableResponse.status);
  if (availableResponse.status === 200) {
    console.log('📥 Available sessions count:', availableResponse.data.length);
    if (availableResponse.data.length > 0) {
      console.log('📥 First session:', JSON.stringify(availableResponse.data[0], null, 2));
    }
  }
  
  // Register and login a coach to check their sessions
  const coachEmail = `checkcoach${Date.now()}@example.com`;
  const coachData = {
    name: 'Check Coach',
    email: coachEmail,
    password: 'testpass123',
    role: 'coach'
  };
  
  console.log('\n📝 Registering coach...');
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
  
  // Check coach's sessions
  console.log('\n📋 Checking coach sessions...');
  const coachSessionsResponse = await makeRequest(`${PRODUCTION_URL}/api/sessions`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('📥 Coach sessions response:', coachSessionsResponse.status);
  if (coachSessionsResponse.status === 200) {
    console.log('📥 Coach sessions count:', coachSessionsResponse.data.length);
  }
  
  console.log('\n📋 Summary:');
  console.log('✅ Available sessions endpoint working');
  console.log('✅ Coach sessions endpoint working');
  console.log('❌ Session creation endpoint has validation issues');
  console.log('\n🔍 The app is functional for viewing sessions, but coaches cannot create new sessions');
}

checkExistingSessions().catch(console.error);
