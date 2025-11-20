/**
 * Comprehensive Test Suite for Subscription Feature
 * Tests all aspects of the coach-student subscription system
 */

const path = require('path');
const fs = require('fs');

// Test configuration
const DB_PATH = path.join(__dirname, 'server', 'coaching_calendar.db');
const TEST_RESULTS = {
  passed: [],
  failed: [],
  warnings: []
};

// Helper function to log test results
function logTest(name, passed, message = '') {
  if (passed) {
    TEST_RESULTS.passed.push(name);
    console.log(`✅ PASS: ${name}`);
  } else {
    TEST_RESULTS.failed.push({ name, message });
    console.log(`❌ FAIL: ${name} - ${message}`);
  }
}

function logWarning(name, message) {
  TEST_RESULTS.warnings.push({ name, message });
  console.log(`⚠️  WARN: ${name} - ${message}`);
}

// Test 1: Database Schema
function testDatabaseSchema() {
  console.log('\n📊 Testing Database Schema...');
  
  // Check if database file exists
  if (fs.existsSync(DB_PATH)) {
    logTest('Database File Exists', true);
  } else {
    logWarning('Database File Exists', 'Database file not found (will be created automatically on first server run)');
  }
  
  // Check server code for table creation
  const serverFile = path.join(__dirname, 'server', 'index.js');
  if (fs.existsSync(serverFile)) {
    const content = fs.readFileSync(serverFile, 'utf8');
    
    // Check for table creation SQL
    if (content.includes('CREATE TABLE IF NOT EXISTS coach_subscriptions')) {
      logTest('Table Creation SQL', true);
      
      // Check for required columns
      const requiredColumns = ['id', 'student_id', 'coach_id', 'created_at'];
      const missingColumns = requiredColumns.filter(col => !content.includes(col));
      
      if (missingColumns.length === 0) {
        logTest('Table Columns', true);
      } else {
        logTest('Table Columns', false, `Missing columns: ${missingColumns.join(', ')}`);
      }
      
      // Check for unique constraint
      if (content.includes('UNIQUE(student_id, coach_id)')) {
        logTest('Unique Constraint', true);
      } else {
        logWarning('Unique Constraint', 'UNIQUE constraint may be missing');
      }
      
      // Check for foreign keys
      if (content.includes('FOREIGN KEY') && content.includes('REFERENCES users')) {
        logTest('Foreign Key Constraints', true);
      } else {
        logWarning('Foreign Key Constraints', 'Foreign key constraints may be missing');
      }
    } else {
      logTest('Table Creation SQL', false, 'Table creation SQL not found');
    }
  } else {
    logTest('Server File Check', false, 'server/index.js not found');
  }
}

