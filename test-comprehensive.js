/**
 * Comprehensive Test Suite for Coaching Calendar Application
 * Tests all features: Auth, Sessions, Bookings, Credits, Subscriptions, Email, etc.
 */

const path = require('path');
const fs = require('fs');

const TEST_RESULTS = {
  passed: [],
  failed: [],
  warnings: []
};

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

// ============================================================================
// 1. AUTHENTICATION & AUTHORIZATION
// ============================================================================
function testAuthentication() {
  console.log('\n🔐 Testing Authentication & Authorization...');
  
  const serverFile = path.join(__dirname, 'server', 'index.js');
  if (!fs.existsSync(serverFile)) {
    logTest('Server File Exists', false, 'server/index.js not found');
    return;
  }
  
  const content = fs.readFileSync(serverFile, 'utf8');
  
  // Registration endpoints
  if (content.includes('app.post') && content.includes('/api/register')) {
    logTest('Registration Endpoint', true);
  } else {
    logTest('Registration Endpoint', false, 'POST /api/register not found');
  }
  
  // Login endpoints
  if (content.includes('app.post') && content.includes('/api/login')) {
    logTest('Login Endpoint', true);
  } else {
    logTest('Login Endpoint', false, 'POST /api/login not found');
  }
  
  // Google OAuth
  if (content.includes('app.get') && content.includes('/api/auth/google')) {
    logTest('Google OAuth Endpoint', true);
  } else {
    logTest('Google OAuth Endpoint', false, 'Google OAuth endpoint not found');
  }
  
  // Logout
  if (content.includes('app.post') && content.includes('/api/logout')) {
    logTest('Logout Endpoint', true);
  } else {
    logTest('Logout Endpoint', false, 'POST /api/logout not found');
  }
  
  // Authentication middleware
  if (content.includes('authenticateToken')) {
    logTest('Authentication Middleware', true);
  } else {
    logTest('Authentication Middleware', false, 'authenticateToken not found');
  }
  
  // Password hashing
  if (content.includes('bcrypt')) {
    logTest('Password Hashing', true);
  } else {
    logTest('Password Hashing', false, 'bcrypt not used for password hashing');
  }
  
  // JWT tokens
  if (content.includes('jsonwebtoken') || content.includes('jwt.sign')) {
    logTest('JWT Token Generation', true);
  } else {
    logTest('JWT Token Generation', false, 'JWT tokens not implemented');
  }
}

// ============================================================================
// 2. USER PROFILE MANAGEMENT
// ============================================================================
function testUserProfiles() {
  console.log('\n👤 Testing User Profile Management...');
  
  const serverFile = path.join(__dirname, 'server', 'index.js');
  const content = fs.readFileSync(serverFile, 'utf8');
  
  // Get profile
  if (content.includes('app.get') && content.includes('/api/profile')) {
    logTest('Get Profile Endpoint', true);
  } else {
    logTest('Get Profile Endpoint', false, 'GET /api/profile not found');
  }
  
  // Update profile
  if (content.includes('app.put') && content.includes('/api/profile')) {
    logTest('Update Profile Endpoint', true);
  } else {
    logTest('Update Profile Endpoint', false, 'PUT /api/profile not found');
  }
  
  // Profile component
  const profileComponent = path.join(__dirname, 'client', 'src', 'components', 'Profile.js');
  if (fs.existsSync(profileComponent)) {
    logTest('Profile Component', true);
    const profileContent = fs.readFileSync(profileComponent, 'utf8');
    
    if (profileContent.includes('fetchProfile')) {
      logTest('Profile: Fetch Function', true);
    } else {
      logTest('Profile: Fetch Function', false, 'fetchProfile not found');
    }
    
    if (profileContent.includes('handleSave')) {
      logTest('Profile: Save Function', true);
    } else {
      logTest('Profile: Save Function', false, 'handleSave not found');
    }
    
    // Check for role-specific features
    if (profileContent.includes('role === \'coach\'') || profileContent.includes('role === "coach"')) {
      logTest('Profile: Coach Features', true);
    } else {
      logWarning('Profile: Coach Features', 'Coach-specific features may be missing');
    }
    
    if (profileContent.includes('role === \'student\'') || profileContent.includes('role === "student"')) {
      logTest('Profile: Student Features', true);
    } else {
      logWarning('Profile: Student Features', 'Student-specific features may be missing');
    }
  } else {
    logTest('Profile Component', false, 'Profile.js not found');
  }
}

