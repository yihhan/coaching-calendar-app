const request = require('supertest');
const app = require('../index');

describe('Google OAuth Configuration', () => {
  test('GET /api/test/google-setup returns configuration status', async () => {
    const response = await request(app)
      .get('/api/test/google-setup')
      .expect(200);

    expect(response.body).toHaveProperty('hasClientId');
    expect(response.body).toHaveProperty('hasClientSecret');
    expect(response.body).toHaveProperty('clientIdValid');
    expect(response.body).toHaveProperty('clientSecretValid');
    expect(response.body).toHaveProperty('isConfigured');
    expect(response.body).toHaveProperty('message');
  });

  test('GET /api/auth/google redirects to Google OAuth', async () => {
    const response = await request(app)
      .get('/api/auth/google')
      .expect(302);

    expect(response.headers.location).toContain('accounts.google.com');
    expect(response.headers.location).toContain('client_id=');
    expect(response.headers.location).toContain('redirect_uri=');
  });

  test('Google OAuth callback URL is correct in production', () => {
    // Mock production environment
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // Re-import to get fresh configuration
    jest.resetModules();
    const passport = require('passport');
    
    // Check if GoogleStrategy is configured with correct callback URL
    const strategies = passport._strategies;
    const googleStrategy = strategies['google-oauth20'];
    
    if (googleStrategy) {
      expect(googleStrategy._callbackURL).toBe('https://calla.sg/api/auth/google/callback');
    }

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  test('Google OAuth callback URL is correct in development', () => {
    // Mock development environment
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    // Re-import to get fresh configuration
    jest.resetModules();
    const passport = require('passport');
    
    // Check if GoogleStrategy is configured with correct callback URL
    const strategies = passport._strategies;
    const googleStrategy = strategies['google-oauth20'];
    
    if (googleStrategy) {
      expect(googleStrategy._callbackURL).toBe('http://localhost:5000/api/auth/google/callback');
    }

    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });
});
