#!/usr/bin/env node

/**
 * Critical Production Issues Test
 * Confirms what's actually broken in production
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://calla.sg';

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

async function testCriticalIssues() {
  console.log('🚨 CRITICAL PRODUCTION ISSUES TEST');
  console.log(`📍 Testing: ${PRODUCTION_URL}\n`);
  
  const issues = [];
  
  // Test 1: Session Creation Endpoint
  console.log('1. Testing Session Creation Endpoint...');
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/sessions`, {
      method: 'POST',
      body: { title: 'test' }
    });
    
    if (response.status === 404) {
      issues.push('❌ CRITICAL: Session creation endpoint (/api/sessions) returns 404 - NOT DEPLOYED');
    } else if (response.status === 401) {
      console.log('✅ Session creation endpoint exists (requires auth)');
    } else {
      console.log(`⚠️  Session creation endpoint returned status: ${response.status}`);
    }
  } catch (error) {
    issues.push(`❌ CRITICAL: Session creation endpoint error: ${error.message}`);
  }
  
  // Test 2: Coach Sessions List
  console.log('\n2. Testing Coach Sessions List...');
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/sessions/coach`);
    
    if (response.status === 404) {
      issues.push('❌ CRITICAL: Coach sessions endpoint (/api/sessions/coach) returns 404 - NOT DEPLOYED');
    } else if (response.status === 401) {
      console.log('✅ Coach sessions endpoint exists (requires auth)');
    } else {
      console.log(`⚠️  Coach sessions endpoint returned status: ${response.status}`);
    }
  } catch (error) {
    issues.push(`❌ CRITICAL: Coach sessions endpoint error: ${error.message}`);
  }
  
  // Test 3: Booking Endpoints
  console.log('\n3. Testing Booking Endpoints...');
  const bookingEndpoints = [
    '/api/bookings',
    '/api/bookings/pending'
  ];
  
  for (const endpoint of bookingEndpoints) {
    try {
      const response = await makeRequest(`${PRODUCTION_URL}${endpoint}`);
      
      if (response.status === 404) {
        issues.push(`❌ CRITICAL: Booking endpoint (${endpoint}) returns 404 - NOT DEPLOYED`);
      } else if (response.status === 401) {
        console.log(`✅ Booking endpoint ${endpoint} exists (requires auth)`);
      } else {
        console.log(`⚠️  Booking endpoint ${endpoint} returned status: ${response.status}`);
      }
    } catch (error) {
      issues.push(`❌ CRITICAL: Booking endpoint ${endpoint} error: ${error.message}`);
    }
  }
  
  // Test 4: Profile Update
  console.log('\n4. Testing Profile Update...');
  try {
    const response = await makeRequest(`${PRODUCTION_URL}/api/profile`, {
      method: 'PUT',
      body: { name: 'test' }
    });
    
    if (response.status === 404) {
      issues.push('❌ CRITICAL: Profile update endpoint (/api/profile) returns 404 - NOT DEPLOYED');
    } else if (response.status === 401) {
      console.log('✅ Profile update endpoint exists (requires auth)');
    } else {
      console.log(`⚠️  Profile update endpoint returned status: ${response.status}`);
    }
  } catch (error) {
    issues.push(`❌ CRITICAL: Profile update endpoint error: ${error.message}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 PRODUCTION STATUS SUMMARY');
  console.log('='.repeat(60));
  
  if (issues.length === 0) {
    console.log('✅ All critical endpoints exist and are accessible');
    console.log('✅ Production deployment appears to be complete');
  } else {
    console.log('🚨 CRITICAL ISSUES FOUND:');
    issues.forEach(issue => console.log(issue));
    console.log('\n❌ PRODUCTION IS NOT READY FOR USERS');
    console.log('📋 The following core functionality is missing:');
    console.log('   - Session creation (coaches cannot create sessions)');
    console.log('   - Session management (coaches cannot view their sessions)');
    console.log('   - Booking system (students cannot book sessions)');
    console.log('   - Profile management (users cannot update profiles)');
    console.log('\n🔧 REQUIRED ACTIONS:');
    console.log('   1. Check if backend code was properly deployed');
    console.log('   2. Verify all API routes are included in production build');
    console.log('   3. Check server logs for deployment errors');
    console.log('   4. Redeploy backend with all endpoints');
  }
  
  console.log('\n' + '='.repeat(60));
}

testCriticalIssues().catch(console.error);
