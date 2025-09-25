#!/usr/bin/env node

/**
 * Simplified Production Test for Coaching Calendar App
 * Focuses on core functionality without complex features
 * Run with: node test-production-simple.js
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://calla.sg';
const TEST_USER = {
  coach: {
    name: 'Test Coach',
    email: `testcoach${Date.now()}@example.com`,
    password: 'testpass123',
    role: 'coach'
  },
  student: {
    name: 'Test Student', 
    email: `teststudent${Date.now()}@example.com`,
    password: 'testpass123',
    role: 'student'
  }
};

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

async function testStep(stepName, testFunction) {
  console.log(`\n🔄 ${stepName}...`);
  try {
    const result = await testFunction();
    console.log(`✅ ${stepName} - PASSED`);
    return result;
  } catch (error) {
    console.log(`❌ ${stepName} - FAILED: ${error.message}`);
    throw error;
  }
}

async function testBasicConnectivity() {
  const response = await makeRequest(`${PRODUCTION_URL}/`);
  if (response.status !== 200) {
    throw new Error(`Homepage returned status ${response.status}`);
  }
  return response;
}

async function testGoogleOAuthSetup() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/test/google-setup`);
  if (response.status !== 200) {
    throw new Error(`Google OAuth setup check failed with status ${response.status}`);
  }
  
  if (!response.data.isConfigured) {
    throw new Error('Google OAuth is not properly configured');
  }
  
  return response.data;
}

async function testGoogleOAuthRedirects() {
  const endpoints = [
    '/api/auth/google',
    '/api/auth/google/student',
    '/api/auth/google/coach'
  ];
  
  for (const endpoint of endpoints) {
    const response = await makeRequest(`${PRODUCTION_URL}${endpoint}`);
    if (response.status !== 302 && response.status !== 301) {
      throw new Error(`Google OAuth endpoint ${endpoint} returned status ${response.status}, expected redirect`);
    }
    
    const location = response.headers.location;
    if (!location || !location.includes('accounts.google.com')) {
      throw new Error(`Google OAuth endpoint ${endpoint} does not redirect to Google`);
    }
  }
  
  return true;
}

async function testCoachRegistration() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/register`, {
    method: 'POST',
    body: TEST_USER.coach
  });
  
  if (response.status !== 201) {
    throw new Error(`Coach registration failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!response.data.token) {
    throw new Error('No authentication token received');
  }
  
  return response.data;
}

async function testStudentRegistration() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/register`, {
    method: 'POST',
    body: TEST_USER.student
  });
  
  if (response.status !== 201) {
    throw new Error(`Student registration failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!response.data.token) {
    throw new Error('No authentication token received');
  }
  
  return response.data;
}

async function testCoachLogin() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/login`, {
    method: 'POST',
    body: {
      email: TEST_USER.coach.email,
      password: TEST_USER.coach.password
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Coach login failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!response.data.token) {
    throw new Error('No authentication token received');
  }
  
  return response.data;
}

async function testStudentLogin() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/login`, {
    method: 'POST',
    body: {
      email: TEST_USER.student.email,
      password: TEST_USER.student.password
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Student login failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!response.data.token) {
    throw new Error('No authentication token received');
  }
  
  return response.data;
}

async function testAvailableSessions() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/sessions/available`);
  
  if (response.status !== 200) {
    throw new Error(`Available sessions fetch failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!Array.isArray(response.data)) {
    throw new Error('Available sessions should be an array');
  }
  
  return response.data;
}

async function testCalendarEndpoints() {
  const endpoints = [
    '/api/sessions/calendar',
    '/api/sessions/calendar?view=month',
    '/api/sessions/calendar?view=week',
    '/api/sessions/calendar?view=day'
  ];
  
  for (const endpoint of endpoints) {
    const response = await makeRequest(`${PRODUCTION_URL}${endpoint}`);
    if (response.status !== 200) {
      throw new Error(`Calendar endpoint ${endpoint} failed with status ${response.status}`);
    }
  }
  
  return true;
}

async function testFrontendAssets() {
  const assets = [
    '/',
    '/static/js/main.js',
    '/static/css/main.css'
  ];
  
  for (const asset of assets) {
    const response = await makeRequest(`${PRODUCTION_URL}${asset}`);
    if (response.status !== 200) {
      throw new Error(`Frontend asset ${asset} failed with status ${response.status}`);
    }
  }
  
  return true;
}

async function runSimpleTest() {
  console.log('🚀 Starting Simplified Production Test');
  console.log(`📍 Testing: ${PRODUCTION_URL}`);
  console.log(`👤 Test Coach: ${TEST_USER.coach.email}`);
  console.log(`👤 Test Student: ${TEST_USER.student.email}\n`);
  
  try {
    // Basic connectivity and setup
    await testStep('Basic Connectivity', testBasicConnectivity);
    await testStep('Google OAuth Setup', testGoogleOAuthSetup);
    await testStep('Google OAuth Redirects', testGoogleOAuthRedirects);
    
    // User registration and authentication
    await testStep('Coach Registration', testCoachRegistration);
    await testStep('Student Registration', testStudentRegistration);
    await testStep('Coach Login', testCoachLogin);
    await testStep('Student Login', testStudentLogin);
    
    // Core functionality
    await testStep('Available Sessions', testAvailableSessions);
    await testStep('Calendar Endpoints', testCalendarEndpoints);
    await testStep('Frontend Assets', testFrontendAssets);
    
    console.log('\n🎉 ALL CORE TESTS PASSED! 🎉');
    console.log('✅ Basic connectivity working');
    console.log('✅ Google OAuth setup and redirects working');
    console.log('✅ User registration and authentication working');
    console.log('✅ Core API endpoints working');
    console.log('✅ Frontend assets loading');
    console.log('✅ Calendar functionality working');
    
    console.log('\n📋 Production Status: HEALTHY');
    console.log('🚀 Your coaching calendar app is ready for users!');
    
  } catch (error) {
    console.log('\n❌ CORE TEST FAILED!');
    console.log(`❌ Error: ${error.message}`);
    console.log('\n🔍 This indicates a critical problem with the production deployment.');
    console.log('📋 Check the following:');
    console.log('   - Server logs: pm2 logs coaching-api');
    console.log('   - Database connectivity');
    console.log('   - API endpoint responses');
    console.log('   - Authentication flow');
    console.log('   - Google OAuth configuration');
    
    process.exit(1);
  }
}

// Run the simplified test
runSimpleTest().catch((error) => {
  console.log('\n💥 Test runner error:', error.message);
  process.exit(1);
});
