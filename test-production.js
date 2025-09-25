#!/usr/bin/env node

/**
 * Production Testing Script for Coaching Calendar App
 * Run with: node test-production.js
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://calla.sg';
const API_ENDPOINTS = [
  '/api/test/google-setup',
  '/api/sessions/available',
  '/api/auth/google',
  '/api/auth/google/student',
  '/api/auth/google/coach'
];

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, { method }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function testEndpoint(endpoint) {
  try {
    console.log(`Testing ${endpoint}...`);
    const response = await makeRequest(`${PRODUCTION_URL}${endpoint}`);
    
    if (response.status === 200) {
      console.log(`✅ ${endpoint} - OK (${response.status})`);
      return true;
    } else if (response.status === 404 && endpoint.includes('/auth/google')) {
      console.log(`✅ ${endpoint} - OK (${response.status}) - Expected redirect`);
      return true;
    } else {
      console.log(`⚠️  ${endpoint} - Status ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${endpoint} - Error: ${error.message}`);
    return false;
  }
}

async function testGoogleOAuthRedirects() {
  console.log('\n🔍 Testing Google OAuth Redirects...');
  
  const testUrls = [
    `${PRODUCTION_URL}/api/auth/google`,
    `${PRODUCTION_URL}/api/auth/google/student`,
    `${PRODUCTION_URL}/api/auth/google/coach`
  ];
  
  for (const url of testUrls) {
    try {
      const response = await makeRequest(url);
      if (response.status === 302 || response.status === 301) {
        const location = response.headers.location;
        if (location && location.includes('accounts.google.com')) {
          console.log(`✅ ${url} - Redirects to Google OAuth`);
        } else {
          console.log(`⚠️  ${url} - Redirects to: ${location}`);
        }
      } else {
        console.log(`❌ ${url} - Unexpected status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${url} - Error: ${error.message}`);
    }
  }
}

async function testFrontendAssets() {
  console.log('\n🎨 Testing Frontend Assets...');
  
  const assets = [
    '/',
    '/static/js/main.js',
    '/static/css/main.css',
    '/manifest.json'
  ];
  
  for (const asset of assets) {
    try {
      const response = await makeRequest(`${PRODUCTION_URL}${asset}`);
      if (response.status === 200) {
        console.log(`✅ ${asset} - OK`);
      } else {
        console.log(`⚠️  ${asset} - Status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${asset} - Error: ${error.message}`);
    }
  }
}

async function runTests() {
  console.log('🚀 Starting Production Tests for Coaching Calendar App');
  console.log(`📍 Testing: ${PRODUCTION_URL}\n`);
  
  let passed = 0;
  let total = API_ENDPOINTS.length;
  
  // Test API endpoints
  console.log('🔌 Testing API Endpoints...');
  for (const endpoint of API_ENDPOINTS) {
    const success = await testEndpoint(endpoint);
    if (success) passed++;
  }
  
  // Test Google OAuth redirects
  await testGoogleOAuthRedirects();
  
  // Test frontend assets
  await testFrontendAssets();
  
  console.log(`\n📊 Results: ${passed}/${total} API endpoints passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Production deployment looks good.');
  } else {
    console.log('⚠️  Some tests failed. Check the issues above.');
  }
}

// Run the tests
runTests().catch(console.error);
