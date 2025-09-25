#!/usr/bin/env node

/**
 * Debug Authentication Test
 * This script tests authentication and session creation step by step
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

async function debugAuthAndSession() {
  console.log('🔍 Debugging Authentication and Session Creation...');
  
  // Register coach
  const coachEmail = `authcoach${Date.now()}@example.com`;
  const coachData = {
    name: 'Auth Coach',
    email: coachEmail,
    password: 'testpass123',
    role: 'coach'
  };
  
  console.log('📝 Registering coach...');
  const registerResponse = await makeRequest(`${PRODUCTION_URL}/api/register`, {
    method: 'POST',
    body: coachData
  });
  
  console.log('📥 Registration response:', registerResponse.status, registerResponse.data);
  
  if (registerResponse.status !== 201) {
    console.log('❌ Registration failed');
    return;
  }
  
  // Login coach
  console.log('🔑 Logging in coach...');
  const loginResponse = await makeRequest(`${PRODUCTION_URL}/api/login`, {
    method: 'POST',
    body: {
      email: coachEmail,
      password: 'testpass123'
    }
  });
  
  console.log('📥 Login response:', loginResponse.status, loginResponse.data);
  
  if (loginResponse.status !== 200) {
    console.log('❌ Login failed');
    return;
  }
  
  const token = loginResponse.data.token;
  console.log('✅ Token received:', token.substring(0, 20) + '...');
  
  // Test authentication with a simple request
  console.log('🔐 Testing authentication...');
  const authTestResponse = await makeRequest(`${PRODUCTION_URL}/api/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  console.log('📥 Auth test response:', authTestResponse.status, authTestResponse.data);
  
  if (authTestResponse.status !== 200) {
    console.log('❌ Authentication test failed');
    return;
  }
  
  console.log('✅ Authentication working!');
  
  // Now try session creation with minimal data
  const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
  
  const minimalSessionData = {
    title: 'Minimal Test',
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString()
  };
  
  console.log('📤 Sending minimal session data:', JSON.stringify(minimalSessionData, null, 2));
  
  const sessionResponse = await makeRequest(`${PRODUCTION_URL}/api/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: minimalSessionData
  });
  
  console.log('📥 Session response:', sessionResponse.status, JSON.stringify(sessionResponse.data, null, 2));
  
  if (sessionResponse.status === 201) {
    console.log('✅ Session creation successful!');
  } else {
    console.log('❌ Session creation failed');
  }
}

debugAuthAndSession().catch(console.error);
