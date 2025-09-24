import axios from 'axios';

// Determine the API base URL dynamically
const getApiBaseUrl = () => {
  // If we're in development (localhost:3000), use localhost:5000
  if (window.location.origin === 'http://localhost:3000') {
    return 'http://localhost:5000/api';
  }
  // For production, use the current origin
  return `${window.location.origin}/api`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
