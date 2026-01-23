#!/usr/bin/env node

/**
 * Enhanced End-to-End Test Suite for www.calla.sg
 * Tests complete user workflows: registration, authentication, session creation, booking
 */

const axios = require('axios');
const BASE_URL = 'https://www.calla.sg';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(70));
  log(title, 'cyan');
  console.log('='.repeat(70));
}

function logTest(name) {
  log(`\n🧪 Testing: ${name}`, 'blue');
}

function logSuccess(message) {
  log(`  ✅ ${message}`, 'green');
}

function logError(message) {
  log(`  ❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`  ⚠️  ${message}`, 'yellow');
}

// Test data with unique timestamps
const timestamp = Date.now();
const TEST_USERS = {
  coach: {
    name: `E2E Test Coach ${timestamp}`,
    email: `e2e.coach.${timestamp}@test.calla.sg`,
    password: 'TestPass123!',
    role: 'coach'
  },
  student: {
    name: `E2E Test Student ${timestamp}`,
    email: `e2e.student.${timestamp}@test.calla.sg`,
    password: 'TestPass123!',
    role: 'student'
  }
};

let coachToken = null;
let studentToken = null;
let createdSessionId = null;
let createdBookingId = null;

// Helper function to make requests
async function makeRequest(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true // Don't throw on any status
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return {
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      status: 0,
      data: null,
      error: error.message,
      headers: {}
    };
  }
}

// Test: User Registration
async function testUserRegistration() {
  logSection('USER REGISTRATION TESTS');
  
  // Test Coach Registration
  logTest('Coach Registration');
  const coachRegResponse = await makeRequest('POST', '/api/register', TEST_USERS.coach);
  if (coachRegResponse.status === 201 && coachRegResponse.data.token) {
    coachToken = coachRegResponse.data.token;
    logSuccess(`Coach registered: ${TEST_USERS.coach.email}`);
    logSuccess(`Token received: ${coachToken.substring(0, 20)}...`);
  } else {
    // Check if user already exists
    if (coachRegResponse.status === 400 && coachRegResponse.data.error?.includes('already exists')) {
      logWarning('Coach already exists, will try login instead');
    } else {
      logError(`Coach registration failed: Status ${coachRegResponse.status}, ${JSON.stringify(coachRegResponse.data)}`);
    }
  }
  
  // Test Student Registration
  logTest('Student Registration');
  const studentRegResponse = await makeRequest('POST', '/api/register', TEST_USERS.student);
  if (studentRegResponse.status === 201 && studentRegResponse.data.token) {
    studentToken = studentRegResponse.data.token;
    logSuccess(`Student registered: ${TEST_USERS.student.email}`);
    logSuccess(`Token received: ${studentToken.substring(0, 20)}...`);
  } else {
    // Check if user already exists
    if (studentRegResponse.status === 400 && studentRegResponse.data.error?.includes('already exists')) {
      logWarning('Student already exists, will try login instead');
    } else {
      logError(`Student registration failed: Status ${studentRegResponse.status}, ${JSON.stringify(studentRegResponse.data)}`);
    }
  }
}

// Test: User Login
async function testUserLogin() {
  logSection('USER LOGIN TESTS');
  
  // If registration failed, try login
  if (!coachToken) {
    logTest('Coach Login (fallback)');
    const coachLoginResponse = await makeRequest('POST', '/api/login', {
      email: TEST_USERS.coach.email,
      password: TEST_USERS.coach.password
    });
    if (coachLoginResponse.status === 200 && coachLoginResponse.data.token) {
      coachToken = coachLoginResponse.data.token;
      logSuccess(`Coach logged in: ${TEST_USERS.coach.email}`);
    } else {
      logError(`Coach login failed: Status ${coachLoginResponse.status}`);
    }
  }
  
  if (!studentToken) {
    logTest('Student Login (fallback)');
    const studentLoginResponse = await makeRequest('POST', '/api/login', {
      email: TEST_USERS.student.email,
      password: TEST_USERS.student.password
    });
    if (studentLoginResponse.status === 200 && studentLoginResponse.data.token) {
      studentToken = studentLoginResponse.data.token;
      logSuccess(`Student logged in: ${TEST_USERS.student.email}`);
    } else {
      logError(`Student login failed: Status ${studentLoginResponse.status}`);
    }
  }
}

// Test: Profile Access
async function testProfileAccess() {
  logSection('PROFILE ACCESS TESTS');
  
  if (coachToken) {
    logTest('Coach Profile Access');
    const profileResponse = await makeRequest('GET', '/api/profile', null, coachToken);
    if (profileResponse.status === 200 && profileResponse.data.email === TEST_USERS.coach.email) {
      logSuccess(`Coach profile retrieved: ${profileResponse.data.name}`);
    } else {
      logError(`Coach profile access failed: Status ${profileResponse.status}`);
    }
  }
  
  if (studentToken) {
    logTest('Student Profile Access');
    const profileResponse = await makeRequest('GET', '/api/profile', null, studentToken);
    if (profileResponse.status === 200 && profileResponse.data.email === TEST_USERS.student.email) {
      logSuccess(`Student profile retrieved: ${profileResponse.data.name}`);
    } else {
      logError(`Student profile access failed: Status ${profileResponse.status}`);
    }
  }
}

// Test: Session Creation
async function testSessionCreation() {
  logSection('SESSION CREATION TESTS');
  
  if (!coachToken) {
    logWarning('Skipping session creation - coach token not available');
    return;
  }
  
  logTest('Create Public Session');
  const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
  const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour later
  
  const sessionData = {
    title: `E2E Test Session ${timestamp}`,
    description: 'This is a test session created by end-to-end testing',
    start_time: startTime.toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm
    end_time: endTime.toISOString().slice(0, 16),
    max_students: 3,
    price: 50,
    visibility: 'public',
    repeat_interval: 'none',
    occurrences: 1
  };
  
  const sessionResponse = await makeRequest('POST', '/api/sessions', sessionData, coachToken);
  if (sessionResponse.status === 201) {
    // Session creation returns { created: [{ id, ... }], created_count, ... }
    if (sessionResponse.data.created && sessionResponse.data.created.length > 0) {
      createdSessionId = sessionResponse.data.created[0].id;
      logSuccess(`Session created: ID ${createdSessionId}`);
      logSuccess(`Title: ${sessionResponse.data.created[0].title}`);
      logSuccess(`Created count: ${sessionResponse.data.created_count}`);
    } else if (sessionResponse.data.id) {
      // Fallback for single session response format
      createdSessionId = sessionResponse.data.id;
      logSuccess(`Session created: ID ${createdSessionId}`);
      logSuccess(`Title: ${sessionResponse.data.title}`);
    } else {
      logError(`Session creation succeeded but no session ID found: ${JSON.stringify(sessionResponse.data)}`);
    }
  } else {
    logError(`Session creation failed: Status ${sessionResponse.status}, ${JSON.stringify(sessionResponse.data)}`);
  }
}

// Test: Available Sessions
async function testAvailableSessions() {
  logSection('AVAILABLE SESSIONS TESTS');
  
  logTest('Get Available Sessions (authenticated)');
  const availableResponse = await makeRequest('GET', '/api/sessions/available', null, studentToken);
  if (availableResponse.status === 200 && Array.isArray(availableResponse.data)) {
    logSuccess(`Retrieved ${availableResponse.data.length} available sessions`);
    if (createdSessionId) {
      const foundSession = availableResponse.data.find(s => s.id === createdSessionId);
      if (foundSession) {
        logSuccess(`Created test session found in available sessions`);
      } else {
        logWarning(`Created test session not found (may be filtered or not yet visible)`);
      }
    }
  } else {
    logError(`Available sessions fetch failed: Status ${availableResponse.status}`);
  }
  
  logTest('Get Calendar Sessions (public)');
  const calendarResponse = await makeRequest('GET', '/api/sessions/calendar');
  if (calendarResponse.status === 200 && Array.isArray(calendarResponse.data)) {
    logSuccess(`Retrieved ${calendarResponse.data.length} calendar sessions`);
  } else {
    logError(`Calendar sessions fetch failed: Status ${calendarResponse.status}`);
  }
}

// Test: Session Booking
async function testSessionBooking() {
  logSection('SESSION BOOKING TESTS');
  
  if (!studentToken || !createdSessionId) {
    logWarning('Skipping booking test - student token or session ID not available');
    return;
  }
  
  logTest('Book Session');
  const bookingData = {
    session_id: createdSessionId,
    notes: 'E2E test booking'
  };
  
  const bookingResponse = await makeRequest('POST', '/api/bookings', bookingData, studentToken);
  if (bookingResponse.status === 201) {
    // Booking response can be { booking: { id, ... } } or { id, ... }
    if (bookingResponse.data.booking && bookingResponse.data.booking.id) {
      createdBookingId = bookingResponse.data.booking.id;
      logSuccess(`Booking created: ID ${createdBookingId}`);
      logSuccess(`Status: ${bookingResponse.data.booking.status}`);
    } else if (bookingResponse.data.id) {
      createdBookingId = bookingResponse.data.id;
      logSuccess(`Booking created: ID ${createdBookingId}`);
      logSuccess(`Status: ${bookingResponse.data.status}`);
    } else {
      logError(`Booking succeeded but no booking ID found: ${JSON.stringify(bookingResponse.data)}`);
    }
  } else {
    logError(`Booking failed: Status ${bookingResponse.status}, ${JSON.stringify(bookingResponse.data)}`);
  }
}

// Test: Booking Management
async function testBookingManagement() {
  logSection('BOOKING MANAGEMENT TESTS');
  
  if (!studentToken) {
    logWarning('Skipping student bookings test - student token not available');
  } else {
    logTest('Get Student Bookings');
    const studentBookingsResponse = await makeRequest('GET', '/api/bookings/student', null, studentToken);
    if (studentBookingsResponse.status === 200 && Array.isArray(studentBookingsResponse.data)) {
      logSuccess(`Retrieved ${studentBookingsResponse.data.length} student bookings`);
      if (createdBookingId) {
        const foundBooking = studentBookingsResponse.data.find(b => b.id === createdBookingId);
        if (foundBooking) {
          logSuccess(`Created test booking found in student bookings`);
        }
      }
    } else {
      logError(`Student bookings fetch failed: Status ${studentBookingsResponse.status}, ${JSON.stringify(studentBookingsResponse.data)}`);
    }
  }
  
  if (!coachToken) {
    logWarning('Skipping pending bookings test - coach token not available');
  } else {
    logTest('Get Pending Bookings (Coach)');
    const pendingBookingsResponse = await makeRequest('GET', '/api/bookings/pending', null, coachToken);
    if (pendingBookingsResponse.status === 200 && Array.isArray(pendingBookingsResponse.data)) {
      logSuccess(`Retrieved ${pendingBookingsResponse.data.length} pending bookings`);
      if (createdBookingId) {
        const foundBooking = pendingBookingsResponse.data.find(b => b.id === createdBookingId);
        if (foundBooking) {
          logSuccess(`Created test booking found in pending bookings`);
        }
      }
    } else {
      logError(`Pending bookings fetch failed: Status ${pendingBookingsResponse.status}`);
    }
  }
}

// Test: Coach Sessions
async function testCoachSessions() {
  logSection('COACH SESSIONS TESTS');
  
  if (!coachToken) {
    logWarning('Skipping coach sessions test - coach token not available');
    return;
  }
  
  logTest('Get Coach Sessions');
  const coachSessionsResponse = await makeRequest('GET', '/api/sessions/coach', null, coachToken);
  if (coachSessionsResponse.status === 200 && Array.isArray(coachSessionsResponse.data)) {
    logSuccess(`Retrieved ${coachSessionsResponse.data.length} coach sessions`);
    if (createdSessionId) {
      const foundSession = coachSessionsResponse.data.find(s => s.id === createdSessionId);
      if (foundSession) {
        logSuccess(`Created test session found in coach sessions`);
      }
    }
  } else {
    logError(`Coach sessions fetch failed: Status ${coachSessionsResponse.status}`);
  }
}

// Test: Public Endpoints
async function testPublicEndpoints() {
  logSection('PUBLIC ENDPOINTS TESTS');
  
  logTest('Get All Coaches');
  const coachesResponse = await makeRequest('GET', '/api/coaches');
  if (coachesResponse.status === 200 && Array.isArray(coachesResponse.data)) {
    logSuccess(`Retrieved ${coachesResponse.data.length} coaches`);
  } else {
    logError(`Coaches fetch failed: Status ${coachesResponse.status}`);
  }
}

// Cleanup: Delete test session
async function cleanup() {
  logSection('CLEANUP');
  
  if (coachToken && createdSessionId) {
    logTest('Delete Test Session');
    const deleteResponse = await makeRequest('DELETE', `/api/sessions/${createdSessionId}`, null, coachToken);
    if (deleteResponse.status === 200) {
      logSuccess(`Test session ${createdSessionId} deleted`);
    } else {
      logWarning(`Failed to delete test session: Status ${deleteResponse.status}`);
    }
  } else {
    logWarning('Skipping cleanup - no session to delete');
  }
}

// Main test runner
async function runE2ETests() {
  log('\n🚀 STARTING END-TO-END TESTS FOR www.calla.sg 🚀', 'cyan');
  log(`Testing: ${BASE_URL}`, 'cyan');
  log(`Test Coach: ${TEST_USERS.coach.email}`, 'cyan');
  log(`Test Student: ${TEST_USERS.student.email}`, 'cyan');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0
  };
  
  try {
    await testPublicEndpoints();
    await testUserRegistration();
    await testUserLogin();
    
    if (!coachToken || !studentToken) {
      logError('\n❌ Cannot proceed with authenticated tests - missing tokens');
      logWarning('This may be due to registration/login failures or existing users');
      process.exit(1);
    }
    
    await testProfileAccess();
    await testSessionCreation();
    await testCoachSessions();
    await testAvailableSessions();
    await testSessionBooking();
    await testBookingManagement();
    
    // Cleanup
    await cleanup();
    
    logSection('E2E TEST SUMMARY');
    log('✅ All end-to-end tests completed!', 'green');
    log('\n📋 Summary:', 'cyan');
    log(`   - Test users created/logged in: ${coachToken && studentToken ? 'Yes' : 'No'}`, 'blue');
    log(`   - Session created: ${createdSessionId ? `Yes (ID: ${createdSessionId})` : 'No'}`, 'blue');
    log(`   - Booking created: ${createdBookingId ? `Yes (ID: ${createdBookingId})` : 'No'}`, 'blue');
    
  } catch (error) {
    logError(`\n❌ Test suite error: ${error.message}`);
    logError(`Stack: ${error.stack}`);
    
    // Attempt cleanup even on error
    await cleanup();
    process.exit(1);
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  log('\n🛑 Test interrupted, cleaning up...', 'yellow');
  await cleanup();
  process.exit(0);
});

// Run tests
if (require.main === module) {
  runE2ETests().catch(async (error) => {
    logError(`\n💥 Fatal error: ${error.message}`);
    await cleanup();
    process.exit(1);
  });
}

module.exports = { runE2ETests };