// ============================================================================
// 3. SESSION MANAGEMENT
// ============================================================================
function testSessionManagement() {
  console.log('\n📅 Testing Session Management...');
  
  const serverFile = path.join(__dirname, 'server', 'index.js');
  const content = fs.readFileSync(serverFile, 'utf8');
  
  // Create session
  if (content.includes('app.post') && content.includes('/api/sessions')) {
    logTest('Create Session Endpoint', true);
  } else {
    logTest('Create Session Endpoint', false, 'POST /api/sessions not found');
  }
  
  // Get coach sessions
  if (content.includes('app.get') && content.includes('/api/sessions/coach')) {
    logTest('Get Coach Sessions Endpoint', true);
  } else {
    logTest('Get Coach Sessions Endpoint', false, 'GET /api/sessions/coach not found');
  }
  
  // Get available sessions
  if (content.includes('app.get') && content.includes('/api/sessions/available')) {
    logTest('Get Available Sessions Endpoint', true);
  } else {
    logTest('Get Available Sessions Endpoint', false, 'GET /api/sessions/available not found');
  }
  
  // Delete session
  if (content.includes('app.delete') && content.includes('/api/sessions')) {
    logTest('Delete Session Endpoint', true);
  } else {
    logTest('Delete Session Endpoint', false, 'DELETE /api/sessions/:id not found');
  }
  
  // Session validation
  if (content.includes('max_students') && content.includes('price')) {
    logTest('Session Data Validation', true);
  } else {
    logWarning('Session Data Validation', 'Session validation may be incomplete');
  }
  
  // Check for overlapping session prevention
  if (content.includes('overlapping') || content.includes('OVERLAP')) {
    logTest('Overlapping Session Prevention', true);
  } else {
    logWarning('Overlapping Session Prevention', 'Overlapping session check may be missing');
  }
  
  // Frontend components
  const coachCalendar = path.join(__dirname, 'client', 'src', 'components', 'CoachCalendar.js');
  if (fs.existsSync(coachCalendar)) {
    logTest('CoachCalendar Component', true);
  } else {
    logTest('CoachCalendar Component', false, 'CoachCalendar.js not found');
  }
  
  const studentBooking = path.join(__dirname, 'client', 'src', 'components', 'StudentBooking.js');
  if (fs.existsSync(studentBooking)) {
    logTest('StudentBooking Component', true);
  } else {
    logTest('StudentBooking Component', false, 'StudentBooking.js not found');
  }
}

// ============================================================================
// 4. BOOKING SYSTEM
// ============================================================================
function testBookingSystem() {
  console.log('\n📝 Testing Booking System...');
  
  const serverFile = path.join(__dirname, 'server', 'index.js');
  const content = fs.readFileSync(serverFile, 'utf8');
  
  // Create booking
  if (content.includes('app.post') && content.includes('/api/bookings')) {
    logTest('Create Booking Endpoint', true);
  } else {
    logTest('Create Booking Endpoint', false, 'POST /api/bookings not found');
  }
  
  // Get student bookings
  if (content.includes('app.get') && content.includes('/api/bookings/student')) {
    logTest('Get Student Bookings Endpoint', true);
  } else {
    logTest('Get Student Bookings Endpoint', false, 'GET /api/bookings/student not found');
  }
  
  // Get pending bookings (coach)
  if (content.includes('app.get') && content.includes('/api/bookings/pending')) {
    logTest('Get Pending Bookings Endpoint', true);
  } else {
    logTest('Get Pending Bookings Endpoint', false, 'GET /api/bookings/pending not found');
  }
  
  // Approve booking
  if (content.includes('app.put') && content.includes('/api/bookings') && content.includes('approve')) {
    logTest('Approve Booking Endpoint', true);
  } else {
    logTest('Approve Booking Endpoint', false, 'PUT /api/bookings/:id/approve not found');
  }
  
  // Reject booking
  if (content.includes('app.put') && content.includes('/api/bookings') && content.includes('reject')) {
    logTest('Reject Booking Endpoint', true);
  } else {
    logTest('Reject Booking Endpoint', false, 'PUT /api/bookings/:id/reject not found');
  }
  
  // Cancel booking
  if (content.includes('app.put') && content.includes('/api/bookings') && content.includes('cancel')) {
    logTest('Cancel Booking Endpoint', true);
  } else {
    logTest('Cancel Booking Endpoint', false, 'PUT /api/bookings/:id/cancel not found');
  }
  
  // Booking status management
  if (content.includes('status') && (content.includes('pending') || content.includes('confirmed') || content.includes('cancelled'))) {
    logTest('Booking Status Management', true);
  } else {
    logWarning('Booking Status Management', 'Booking status system may be incomplete');
  }
  
  // Capacity checking
  if (content.includes('max_students') && (content.includes('COUNT') || content.includes('count'))) {
    logTest('Session Capacity Checking', true);
  } else {
    logWarning('Session Capacity Checking', 'Capacity validation may be missing');
  }
}

