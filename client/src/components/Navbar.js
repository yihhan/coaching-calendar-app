import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const getButtonStyle = (path) => {
    const baseStyle = { marginRight: '0.5rem' };
    if (isActive(path)) {
      return {
        ...baseStyle,
        backgroundColor: '#1e40af', // darker blue for active state
        border: '2px solid #ffffff',
        fontWeight: 'bold'
      };
    }
    return baseStyle;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ 
      backgroundColor: '#3b82f6', 
      padding: '1rem 0',
      marginBottom: '2rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center">
          
          {user ? (
            <div className="d-flex align-items-center gap-2">
              <span style={{ color: 'white', marginRight: '1rem', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                Welcome, {user.name} ({user.role})
              </span>
              
              <Link to="/dashboard" className="btn btn-secondary" style={getButtonStyle('/dashboard')}>
                Dashboard
              </Link>
              
              <Link to="/availability" className="btn btn-secondary" style={getButtonStyle('/availability')}>
                Calendar
              </Link>
              
              {user.role === 'coach' && (
                <Link to="/calendar" className="btn btn-secondary" style={getButtonStyle('/calendar')}>
                  Sessions
                </Link>
              )}
              
              {user.role === 'student' && (
                <Link to="/booking" className="btn btn-secondary" style={getButtonStyle('/booking')}>Book Sessions</Link>
              )}
              
              <Link to="/profile" className="btn btn-secondary" style={getButtonStyle('/profile')}>
                Profile
              </Link>
              
              <button onClick={handleLogout} className="btn btn-danger">
                Logout
              </button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn btn-success">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