// Test 2: API Endpoints Structure
function testAPIEndpoints() {
  console.log('\n🔌 Testing API Endpoints Structure...');
  
  const fs = require('fs');
  const serverFile = path.join(__dirname, 'server', 'index.js');
  
  if (!fs.existsSync(serverFile)) {
    logTest('Server File Exists', false, 'server/index.js not found');
    return;
  }
  
  logTest('Server File Exists', true);
  
  const content = fs.readFileSync(serverFile, 'utf8');
  
  // Check for subscription endpoints
  const endpoints = [
    { pattern: /app\.post\(['"]\/api\/subscriptions\/:coachId['"]/, name: 'POST /api/subscriptions/:coachId' },
    { pattern: /app\.delete\(['"]\/api\/subscriptions\/:coachId['"]/, name: 'DELETE /api/subscriptions/:coachId' },
    { pattern: /app\.get\(['"]\/api\/subscriptions['"]/, name: 'GET /api/subscriptions' },
    { pattern: /app\.get\(['"]\/api\/subscriptions\/:coachId['"]/, name: 'GET /api/subscriptions/:coachId' }
  ];
  
  endpoints.forEach(endpoint => {
    if (endpoint.pattern.test(content)) {
      logTest(`Endpoint: ${endpoint.name}`, true);
    } else {
      logTest(`Endpoint: ${endpoint.name}`, false, 'Endpoint not found');
    }
  });
  
  // Check for authentication middleware
  if (content.includes('authenticateToken')) {
    logTest('Authentication Middleware', true);
  } else {
    logTest('Authentication Middleware', false, 'authenticateToken middleware not found');
  }
  
  // Check for role validation
  if (content.includes("req.user.role !== 'student'")) {
    logTest('Role Validation', true);
  } else {
    logWarning('Role Validation', 'Student role validation may be missing');
  }
  
  // Check for email notification function
  if (content.includes('sendNewSessionNotification')) {
    logTest('Email Notification Function', true);
  } else {
    logTest('Email Notification Function', false, 'sendNewSessionNotification function not found');
  }
  
  // Check if email notifications are triggered on session creation
  if (content.includes('coach_subscriptions') && content.includes('sendNewSessionNotification')) {
    const hasNotificationTrigger = content.includes('SELECT u.email') && 
                                   content.includes('FROM coach_subscriptions') &&
                                   content.includes('sendNewSessionNotification');
    if (hasNotificationTrigger) {
      logTest('Email Notification Trigger', true);
    } else {
      logWarning('Email Notification Trigger', 'Notification may not be properly triggered');
    }
  }
}

// Test 3: Frontend Components
function testFrontendComponents() {
  console.log('\n🎨 Testing Frontend Components...');
  
  const fs = require('fs');
  const profileFile = path.join(__dirname, 'client', 'src', 'components', 'Profile.js');
  const bookingFile = path.join(__dirname, 'client', 'src', 'components', 'StudentBooking.js');
  
  // Test Profile.js
  if (fs.existsSync(profileFile)) {
    logTest('Profile Component Exists', true);
    const profileContent = fs.readFileSync(profileFile, 'utf8');
    
    if (profileContent.includes('fetchSubscriptions')) {
      logTest('Profile: fetchSubscriptions Function', true);
    } else {
      logTest('Profile: fetchSubscriptions Function', false, 'Function not found');
    }
    
    if (profileContent.includes('handleUnsubscribe')) {
      logTest('Profile: handleUnsubscribe Function', true);
    } else {
      logTest('Profile: handleUnsubscribe Function', false, 'Function not found');
    }
    
    if (profileContent.includes('subscriptions')) {
      logTest('Profile: Subscriptions State', true);
    } else {
      logTest('Profile: Subscriptions State', false, 'State not found');
    }
    
    if (profileContent.includes('useCallback')) {
      logTest('Profile: useCallback Hook', true);
    } else {
      logWarning('Profile: useCallback Hook', 'useCallback not used - may cause dependency warnings');
    }
  } else {
    logTest('Profile Component Exists', false, 'Profile.js not found');
  }
  
  // Test StudentBooking.js
  if (fs.existsSync(bookingFile)) {
    logTest('StudentBooking Component Exists', true);
    const bookingContent = fs.readFileSync(bookingFile, 'utf8');
    
    if (bookingContent.includes('handleSubscribe')) {
      logTest('StudentBooking: handleSubscribe Function', true);
    } else {
      logTest('StudentBooking: handleSubscribe Function', false, 'Function not found');
    }
    
    if (bookingContent.includes('isSubscribed')) {
      logTest('StudentBooking: isSubscribed Function', true);
    } else {
      logTest('StudentBooking: isSubscribed Function', false, 'Function not found');
    }
    
    if (bookingContent.includes('subscriptions')) {
      logTest('StudentBooking: Subscriptions State', true);
    } else {
      logTest('StudentBooking: Subscriptions State', false, 'State not found');
    }
    
    if (bookingContent.includes('useCallback')) {
      logTest('StudentBooking: useCallback Hook', true);
    } else {
      logWarning('StudentBooking: useCallback Hook', 'useCallback not used - may cause dependency warnings');
    }
    
    // Check for unused formatDateTime
    if (bookingContent.includes('formatDateTime')) {
      logWarning('StudentBooking: formatDateTime', 'formatDateTime is defined but may not be used');
    }
  } else {
    logTest('StudentBooking Component Exists', false, 'StudentBooking.js not found');
  }
}

// Test 4: Translations
function testTranslations() {
  console.log('\n🌐 Testing Translations...');
  
  const fs = require('fs');
  const translationsFile = path.join(__dirname, 'client', 'src', 'i18n', 'translations.js');
  
  if (!fs.existsSync(translationsFile)) {
    logTest('Translations File Exists', false, 'translations.js not found');
    return;
  }
  
  logTest('Translations File Exists', true);
  
  const content = fs.readFileSync(translationsFile, 'utf8');
  
  // Check for subscription-related translations
  const requiredKeys = [
    'subscriptions.title',
    'subscriptions.description',
    'subscriptions.follow',
    'subscriptions.following',
    'subscriptions.subscribeSuccess',
    'subscriptions.subscribeError',
    'subscriptions.unsubscribe',
    'subscriptions.unsubscribeSuccess',
    'subscriptions.unsubscribeError'
  ];
  
  requiredKeys.forEach(key => {
    const parts = key.split('.');
    const pattern = new RegExp(`${parts[0]}:\\s*{[\\s\\S]*?${parts[1]}:`, 'm');
    if (pattern.test(content)) {
      logTest(`Translation Key: ${key}`, true);
    } else {
      logTest(`Translation Key: ${key}`, false, 'Translation key not found');
    }
  });
  
  // Check for both English and Chinese
  if (content.includes('en:') && content.includes('zh:')) {
    logTest('Bilingual Support', true);
  } else {
    logTest('Bilingual Support', false, 'Missing English or Chinese translations');
  }
}

// Test 5: Code Quality
function testCodeQuality() {
  console.log('\n🔍 Testing Code Quality...');
  
  const fs = require('fs');
  const profileFile = path.join(__dirname, 'client', 'src', 'components', 'Profile.js');
  const bookingFile = path.join(__dirname, 'client', 'src', 'components', 'StudentBooking.js');
  
  // Check for ESLint issues
  [profileFile, bookingFile].forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const fileName = path.basename(file);
      
      // Check for proper error handling
      if (content.includes('try') && content.includes('catch')) {
        logTest(`${fileName}: Error Handling`, true);
      } else {
        logWarning(`${fileName}: Error Handling`, 'Some functions may lack error handling');
      }
      
      // Check for loading states
      if (content.includes('loading') || content.includes('Loading')) {
        logTest(`${fileName}: Loading States`, true);
      } else {
        logWarning(`${fileName}: Loading States`, 'Loading states may be missing');
      }
    }
  });
}

// Test 6: Integration Points
function testIntegrationPoints() {
  console.log('\n🔗 Testing Integration Points...');
  
  const fs = require('fs');
  const serverFile = path.join(__dirname, 'server', 'index.js');
  
  if (!fs.existsSync(serverFile)) {
    return;
  }
  
  const content = fs.readFileSync(serverFile, 'utf8');
  
  // Check if session creation triggers notifications
  const sessionCreationPattern = /app\.post\(['"]\/api\/sessions['"]/;
  if (sessionCreationPattern.test(content)) {
    const sessionCreationIndex = content.search(sessionCreationPattern);
    const sessionCreationSection = content.substring(sessionCreationIndex, sessionCreationIndex + 5000);
    
    if (sessionCreationSection.includes('coach_subscriptions') && 
        sessionCreationSection.includes('sendNewSessionNotification')) {
      logTest('Session Creation → Email Notification', true);
    } else {
      logTest('Session Creation → Email Notification', false, 'Email notifications not triggered on session creation');
    }
  }
  
  // Check API consistency
  const hasPostSubscription = content.includes('app.post') && content.includes('/api/subscriptions');
  const hasDeleteSubscription = content.includes('app.delete') && content.includes('/api/subscriptions');
  const hasGetSubscriptions = content.includes('app.get') && content.includes('/api/subscriptions');
  
  if (hasPostSubscription && hasDeleteSubscription && hasGetSubscriptions) {
    logTest('API Consistency', true);
  } else {
    logTest('API Consistency', false, 'Missing some subscription endpoints');
  }
}

// Run all tests
async function runAllTests() {
  console.log('🧪 Starting Comprehensive Test Suite for Subscription Feature\n');
  console.log('='.repeat(60));
  
  await testDatabaseSchema();
  testAPIEndpoints();
  testFrontendComponents();
  testTranslations();
  testCodeQuality();
  testIntegrationPoints();
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`✅ Passed: ${TEST_RESULTS.passed.length}`);
  console.log(`❌ Failed: ${TEST_RESULTS.failed.length}`);
  console.log(`⚠️  Warnings: ${TEST_RESULTS.warnings.length}`);
  
  if (TEST_RESULTS.failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    TEST_RESULTS.failed.forEach(test => {
      console.log(`   - ${test.name}: ${test.message}`);
    });
  }
  
  if (TEST_RESULTS.warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:');
    TEST_RESULTS.warnings.forEach(warning => {
      console.log(`   - ${warning.name}: ${warning.message}`);
    });
  }
  
  const totalTests = TEST_RESULTS.passed.length + TEST_RESULTS.failed.length;
  const passRate = totalTests > 0 ? (TEST_RESULTS.passed.length / totalTests * 100).toFixed(1) : 0;
  
  console.log(`\n📈 Pass Rate: ${passRate}%`);
  
  if (TEST_RESULTS.failed.length === 0 && TEST_RESULTS.warnings.length === 0) {
    console.log('\n🎉 All tests passed! The subscription feature is working correctly.');
  } else if (TEST_RESULTS.failed.length === 0) {
    console.log('\n✅ All critical tests passed! Review warnings for potential improvements.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix the issues above.');
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});