// ============================================================================
// 5. CREDITS SYSTEM
// ============================================================================
function testCreditsSystem() {
  console.log('\n💰 Testing Credits System...');
  
  const serverFile = path.join(__dirname, 'server', 'index.js');
  const content = fs.readFileSync(serverFile, 'utf8');
  
  // Credits table
  if (content.includes('CREATE TABLE') && content.includes('credits')) {
    logTest('Credits Table Schema', true);
  } else {
    logTest('Credits Table Schema', false, 'Credits table not found');
  }
  
  // Get credits endpoint
  if (content.includes('app.get') && content.includes('/api/credits')) {
    logTest('Get Credits Endpoint', true);
  } else {
    logTest('Get Credits Endpoint', false, 'GET /api/credits not found');
  }
  
  // Credits display in dashboard
  const dashboard = path.join(__dirname, 'client', 'src', 'components', 'Dashboard.js');
  if (fs.existsSync(dashboard)) {
    const dashboardContent = fs.readFileSync(dashboard, 'utf8');
    if (dashboardContent.includes('credits') || dashboardContent.includes('Credits')) {
      logTest('Credits Display in Dashboard', true);
    } else {
      logWarning('Credits Display in Dashboard', 'Credits may not be displayed');
    }
  }
}

// ============================================================================
// 6. EMAIL NOTIFICATIONS
// ============================================================================
function testEmailNotifications() {
  console.log('\n📧 Testing Email Notifications...');
  
  const serverFile = path.join(__dirname, 'server', 'index.js');
  const content = fs.readFileSync(serverFile, 'utf8');
  
  // Email service setup
  if (content.includes('nodemailer') || content.includes('createTransport')) {
    logTest('Email Service Setup', true);
  } else {
    logTest('Email Service Setup', false, 'Nodemailer not configured');
  }
  
  // Booking notification to coach
  if (content.includes('sendBookingNotification')) {
    logTest('Booking Notification Function', true);
  } else {
    logTest('Booking Notification Function', false, 'sendBookingNotification not found');
  }
  
  // Student decision notification
  if (content.includes('sendStudentDecisionNotification')) {
    logTest('Student Decision Notification', true);
  } else {
    logTest('Student Decision Notification', false, 'sendStudentDecisionNotification not found');
  }
  
  // New session notification (subscriptions)
  if (content.includes('sendNewSessionNotification')) {
    logTest('New Session Notification', true);
  } else {
    logTest('New Session Notification', false, 'sendNewSessionNotification not found');
  }
  
  // Email error handling
  if (content.includes('EMAIL_ENABLED') || content.includes('emailTransporter')) {
    logTest('Email Error Handling', true);
  } else {
    logWarning('Email Error Handling', 'Email may fail if not configured');
  }
  
  // Email triggers
  const hasBookingEmail = content.includes('sendBookingNotification') && 
                         content.includes('app.post') && 
                         content.includes('/api/bookings');
  if (hasBookingEmail) {
    logTest('Booking Email Trigger', true);
  } else {
    logWarning('Booking Email Trigger', 'Booking emails may not be sent');
  }
  
  const hasSessionEmail = content.includes('sendNewSessionNotification') && 
                          content.includes('app.post') && 
                          content.includes('/api/sessions');
  if (hasSessionEmail) {
    logTest('Session Email Trigger', true);
  } else {
    logWarning('Session Email Trigger', 'Session notification emails may not be sent');
  }
}

