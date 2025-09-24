import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';

// Mock the AuthContext
const mockUseAuth = {
  login: jest.fn(),
  user: null,
  loading: false
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth
}));

// Mock window.location
const mockLocation = {
  origin: 'https://calla.sg'
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock window.location.href
Object.defineProperty(window.location, 'href', {
  value: '',
  writable: true
});

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <Login />
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.location.href = '';
  });

  test('renders login form', () => {
    renderLogin();
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  test('renders Google login button', () => {
    renderLogin();
    
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  test('Google login redirects to correct URL in production', () => {
    // Set production origin
    window.location.origin = 'https://calla.sg';
    
    renderLogin();
    
    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);
    
    expect(window.location.href).toBe('https://calla.sg/api/auth/google');
  });

  test('Google login redirects to localhost in development', () => {
    // Set development origin
    window.location.origin = 'http://localhost:3000';
    
    renderLogin();
    
    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);
    
    expect(window.location.href).toBe('http://localhost:5000/api/auth/google');
  });

  test('form submission calls login function', async () => {
    renderLogin();
    
    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: 'Login' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    expect(mockUseAuth.login).toHaveBeenCalledWith('test@example.com', 'password123');
  });
});
