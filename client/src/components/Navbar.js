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
    return {
      backgroundColor: isActive(path) ? '#3b82f6' : '#6b7280',
      color: 'white',
      border: 'none',
      padding: '0.5rem 1rem',
      borderRadius: '0.375rem',
      textDecoration: 'none',
      fontSize: '0.875rem',
      fontWeight: '500'
    };
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary" style={{ backgroundColor: '#3b82f6' }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center">
          
          {user ? (
            <>
              {/* Desktop Navigation - hidden on mobile by CSS */}
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

              {/* Mobile Navigation - shown on mobile by CSS */}
                <div ref={mobileMenuRef} className="mobile-nav" style={{ position: 'relative', width: '100%' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    width: '100%',
                    flexWrap: 'nowrap',
                    gap: '10px',
                    padding: '0 10px',
                    boxSizing: 'border-box'
                  }}>
                    <span style={{ 
                      color: 'white', 
                      fontSize: '12px', 
                      fontWeight: 600, 
                      flex: '1',
                      minWidth: 0,
                      marginRight: '10px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      Welcome, {user.name} ({user.role})
                    </span>
                    
                    <button
                      onClick={toggleMobileMenu}
                      className="btn"
                      style={{
                        padding: '0.4rem 0.6rem',
                        fontSize: '12px',
                        flexShrink: 0,
                        minWidth: '40px',
                        backgroundColor: '#ffffff',
                        color: '#3b82f6',
                        border: '1px solid #ffffff',
                        fontWeight: '600',
                        borderRadius: '4px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      {isMobileMenuOpen ? '✕' : '☰'}
                    </button>
                  </div>
                  
                  {isMobileMenuOpen && (
                    <div style={{ 
                      position: 'absolute', 
                      top: '100%', 
                      left: '0', 
                      right: '0', 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '0.375rem', 
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
                      zIndex: 1000,
                      padding: '1rem'
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