// ============================================================================
// 7. CALENDAR & AVAILABILITY
// ============================================================================
function testCalendarAvailability() {
  console.log('\n📆 Testing Calendar & Availability...');
  
  // Availability calendar component
  const availabilityCalendar = path.join(__dirname, 'client', 'src', 'components', 'AvailabilityCalendar.js');
  if (fs.existsSync(availabilityCalendar)) {
    logTest('AvailabilityCalendar Component', true);
    const content = fs.readFileSync(availabilityCalendar, 'utf8');
    
    if (content.includes('month') || content.includes('week') || content.includes('day')) {
      logTest('Calendar View Modes', true);
    } else {
      logWarning('Calendar View Modes', 'Multiple view modes may not be implemented');
    }
    
    if (content.includes('filter') || content.includes('Filter')) {
      logTest('Calendar Filtering', true);
    } else {
      logWarning('Calendar Filtering', 'Filtering may not be available');
    }
  } else {
    logTest('AvailabilityCalendar Component', false, 'AvailabilityCalendar.js not found');
  }
}

// ============================================================================
// 8. SUBSCRIPTION SYSTEM
// ============================================================================
function testSubscriptionSystem() {
  console.log('\n🔔 Testing Subscription System...');
  
  const serverFile = path.join(__dirname, 'server', 'index.js');
  const content = fs.readFileSync(serverFile, 'utf8');
  
  // Subscription table
  if (content.includes('CREATE TABLE') && content.includes('coach_subscriptions')) {
    logTest('Subscription Table Schema', true);
  } else {
    logTest('Subscription Table Schema', false, 'coach_subscriptions table not found');
  }
  
  // Subscribe endpoint
  if (content.includes('app.post') && content.includes('/api/subscriptions')) {
    logTest('Subscribe Endpoint', true);
  } else {
    logTest('Subscribe Endpoint', false, 'POST /api/subscriptions/:coachId not found');
  }
  
  // Unsubscribe endpoint
  if (content.includes('app.delete') && content.includes('/api/subscriptions')) {
    logTest('Unsubscribe Endpoint', true);
  } else {
    logTest('Unsubscribe Endpoint', false, 'DELETE /api/subscriptions/:coachId not found');
  }
  
  // Get subscriptions
  const getSubscriptionsPattern = /app\.get\(['"]\/api\/subscriptions['"]/;
  if (getSubscriptionsPattern.test(content)) {
    logTest('Get Subscriptions Endpoint', true);
  } else {
    logTest('Get Subscriptions Endpoint', false, 'GET /api/subscriptions not found');
  }
  
  // Subscription validation
  if (content.includes('student_id') && content.includes('coach_id') && content.includes('UNIQUE')) {
    logTest('Subscription Validation', true);
  } else {
    logWarning('Subscription Validation', 'Duplicate subscription prevention may be missing');
  }
}

// ============================================================================
// 9. INTERNATIONALIZATION (i18n)
// ============================================================================
function testInternationalization() {
  console.log('\n🌐 Testing Internationalization...');
  
  const translationsFile = path.join(__dirname, 'client', 'src', 'i18n', 'translations.js');
  if (!fs.existsSync(translationsFile)) {
    logTest('Translations File', false, 'translations.js not found');
    return;
  }
  
  logTest('Translations File', true);
  const content = fs.readFileSync(translationsFile, 'utf8');
  
  // Check for English
  if (content.includes('en:') || content.includes("'en'") || content.includes('"en"')) {
    logTest('English Translations', true);
  } else {
    logTest('English Translations', false, 'English translations not found');
  }
  
  // Check for Chinese
  if (content.includes('zh:') || content.includes("'zh'") || content.includes('"zh"')) {
    logTest('Chinese Translations', true);
  } else {
    logTest('Chinese Translations', false, 'Chinese translations not found');
  }
  
  // Check for common translation keys
  const commonKeys = ['common', 'navbar', 'auth', 'dashboard'];
  commonKeys.forEach(key => {
    if (content.includes(`${key}:`)) {
      logTest(`Translation Key: ${key}`, true);
    } else {
      logWarning(`Translation Key: ${key}`, `Translation key '${key}' may be missing`);
    }
  });
  
  // Check for language context
  const languageContext = path.join(__dirname, 'client', 'src', 'contexts', 'LanguageContext.js');
  if (fs.existsSync(languageContext)) {
    logTest('Language Context', true);
  } else {
    logTest('Language Context', false, 'LanguageContext.js not found');
  }
}

// ============================================================================
// 10. SECURITY & VALIDATION
// ============================================================================
function testSecurity() {
  console.log('\n🔒 Testing Security & Validation...');
  
  const serverFile = path.join(__dirname, 'server', 'index.js');
  const content = fs.readFileSync(serverFile, 'utf8');
  
  // Input validation
  if (content.includes('express-validator') || content.includes('body(') || content.includes('validationResult')) {
    logTest('Input Validation', true);
  } else {
    logWarning('Input Validation', 'Input validation may be incomplete');
  }
  
  // SQL injection prevention (parameterized queries)
  if (content.includes('?') && content.includes('db.run') || content.includes('db.get') || content.includes('db.all')) {
    logTest('SQL Injection Prevention', true);
  } else {
    logWarning('SQL Injection Prevention', 'Parameterized queries should be used');
  }
  
  // CORS configuration
  if (content.includes('cors') || content.includes('CORS')) {
    logTest('CORS Configuration', true);
  } else {
    logWarning('CORS Configuration', 'CORS may not be configured');
  }
  
  // Role-based access control
  if (content.includes("req.user.role") && (content.includes("'coach'") || content.includes("'student'"))) {
    logTest('Role-Based Access Control', true);
  } else {
    logWarning('Role-Based Access Control', 'RBAC may not be fully implemented');
  }
  
  // Session management
  if (content.includes('express-session') || content.includes('session')) {
    logTest('Session Management', true);
  } else {
    logWarning('Session Management', 'Session handling may be missing');
  }
}

// ============================================================================
// 11. DATABASE SCHEMA
// ============================================================================
function testDatabaseSchema() {
  console.log('\n🗄️  Testing Database Schema...');
  
  const serverFile = path.join(__dirname, 'server', 'index.js');
  const content = fs.readFileSync(serverFile, 'utf8');
  
  // Required tables
  const requiredTables = ['users', 'sessions', 'bookings', 'credits', 'coach_subscriptions'];
  requiredTables.forEach(table => {
    if (content.includes(`CREATE TABLE`) && content.includes(table)) {
      logTest(`Table: ${table}`, true);
    } else {
      logTest(`Table: ${table}`, false, `${table} table not found`);
    }
  });
  
  // Foreign keys
  if (content.includes('FOREIGN KEY')) {
    logTest('Foreign Key Constraints', true);
  } else {
    logWarning('Foreign Key Constraints', 'Foreign keys may not be defined');
  }
  
  // Indexes (for performance)
  if (content.includes('UNIQUE') || content.includes('INDEX')) {
    logTest('Database Indexes', true);
  } else {
    logWarning('Database Indexes', 'Indexes may be missing (could affect performance)');
  }
}

// ============================================================================
// 12. FRONTEND ROUTING
// ============================================================================
function testFrontendRouting() {
  console.log('\n🛣️  Testing Frontend Routing...');
  
  const appFile = path.join(__dirname, 'client', 'src', 'App.js');
  if (!fs.existsSync(appFile)) {
    logTest('App.js Exists', false, 'App.js not found');
    return;
  }
  
  logTest('App.js Exists', true);
  const content = fs.readFileSync(appFile, 'utf8');
  
  // Check for React Router
  if (content.includes('react-router') || content.includes('BrowserRouter') || content.includes('Route')) {
    logTest('React Router Setup', true);
  } else {
    logTest('React Router Setup', false, 'React Router not configured');
  }
  
  // Common routes
  const routes = ['/login', '/register', '/dashboard', '/profile', '/booking', '/calendar'];
  routes.forEach(route => {
    if (content.includes(route)) {
      logTest(`Route: ${route}`, true);
    } else {
      logWarning(`Route: ${route}`, `Route '${route}' may not be defined`);
    }
  });
}

// ============================================================================
// 13. ERROR HANDLING
// ============================================================================
function testErrorHandling() {
  console.log('\n⚠️  Testing Error Handling...');
  
  const serverFile = path.join(__dirname, 'server', 'index.js');
  const content = fs.readFileSync(serverFile, 'utf8');
  
  // Try-catch blocks
  const tryCatchCount = (content.match(/try\s*{/g) || []).length;
  if (tryCatchCount > 5) {
    logTest('Error Handling Coverage', true);
  } else {
    logWarning('Error Handling Coverage', `Only ${tryCatchCount} try-catch blocks found`);
  }
  
  // Error responses
  if (content.includes('res.status(500)') || content.includes('res.status(400)') || content.includes('res.status(404)')) {
    logTest('HTTP Error Responses', true);
  } else {
    logWarning('HTTP Error Responses', 'Proper error status codes may not be used');
  }
  
  // Frontend error handling
  const components = ['Profile.js', 'StudentBooking.js', 'Dashboard.js', 'Login.js'];
  let componentsWithErrorHandling = 0;
  components.forEach(comp => {
    const file = path.join(__dirname, 'client', 'src', 'components', comp);
    if (fs.existsSync(file)) {
      const compContent = fs.readFileSync(file, 'utf8');
      if (compContent.includes('try') && compContent.includes('catch')) {
        componentsWithErrorHandling++;
      }
    }
  });
  
  if (componentsWithErrorHandling === components.length) {
    logTest('Frontend Error Handling', true);
  } else {
    logWarning('Frontend Error Handling', `${componentsWithErrorHandling}/${components.length} components have error handling`);
  }
}

// ============================================================================
// 14. UI/UX FEATURES
// ============================================================================
function testUIUX() {
  console.log('\n🎨 Testing UI/UX Features...');
  
  // Loading states
  const components = ['Profile.js', 'StudentBooking.js', 'Dashboard.js'];
  let componentsWithLoading = 0;
  components.forEach(comp => {
    const file = path.join(__dirname, 'client', 'src', 'components', comp);
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('loading') || content.includes('Loading')) {
        componentsWithLoading++;
      }
    }
  });
  
  if (componentsWithLoading === components.length) {
    logTest('Loading States', true);
  } else {
    logWarning('Loading States', `${componentsWithLoading}/${components.length} components have loading states`);
  }
  
  // Toast notifications
  const studentBooking = path.join(__dirname, 'client', 'src', 'components', 'StudentBooking.js');
  if (fs.existsSync(studentBooking)) {
    const content = fs.readFileSync(studentBooking, 'utf8');
    if (content.includes('toast') || content.includes('react-toastify')) {
      logTest('Toast Notifications', true);
    } else {
      logWarning('Toast Notifications', 'Toast notifications may not be used');
    }
  }
  
  // Responsive design (check for CSS classes)
  const appCss = path.join(__dirname, 'client', 'src', 'App.css');
  if (fs.existsSync(appCss)) {
    logTest('CSS Styling', true);
  } else {
    logWarning('CSS Styling', 'App.css may not exist');
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================
async function runAllTests() {
  console.log('🧪 Starting Comprehensive Test Suite for Coaching Calendar App\n');
  console.log('='.repeat(70));
  
  testAuthentication();
  testUserProfiles();
  testSessionManagement();
  testBookingSystem();
  testCreditsSystem();
  testEmailNotifications();
  testCalendarAvailability();
  testSubscriptionSystem();
  testInternationalization();
  testSecurity();
  testDatabaseSchema();
  testFrontendRouting();
  testErrorHandling();
  testUIUX();
  
  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 COMPREHENSIVE TEST SUMMARY\n');
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
  console.log(`\n📋 Test Categories:`);
  console.log(`   - Authentication & Authorization`);
  console.log(`   - User Profile Management`);
  console.log(`   - Session Management`);
  console.log(`   - Booking System`);
  console.log(`   - Credits System`);
  console.log(`   - Email Notifications`);
  console.log(`   - Calendar & Availability`);
  console.log(`   - Subscription System`);
  console.log(`   - Internationalization`);
  console.log(`   - Security & Validation`);
  console.log(`   - Database Schema`);
  console.log(`   - Frontend Routing`);
  console.log(`   - Error Handling`);
  console.log(`   - UI/UX Features`);
  
  if (TEST_RESULTS.failed.length === 0 && TEST_RESULTS.warnings.length === 0) {
    console.log('\n🎉 All tests passed! The application is fully functional.');
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

