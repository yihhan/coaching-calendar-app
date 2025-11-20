import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
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
    const active = isActive(path);
    return {
      backgroundColor: active ? '#1e40af' : '#3b82f6', // active: darker blue, inactive: same as navbar blue
      color: 'white',
      border: active ? 'none' : '1px solid rgba(255,255,255,0.35)',
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

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary" style={{ backgroundColor: '#3b82f6', minHeight: '60px', padding: '0.75rem 0' }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center">
          
          {user ? (
            <>
              {/* Desktop Navigation */}
              <div className="d-none d-md-flex align-items-center gap-2">
                
                <Link to="/dashboard" className="btn btn-secondary" style={getButtonStyle('/dashboard')}>
                  {t('common.dashboard')}
                </Link>
                
                <Link to="/availability" className="btn btn-secondary" style={getButtonStyle('/availability')}>
                  {t('common.calendar')}
                </Link>
                
                {user.role === 'coach' && (
                  <Link to="/calendar" className="btn btn-secondary" style={getButtonStyle('/calendar')}>
                    {t('common.sessions')}
                  </Link>
                )}
                
                {user.role === 'student' && (
                  <Link to="/booking" className="btn btn-secondary" style={getButtonStyle('/booking')}>
                    {t('common.bookSessions')}
                  </Link>
                )}
                
                <Link to="/profile" className="btn btn-secondary" style={getButtonStyle('/profile')}>
                  {t('common.profile')}
                </Link>
                
                <button onClick={toggleLanguage} className="btn btn-light" style={{ border: '1px solid rgba(255,255,255,0.35)' }}>
                  {language === 'en' ? t('common.languageChinese') : t('common.languageEnglish')}
                </button>
                
                <button onClick={handleLogout} className="btn btn-danger">
                  {t('common.logout')}
                </button>
              </div>

              {/* Mobile Navigation */}
              <div ref={mobileMenuRef} className="d-md-none" style={{ position: 'relative', width: '100%' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'flex-end', 
                  width: '100%'
                }}>
                  
                  
                  <button
                    onClick={toggleMobileMenu}
                    className="btn btn-light"
                    style={{
                      padding: '0.5rem',
                      fontSize: '16px',
                      minWidth: '40px'
                    }}
                    aria-label={isMobileMenuOpen ? t('navbar.toggleMenuClose') : t('navbar.toggleMenuOpen')}
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
                    backgroundColor: '#3b82f6', 
                    border: '1px solid rgba(255, 255, 255, 0.2)', 
                    borderRadius: '0.375rem', 
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)', 
                    zIndex: 1000,
                    padding: '1rem'
                  }}>
                    <div className="d-flex flex-column gap-2">
                      <Link to="/dashboard" className="btn btn-sm w-100" style={{ ...getButtonStyle('/dashboard'), width: '100%' }} onClick={closeMobileMenu}>
                        {t('common.dashboard')}
                      </Link>
                      
                      <Link to="/availability" className="btn btn-sm w-100" style={{ ...getButtonStyle('/availability'), width: '100%' }} onClick={closeMobileMenu}>
                        {t('common.calendar')}
                      </Link>
                      
                      {user.role === 'coach' && (
                        <Link to="/calendar" className="btn btn-sm w-100" style={{ ...getButtonStyle('/calendar'), width: '100%' }} onClick={closeMobileMenu}>
                          {t('common.sessions')}
                        </Link>
                      )}
                      
                      {user.role === 'student' && (
                        <Link to="/booking" className="btn btn-sm w-100" style={{ ...getButtonStyle('/booking'), width: '100%' }} onClick={closeMobileMenu}>
                          {t('common.bookSessions')}
                        </Link>
                      )}
                      
                      <Link to="/profile" className="btn btn-sm w-100" style={{ ...getButtonStyle('/profile'), width: '100%' }} onClick={closeMobileMenu}>
                        {t('common.profile')}
                      </Link>

                      <button
                        onClick={() => {
                          toggleLanguage();
                          closeMobileMenu();
                        }}
                        className="btn btn-light btn-sm"
                      >
                        {language === 'en' ? t('common.switchToChinese') : t('common.switchToEnglish')}
                      </button>
                      
                      <button onClick={handleLogout} className="btn btn-danger btn-sm">
                        {t('common.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="d-flex gap-2 align-items-center">
              <button onClick={toggleLanguage} className="btn btn-light">
                {language === 'en' ? t('common.languageChinese') : t('common.languageEnglish')}
              </button>
              <Link to="/login" className="btn btn-secondary">
                {t('common.login')}
              </Link>
              <Link to="/register" className="btn btn-success">
                {t('common.register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;