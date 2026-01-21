/**
 * Comprehensive Session Creation Test Suite for www.calla.sg
 * Tests various session creation scenarios
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
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
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

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function recordTest(name, passed, message) {
  results.tests.push({ name, passed, message });
  if (passed) {
    results.passed++;
    logSuccess(message);
  } else {
    results.failed++;
    logError(message);
  }
}

// Helper to make authenticated requests
async function makeRequest(method, url, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json'
      },
      validateStatus: () => true
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response;
  } catch (error) {
    return {
      status: 0,
      data: null,
      error: error.message
    };
  }
}

// Create test coach account
async function createTestCoach() {
  const email = `testcoach${Date.now()}@example.com`;
  const password = 'testpass123';
  
  const response = await makeRequest('POST', '/api/register', {
    name: 'Test Coach',
    email,
    password,
    role: 'coach'
  });
  
  if (response.status === 201 && response.data.token) {
    return { token: response.data.token, email, password };
  }
  
  // If registration fails (user exists), try login
  const loginResponse = await makeRequest('POST', '/api/login', {
    email,
    password
  });
  
  if (loginResponse.status === 200 && loginResponse.data.token) {
    return { token: loginResponse.data.token, email, password };
  }
  
  throw new Error('Failed to create or login test coach');
}

// Test 1: Basic Session Creation
async function testBasicSessionCreation(token) {
  logTest('Basic Session Creation');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(14, 0, 0, 0);
  
  const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000); // 1 hour later
  
  // Try ISO8601 format with seconds
  const sessionData = {
    title: 'Test Session Basic',
    description: 'Basic test session',
    start_time: tomorrow.toISOString(),
    end_time: endTime.toISOString(),
    max_students: 2,
    price: 25
  };
  
  const response = await makeRequest('POST', '/api/sessions', sessionData, token);
  
  if (response.status === 201) {
    recordTest('Basic Session Creation', true, `Session created with ID: ${response.data.id || response.data.created?.[0]?.id}`);
    return response.data;
  } else {
    recordTest('Basic Session Creation', false, `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
    return null;
  }
}

// Test 2: Session with ISO8601 without seconds
async function testSessionISO8601NoSeconds(token) {
  logTest('Session Creation - ISO8601 without seconds');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(15, 0, 0, 0);
  
  const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000);
  
  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  const sessionData = {
    title: 'Test Session ISO8601',
    description: 'Test with ISO8601 format without seconds',
    start_time: formatDateTime(tomorrow),
    end_time: formatDateTime(endTime),
    max_students: 3,
    price: 30
  };
  
  const response = await makeRequest('POST', '/api/sessions', sessionData, token);
  
  if (response.status === 201) {
    recordTest('ISO8601 without seconds', true, 'Session created successfully');
    return response.data;
  } else {
    recordTest('ISO8601 without seconds', false, `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
    return null;
  }
}

// Test 3: Session with visibility options
async function testSessionWithVisibility(token) {
  logTest('Session Creation - With Visibility Options');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  tomorrow.setHours(10, 0, 0, 0);
  
  const endTime = new Date(tomorrow.getTime() + 60 * 60 * 1000);
  
  const sessionData = {
    title: 'Test Session Public Visibility',
    description: 'Test session with public visibility',
    start_time: tomorrow.toISOString(),
    end_time: endTime.toISOString(),
    max_students: 5,
    price: 20,
    visibility: 'public'
  };
  
  const response = await makeRequest('POST', '/api/sessions', sessionData, token);
  
  if (response.status === 201) {
    recordTest('Session with visibility', true, 'Public visibility session created');
    return response.data;
  } else {
    recordTest('Session with visibility', false, `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
    return null;
  }
}

// Test 4: Session with subscribers_only visibility
async function testSessionSubscribersOnly(token) {
  logTest('Session Creation - Subscribers Only Visibility');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 3);
  tomorrow.setHours(11, 0, 0, 0);
  
  const endTime = new Date(tomorrow.getTime() + 90 * 60 * 1000); // 1.5 hours
  
  const sessionData = {
    title: 'Test Session Subscribers Only',
    description: 'Test session with subscribers_only visibility',
    start_time: tomorrow.toISOString(),
    end_time: endTime.toISOString(),
    max_students: 3,
    price: 35,
    visibility: 'subscribers_only'
  };
  
  const response = await makeRequest('POST', '/api/sessions', sessionData, token);
  
  if (response.status === 201) {
    recordTest('Subscribers only session', true, 'Subscribers_only visibility session created');
    return response.data;
  } else {
    recordTest('Subscribers only session', false, `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
    return null;
  }
}

// Test 5: Recurring session (weekly)
async function testRecurringSession(token) {
  logTest('Session Creation - Recurring Weekly Session');
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(16, 0, 0, 0);
  
  const endTime = new Date(nextWeek.getTime() + 60 * 60 * 1000);
  
  const sessionData = {
    title: 'Test Recurring Weekly Session',
    description: 'Weekly recurring test session',
    start_time: nextWeek.toISOString(),
    end_time: endTime.toISOString(),
    max_students: 4,
    price: 40,
    repeat_interval: 'weekly',
    occurrences: 4
  };
  
  const response = await makeRequest('POST', '/api/sessions', sessionData, token);
  
  if (response.status === 201) {
    const createdCount = response.data.created_count || (response.data.created?.length || 1);
    recordTest('Recurring session', true, `Created ${createdCount} recurring session(s)`);
    return response.data;
  } else {
    recordTest('Recurring session', false, `Status: ${response.status}, Error: ${JSON.stringify(response.data)}`);
    return null;
  }
}

// Test 6: Validation errors
async function testValidationErrors(token) {
  logTest('Session Creation - Validation Error Handling');
  
  // Test empty title
  const emptyTitleResponse = await makeRequest('POST', '/api/sessions', {
    title: '',
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 3600000).toISOString()
  }, token);
  
  const emptyTitlePassed = emptyTitleResponse.status === 400;
  recordTest('Empty title validation', emptyTitlePassed, 
    emptyTitlePassed ? 'Correctly rejected empty title' : `Unexpected status: ${emptyTitleResponse.status}`);
  
  // Test missing start_time
  const missingStartResponse = await makeRequest('POST', '/api/sessions', {
    title: 'Test Session',
    end_time: new Date(Date.now() + 3600000).toISOString()
  }, token);
  
  const missingStartPassed = missingStartResponse.status === 400;
  recordTest('Missing start_time validation', missingStartPassed,
    missingStartPassed ? 'Correctly rejected missing start_time' : `Unexpected status: ${missingStartResponse.status}`);
  
  // Test invalid date format
  const invalidDateResponse = await makeRequest('POST', '/api/sessions', {
    title: 'Test Session',
    start_time: 'invalid-date',
    end_time: 'invalid-date'
  }, token);
  
  const invalidDatePassed = invalidDateResponse.status === 400;
  recordTest('Invalid date format validation', invalidDatePassed,
    invalidDatePassed ? 'Correctly rejected invalid date format' : `Unexpected status: ${invalidDateResponse.status}`);
  
  // Test end_time before start_time
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  const invalidTimeOrderResponse = await makeRequest('POST', '/api/sessions', {
    title: 'Test Session',
    start_time: tomorrow.toISOString(),
    end_time: yesterday.toISOString()
  }, token);
  
  const invalidTimeOrderPassed = invalidTimeOrderResponse.status === 400;
  recordTest('End time before start time validation', invalidTimeOrderPassed,
    invalidTimeOrderPassed ? 'Correctly rejected invalid time order' : `Unexpected status: ${invalidTimeOrderResponse.status}`);
}

// Test 7: Student cannot create session
async function testStudentCannotCreate(token) {
  logTest('Session Creation - Student Cannot Create');
  
  // First create a student account
  const email = `teststudent${Date.now()}@example.com`;
  const studentResponse = await makeRequest('POST', '/api/register', {
    name: 'Test Student',
    email,
    password: 'testpass123',
    role: 'student'
  });
  
  let studentToken = null;
  if (studentResponse.status === 201) {
    studentToken = studentResponse.data.token;
  } else {
    const loginResponse = await makeRequest('POST', '/api/login', {
      email,
      password: 'testpass123'
    });
    if (loginResponse.status === 200) {
      studentToken = loginResponse.data.token;
    }
  }
  
  if (!studentToken) {
    recordTest('Student cannot create session', false, 'Failed to create/login student account');
    return;
  }
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(12, 0, 0, 0);
  
  const sessionData = {
    title: 'Test Session by Student',
    start_time: tomorrow.toISOString(),
    end_time: new Date(tomorrow.getTime() + 3600000).toISOString()
  };
  
  const response = await makeRequest('POST', '/api/sessions', sessionData, studentToken);
  const passed = response.status === 403;
  recordTest('Student cannot create session', passed,
    passed ? 'Correctly rejected student session creation' : `Unexpected status: ${response.status}`);
}

// Main test runner
async function runSessionCreationTests() {
  log('\n🚀 STARTING COMPREHENSIVE SESSION CREATION TESTS 🚀', 'cyan');
  log(`Testing: ${BASE_URL}\n`, 'cyan');
  
  try {
    // Create test coach
    logSection('SETUP');
    logTest('Creating test coach account');
    const coach = await createTestCoach();
    if (!coach) {
      logError('Failed to create test coach - aborting tests');
      return;
    }
    logSuccess(`Test coach created/logged in: ${coach.email}`);
    
    // Run tests
    logSection('SESSION CREATION TESTS');
    
    await testBasicSessionCreation(coach.token);
    await testSessionISO8601NoSeconds(coach.token);
    await testSessionWithVisibility(coach.token);
    await testSessionSubscribersOnly(coach.token);
    await testRecurringSession(coach.token);
    
    logSection('VALIDATION TESTS');
    await testValidationErrors(coach.token);
    await testStudentCannotCreate(coach.token);
    
    // Summary
    logSection('TEST SUMMARY');
    log(`✅ Passed: ${results.passed}`, 'green');
    log(`❌ Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
    log(`📊 Total: ${results.tests.length}`, 'cyan');
    
    if (results.failed === 0) {
      log('\n🎉 All session creation tests passed!', 'green');
    } else {
      log('\n⚠️  Some tests failed. Please review the results above.', 'yellow');
    }
    
  } catch (error) {
    logError(`Test suite error: ${error.message}`);
    console.error(error);
  }
}

// Run tests
if (require.main === module) {
  runSessionCreationTests().then(() => {
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    logError(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runSessionCreationTests };

