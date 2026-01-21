#!/usr/bin/env node

/**
 * Complete End-to-End Production Test with Real User Interactions
 * Tests the actual student-coach workflow on production
 * Run with: node test-production-e2e.js
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://www.calla.sg';
const TEST_USER = {
  coach: {
    name: 'Test Coach E2E',
    email: `testcoach${Date.now()}@example.com`,
    password: 'testpass123',
    role: 'coach'
  },
  student: {
    name: 'Test Student E2E', 
    email: `teststudent${Date.now()}@example.com`,
    password: 'testpass123',
    role: 'student'
  }
};

let sessionId = null;
let bookingId = null;
let coachToken = null;
let studentToken = null;

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
    req.setTimeout(20000, () => {
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
  
  coachToken = response.data.token;
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
  
  studentToken = response.data.token;
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
  
  coachToken = response.data.token;
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
  
  studentToken = response.data.token;
  return response.data;
}

async function testCoachProfileAccess() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/profile`, {
    headers: {
      'Authorization': `Bearer ${coachToken}`
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Coach profile access failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (response.data.role !== 'coach') {
    throw new Error(`Expected coach role, got ${response.data.role}`);
  }
  
  return response.data;
}

async function testStudentProfileAccess() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/profile`, {
    headers: {
      'Authorization': `Bearer ${studentToken}`
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Student profile access failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (response.data.role !== 'student') {
    throw new Error(`Expected student role, got ${response.data.role}`);
  }
  
  return response.data;
}

async function testCoachSessionsList() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/sessions/coach`, {
    headers: {
      'Authorization': `Bearer ${coachToken}`
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Coach sessions list failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!Array.isArray(response.data)) {
    throw new Error('Coach sessions should be an array');
  }
  
  return response.data;
}

async function testAvailableSessionsForStudent() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/sessions/available`);
  
  if (response.status !== 200) {
    throw new Error(`Available sessions failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!Array.isArray(response.data)) {
    throw new Error('Available sessions should be an array');
  }
  
  return response.data;
}

async function testSessionCreation() {
  // Create a session for tomorrow at 2 PM using the same format as frontend
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);
  
  const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000); // 1 hour later
  
  // Use the same formatDateTime function as the frontend
  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  const sessionData = {
    title: 'E2E Test Session',
    description: 'This session was created during end-to-end testing',
    start_time: formatDateTime(tomorrow),
    end_time: formatDateTime(endTime),
    max_students: 2,
    price: 25,
    repeat_interval: 'none',
    occurrences: 1
  };
  
  const response = await makeRequest(`${PRODUCTION_URL}/api/sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${coachToken}`
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
  console.log(`   📅 Created session ID: ${sessionId}`);
  return response.data;
}

async function testSessionAppearsInAvailableSessions() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/sessions/available`);
  
  if (response.status !== 200) {
    throw new Error(`Available sessions check failed with status ${response.status}`);
  }
  
  const ourSession = response.data.find(session => session.id === sessionId);
  if (!ourSession) {
    throw new Error(`Created session ${sessionId} not found in available sessions`);
  }
  
  if (ourSession.title !== 'E2E Test Session') {
    throw new Error(`Session title mismatch: expected 'E2E Test Session', got '${ourSession.title}'`);
  }
  
  console.log(`   📋 Session found in available sessions: ${ourSession.title}`);
  return ourSession;
}

async function testStudentBooking() {
  const bookingData = {
    session_id: sessionId,
    notes: 'E2E test booking'
  };
  
  const response = await makeRequest(`${PRODUCTION_URL}/api/bookings`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${studentToken}`
    },
    body: bookingData
  });
  
  if (response.status !== 201) {
    throw new Error(`Student booking failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  if (!response.data.id) {
    throw new Error('No booking ID returned');
  }
  
  bookingId = response.data.id;
  console.log(`   📝 Created booking ID: ${bookingId}`);
  return response.data;
}

async function testBookingAppearsInStudentBookings() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/bookings`, {
    headers: {
      'Authorization': `Bearer ${studentToken}`
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Student bookings fetch failed with status ${response.status}`);
  }
  
  const ourBooking = response.data.find(booking => booking.id === bookingId);
  if (!ourBooking) {
    throw new Error(`Booking ${bookingId} not found in student bookings`);
  }
  
  if (ourBooking.status !== 'pending') {
    throw new Error(`Expected booking status 'pending', got '${ourBooking.status}'`);
  }
  
  console.log(`   📋 Booking found in student bookings with status: ${ourBooking.status}`);
  return ourBooking;
}

async function testBookingAppearsInCoachPendingBookings() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/bookings/pending`, {
    headers: {
      'Authorization': `Bearer ${coachToken}`
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Coach pending bookings failed with status ${response.status}`);
  }
  
  const ourBooking = response.data.find(booking => booking.id === bookingId);
  if (!ourBooking) {
    throw new Error(`Booking ${bookingId} not found in coach pending bookings`);
  }
  
  if (ourBooking.status !== 'pending') {
    throw new Error(`Expected booking status 'pending', got '${ourBooking.status}'`);
  }
  
  console.log(`   📋 Booking found in coach pending bookings with status: ${ourBooking.status}`);
  return ourBooking;
}

async function testCoachApprovesBooking() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/bookings/${bookingId}/approve`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${coachToken}`
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Booking approval failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  console.log(`   ✅ Coach approved booking ${bookingId}`);
  return response.data;
}

async function testBookingStatusUpdatedToConfirmed() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/bookings`, {
    headers: {
      'Authorization': `Bearer ${studentToken}`
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Student bookings check failed with status ${response.status}`);
  }
  
  const ourBooking = response.data.find(booking => booking.id === bookingId);
  if (!ourBooking) {
    throw new Error(`Booking ${bookingId} not found in student bookings`);
  }
  
  if (ourBooking.status !== 'confirmed') {
    throw new Error(`Expected booking status 'confirmed', got '${ourBooking.status}'`);
  }
  
  console.log(`   ✅ Booking status updated to: ${ourBooking.status}`);
  return ourBooking;
}

async function testSessionCapacityUpdated() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/sessions/available`);
  
  if (response.status !== 200) {
    throw new Error(`Available sessions check failed with status ${response.status}`);
  }
  
  const ourSession = response.data.find(session => session.id === sessionId);
  if (!ourSession) {
    throw new Error(`Session ${sessionId} not found in available sessions`);
  }
  
  // Check if the session shows the correct booking count
  if (ourSession.held_count !== 1) {
    throw new Error(`Expected held_count to be 1, got ${ourSession.held_count}`);
  }
  
  console.log(`   📊 Session capacity updated: ${ourSession.held_count}/${ourSession.max_students} students`);
  return ourSession;
}

async function testSessionDeletion() {
  const response = await makeRequest(`${PRODUCTION_URL}/api/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${coachToken}`
    }
  });
  
  if (response.status !== 200) {
    throw new Error(`Session deletion failed with status ${response.status}: ${JSON.stringify(response.data)}`);
  }
  
  console.log(`   🗑️  Session ${sessionId} deleted successfully`);
  return response.data;
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Try to delete the session if it still exists
    if (sessionId && coachToken) {
      await makeRequest(`${PRODUCTION_URL}/api/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${coachToken}`
        }
      });
      console.log('✅ Test session deleted');
    }
  } catch (error) {
    console.log(`⚠️  Cleanup warning: ${error.message}`);
  }
}

async function runCompleteE2ETest() {
  console.log('🚀 Starting Complete End-to-End Production Test');
  console.log(`📍 Testing: ${PRODUCTION_URL}`);
  console.log(`👤 Test Coach: ${TEST_USER.coach.email}`);
  console.log(`👤 Test Student: ${TEST_USER.student.email}\n`);
  
  try {
    // User registration and authentication
    await testStep('Coach Registration', testCoachRegistration);
    await testStep('Student Registration', testStudentRegistration);
    await testStep('Coach Login', testCoachLogin);
    await testStep('Student Login', testStudentLogin);
    
    // Profile access verification
    await testStep('Coach Profile Access', testCoachProfileAccess);
    await testStep('Student Profile Access', testStudentProfileAccess);
    
    // Coach functionality
    await testStep('Coach Sessions List', testCoachSessionsList);
    await testStep('Session Creation', testSessionCreation);
    
    // Student functionality
    await testStep('Available Sessions for Student', testAvailableSessionsForStudent);
    await testStep('Session Appears in Available Sessions', testSessionAppearsInAvailableSessions);
    
    // Student-Coach Interaction
    await testStep('Student Books Session', testStudentBooking);
    await testStep('Booking Appears in Student Bookings', testBookingAppearsInStudentBookings);
    await testStep('Booking Appears in Coach Pending Bookings', testBookingAppearsInCoachPendingBookings);
    
    // Coach approval workflow
    await testStep('Coach Approves Booking', testCoachApprovesBooking);
    await testStep('Booking Status Updated to Confirmed', testBookingStatusUpdatedToConfirmed);
    await testStep('Session Capacity Updated', testSessionCapacityUpdated);
    
    // Cleanup
    await testStep('Session Cleanup', testSessionDeletion);
    
    console.log('\n🎉 COMPLETE END-TO-END TEST PASSED! 🎉');
    console.log('✅ User registration and authentication working');
    console.log('✅ Coach can create sessions');
    console.log('✅ Students can see available sessions');
    console.log('✅ Students can book sessions');
    console.log('✅ Coaches can see pending bookings');
    console.log('✅ Coaches can approve bookings');
    console.log('✅ Booking status updates correctly');
    console.log('✅ Session capacity tracking working');
    console.log('✅ Complete student-coach workflow functional');
    
    console.log('\n📋 Production Status: FULLY FUNCTIONAL');
    console.log('🚀 Your coaching calendar app is ready for real users!');
    
  } catch (error) {
    console.log('\n❌ END-TO-END TEST FAILED!');
    console.log(`❌ Error: ${error.message}`);
    console.log('\n🔍 This indicates a problem with the core business logic.');
    console.log('📋 The student-coach interaction workflow is broken.');
    console.log('📋 Check the following:');
    console.log('   - Session creation and management');
    console.log('   - Booking system');
    console.log('   - Approval workflow');
    console.log('   - Database relationships');
    console.log('   - API endpoint logic');
    
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

// Run the complete E2E test
runCompleteE2ETest().catch(async (error) => {
  console.log('\n💥 Test runner error:', error.message);
  await cleanup();
  process.exit(1);
});
