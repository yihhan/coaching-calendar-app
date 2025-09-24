import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../Register';

// Mock the AuthContext
const mockUseAuth = {
  register: jest.fn(),
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

const renderRegister = () => {
  return render(
    <BrowserRouter>
      <Register />
    </BrowserRouter>
  );
};

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.location.href = '';
  });

  test('renders registration form', () => {
    renderRegister();
    
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('I am a')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
  });

  test('renders Google registration button', () => {
    renderRegister();
    
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  test('Google registration redirects to correct URL with role in production', () => {
    // Set production origin
    window.location.origin = 'https://calla.sg';
    
    renderRegister();
    
    // Select coach role
    const roleSelect = screen.getByLabelText('I am a');
    fireEvent.change(roleSelect, { target: { value: 'coach' } });
    
    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);
    
    expect(window.location.href).toBe('https://calla.sg/api/auth/google/coach');
  });

  test('Google registration redirects to correct URL with student role in production', () => {
    // Set production origin
    window.location.origin = 'https://calla.sg';
    
    renderRegister();
    
    // Select student role
    const roleSelect = screen.getByLabelText('I am a');
    fireEvent.change(roleSelect, { target: { value: 'student' } });
    
    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);
    
    expect(window.location.href).toBe('https://calla.sg/api/auth/google/student');
  });

  test('Google registration redirects to localhost in development', () => {
    // Set development origin
    window.location.origin = 'http://localhost:3000';
    
    renderRegister();
    
    const googleButton = screen.getByText('Continue with Google');
    fireEvent.click(googleButton);
    
    expect(window.location.href).toBe('http://localhost:5000/api/auth/google/student');
  });

  test('form submission calls register function', async () => {
    renderRegister();
    
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email');
    const roleSelect = screen.getByLabelText('I am a');
    const submitButton = screen.getByRole('button', { name: 'Register' });
    
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(roleSelect, { target: { value: 'coach' } });
    fireEvent.click(submitButton);
    
    expect(mockUseAuth.register).toHaveBeenCalledWith('John Doe', 'john@example.com', 'coach');
  });
});
