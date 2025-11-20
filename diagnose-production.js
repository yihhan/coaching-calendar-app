#!/usr/bin/env node

/**
 * Production Server Diagnostics
 * Check what's actually running on the production server
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
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function diagnoseProduction() {
  console.log('🔍 PRODUCTION SERVER DIAGNOSTICS');
  console.log(`📍 Testing: ${PRODUCTION_URL}\n`);
  
  // Test all possible endpoints
  const endpoints = [
    // Auth endpoints
    { path: '/api/register', method: 'POST', needsAuth: false },
    { path: '/api/login', method: 'POST', needsAuth: false },
    { path: '/api/test/google-setup', method: 'GET', needsAuth: false },
    
    // Session endpoints
    { path: '/api/sessions', method: 'GET', needsAuth: true },
    { path: '/api/sessions', method: 'POST', needsAuth: true },
    { path: '/api/sessions/coach', method: 'GET', needsAuth: true },
    { path: '/api/sessions/available', method: 'GET', needsAuth: false },
    { path: '/api/sessions/calendar', method: 'GET', needsAuth: false },
    
    // Booking endpoints
    { path: '/api/bookings', method: 'GET', needsAuth: true },
    { path: '/api/bookings', method: 'POST', needsAuth: true },
    { path: '/api/bookings/pending', method: 'GET', needsAuth: true },
    
    // Profile endpoints
    { path: '/api/profile', method: 'GET', needsAuth: true },
    { path: '/api/profile', method: 'PUT', needsAuth: true },
    
    // Google OAuth endpoints
    { path: '/api/auth/google', method: 'GET', needsAuth: false },
    { path: '/api/auth/google/student', method: 'GET', needsAuth: false },
    { path: '/api/auth/google/coach', method: 'GET', needsAuth: false }
  ];
  
  console.log('Testing all endpoints...\n');
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${PRODUCTION_URL}${endpoint.path}`, {
        method: endpoint.method
      });
      
      let status = '';
      if (response.status === 200) {
        status = '✅ 200 OK';
      } else if (response.status === 201) {
        status = '✅ 201 Created';
      } else if (response.status === 302 || response.status === 301) {
        status = '✅ Redirect';
      } else if (response.status === 401) {
        status = '🔒 401 Unauthorized (needs auth)';
      } else if (response.status === 404) {
        status = '❌ 404 Not Found';
      } else if (response.status === 400) {
        status = '⚠️  400 Bad Request';
      } else {
        status = `⚠️  ${response.status}`;
      }
      
      console.log(`${endpoint.method} ${endpoint.path}: ${status}`);
      
    } catch (error) {
      console.log(`${endpoint.method} ${endpoint.path}: ❌ ERROR - ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 DIAGNOSIS SUMMARY');
  console.log('='.repeat(60));
  
  console.log('\n🔧 NEXT STEPS:');
  console.log('1. If endpoints return 404: Backend code not deployed');
  console.log('2. If endpoints return 401: Endpoint exists but needs authentication');
  console.log('3. If endpoints return 400: Endpoint exists but has validation issues');
  console.log('4. If endpoints return 200/201: Endpoint working correctly');
  
  console.log('\n📝 COMMANDS TO RUN ON PRODUCTION SERVER:');
  console.log('1. Check if backend is running: pm2 list');
  console.log('2. Check backend logs: pm2 logs coaching-api');
  console.log('3. Restart backend: pm2 restart coaching-api');
  console.log('4. Check if all files deployed: ls -la /var/www/coaching-calendar-app/server/');
}

diagnoseProduction().catch(console.error);
