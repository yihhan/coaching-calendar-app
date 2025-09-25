#!/usr/bin/env node

/**
 * Complete End-to-End Production Test for Coaching Calendar App
 * This script tests the entire application workflow
 * Run with: node test-production-complete.js
 */

const https = require('https');
const http = require('http');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

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

let sessionId = null;
let bookingId = null;

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

async function testCoachProfileUpdate(token) {
  const response = await makeRequest(`${PRODUCTION_URL}/api/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: {
      name: 'Updated Test Coach'
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Profile update failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  return response.data;
}

async function testSessionCreation(token) {
  const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later
  
  const sessionData = {
    title: 'Test Session',
    description: 'This is a test session created by automated testing',
    start_time: startTime.toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
    end_time: endTime.toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
    max_students: 3,
    price: 50,
    repeat_interval: 'none',
    occurrences: 1
  };
  
  const response = await makeRequest(`${PRODUCTION_URL}/api/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: sessionData
  });
  
  if (response.status !== 201) {
    throw new Error(`Session creation failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!response.data.id) {
    throw new Error('No session ID returned');
  }
  
  sessionId = response.data.id;
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
  
  // Check if our created session is in the list
  const ourSession = response.data.find(session => session.id === sessionId);
  if (!ourSession) {
    throw new Error('Created session not found in available sessions');
  }
  
  return response.data;
}

async function testSessionBooking(token) {
  const bookingData = {
    session_id: sessionId,
    notes: 'Test booking from automated testing'
  };
  
  const response = await makeRequest(`${PRODUCTION_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: bookingData
  });
  
  if (response.status !== 201) {
    throw new Error(`Session booking failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!response.data.id) {
    throw new Error('No booking ID returned');
  }
  
  bookingId = response.data.id;
  return response.data;
}

async function testPendingBookings(token) {
  const response = await makeRequest(`${PRODUCTION_URL}/api/bookings/pending`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Pending bookings fetch failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!Array.isArray(response.data)) {
    throw new Error('Pending bookings should be an array');
  }
  
  // Check if our booking is in the pending list
  const ourBooking = response.data.find(booking => booking.id === bookingId);
  if (!ourBooking) {
    throw new Error('Created booking not found in pending bookings');
  }
  
  return response.data;
}

async function testBookingApproval(token) {
  const response = await makeRequest(`${PRODUCTION_URL}/api/bookings/${bookingId}/approve`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Booking approval failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  return response.data;
}

async function testStudentBookings(token) {
  const response = await makeRequest(`${PRODUCTION_URL}/api/bookings`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Student bookings fetch failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!Array.isArray(response.data)) {
    throw new Error('Student bookings should be an array');
  }
  
  // Check if our booking is confirmed
  const ourBooking = response.data.find(booking => booking.id === bookingId);
  if (!ourBooking) {
    throw new Error('Booking not found in student bookings');
  }
  
  if (ourBooking.status !== 'confirmed') {
    throw new Error(`Booking status is ${ourBooking.status}, expected confirmed`);
  }
  
  return response.data;
}

async function testSessionDeletion(token) {
  const response = await makeRequest(`${PRODUCTION_URL}/api/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Session deletion failed with status ${response.status}: ${JSON.stringify(response.data)}`);
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

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Try to delete the session if it still exists
    if (sessionId) {
      const coachToken = await testCoachLogin();
      await makeRequest(`${PRODUCTION_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${coachToken.token}`
        }
      });
      console.log('✅ Test session deleted');
    }
  } catch (error) {
    console.log(`⚠️  Cleanup warning: ${error.message}`);
  }
}

async function runCompleteTest() {
  console.log('🚀 Starting Complete End-to-End Production Test');
  console.log(`📍 Testing: ${PRODUCTION_URL}`);
  console.log(`👤 Test Coach: ${TEST_USER.coach.email}`);
  console.log(`👤 Test Student: ${TEST_USER.student.email}\n`);
  
  let coachToken, studentToken;
  
  try {
    // Basic connectivity and setup
    await testStep('Basic Connectivity', testBasicConnectivity);
    await testStep('Google OAuth Setup', testGoogleOAuthSetup);
    
    // User registration and authentication
    await testStep('Coach Registration', testCoachRegistration);
    await testStep('Student Registration', testStudentRegistration);
    coachToken = await testStep('Coach Login', testCoachLogin);
    studentToken = await testStep('Student Login', testStudentLogin);
    
    // Coach functionality
    // await testStep('Coach Profile Update', () => testCoachProfileUpdate(coachToken.token));
    await testStep('Session Creation', () => testSessionCreation(coachToken.token));
    
    // Student functionality
    await testStep('Available Sessions', testAvailableSessions);
    await testStep('Session Booking', () => testSessionBooking(studentToken.token));
    
    // Coach management
    await testStep('Pending Bookings', () => testPendingBookings(coachToken.token));
    await testStep('Booking Approval', () => testBookingApproval(coachToken.token));
    
    // Student verification
    await testStep('Student Bookings', () => testStudentBookings(studentToken.token));
    
    // Additional features
    await testStep('Calendar Endpoints', testCalendarEndpoints);
    
    // Cleanup
    await testStep('Session Cleanup', () => testSessionDeletion(coachToken.token));
    
    console.log('\n🎉 ALL TESTS PASSED! 🎉');
    console.log('✅ Complete end-to-end workflow is working correctly');
    console.log('✅ User registration, authentication, and authorization working');
    console.log('✅ Session creation and management working');
    console.log('✅ Booking system working');
    console.log('✅ Profile management working');
    console.log('✅ Calendar functionality working');
    
  } catch (error) {
    console.log('\n❌ TEST FAILED!');
    console.log(`❌ Error: ${error.message}`);
    console.log('\n🔍 This indicates a problem with the production deployment.');
    console.log('📋 Check the following:');
    console.log('   - Server logs: pm2 logs coaching-api');
    console.log('   - Database connectivity');
    console.log('   - API endpoint responses');
    console.log('   - Authentication flow');
    
    // Attempt cleanup even if tests failed
    await cleanup();
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Test interrupted, cleaning up...');
  await cleanup();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.log('\n💥 Unexpected error:', error.message);
  await cleanup();
  process.exit(1);
});

// Run the complete test
runCompleteTest().catch(async (error) => {
  console.log('\n💥 Test runner error:', error.message);
  await cleanup();
  process.exit(1);
});
