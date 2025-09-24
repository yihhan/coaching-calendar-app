import api from '../api';

// Mock window.location
const mockLocation = {
  origin: 'https://calla.sg'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uses correct base URL in production', () => {
    // Set production origin
    window.location.origin = 'https://calla.sg';
    
    // Re-import the module to get fresh instance
    jest.resetModules();
    const freshApi = require('../api').default;
    
    expect(freshApi.defaults.baseURL).toBe('https://calla.sg/api');
  });

  test('uses correct base URL in development', () => {
    // Set development origin
    window.location.origin = 'http://localhost:3000';
    
    // Re-import the module to get fresh instance
    jest.resetModules();
    const freshApi = require('../api').default;
    
    expect(freshApi.defaults.baseURL).toBe('http://localhost:5000/api');
  });

  test('sets correct content type header', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });
});
