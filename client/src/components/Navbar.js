import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

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
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
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
            <>
              {/* Desktop Navigation */}
              <div className="desktop-nav d-none d-md-flex align-items-center gap-2">
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

              {/* Mobile Navigation */}
              <div ref={mobileMenuRef} className="mobile-nav" style={{ position: 'relative', width: '100%' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  width: '100%',
                  flexWrap: 'nowrap'
                }}>
                  <span style={{ 
                    color: 'white', 
                    fontSize: '12px', 
                    fontWeight: 600, 
                    flex: '1', 
                    minWidth: 0,
                    marginRight: '10px'
                  }}>
                    Welcome, {user.name} ({user.role})
                  </span>
                  <button 
                    onClick={toggleMobileMenu}
                    className="btn"
                    style={{ 
                      padding: '0.25rem 0.5rem', 
                      fontSize: '12px', 
                      flexShrink: 0,
                      minWidth: 'auto',
                      backgroundColor: '#ffffff',
                      color: '#3b82f6',
                      border: '1px solid #ffffff',
                      fontWeight: '600'
                    }}
                  >
                    {isMobileMenuOpen ? '✕ Close' : '☰ Menu'}
                  </button>
                </div>
                
                {isMobileMenuOpen && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    left: '0', 
                    right: '0', 
                    backgroundColor: '#3b82f6', 
                    padding: '1rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    borderTop: '1px solid rgba(255,255,255,0.2)'
                  }}>
                    <div className="d-flex flex-column gap-2">
                      <Link to="/dashboard" className="btn btn-secondary btn-sm" style={getButtonStyle('/dashboard')} onClick={closeMobileMenu}>
                        Dashboard
                      </Link>
                      
                      <Link to="/availability" className="btn btn-secondary btn-sm" style={getButtonStyle('/availability')} onClick={closeMobileMenu}>
                        Calendar
                      </Link>
                      
                      {user.role === 'coach' && (
                        <Link to="/calendar" className="btn btn-secondary btn-sm" style={getButtonStyle('/calendar')} onClick={closeMobileMenu}>
                          Sessions
                        </Link>
                      )}
                      
                      {user.role === 'student' && (
                        <Link to="/booking" className="btn btn-secondary btn-sm" style={getButtonStyle('/booking')} onClick={closeMobileMenu}>
                          Book Sessions
                        </Link>
                      )}
                      
                      <Link to="/profile" className="btn btn-secondary btn-sm" style={getButtonStyle('/profile')} onClick={closeMobileMenu}>
                        Profile
                      </Link>
                      
                      <button onClick={handleLogout} className="btn btn-danger btn-sm">
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
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
