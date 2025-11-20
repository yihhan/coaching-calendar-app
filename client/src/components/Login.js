import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      toast.success(t('auth.loginSuccess'));
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    // Use current origin for production, localhost for development
    const baseUrl = window.location.origin === 'http://localhost:3000' 
      ? 'http://localhost:5000' 
      : window.location.origin;
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  return (
    <div className="container">
      <div className="grid" style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title text-center">{t('auth.loginTitle')}</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">{t('common.email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">{t('common.password')}</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? t('auth.loginLoading') : t('auth.loginButton')}
            </button>
            
            <div className="text-center mt-2 mb-2">
              <span className="text-muted">{t('common.or')}</span>
            </div>
            
            <button 
              type="button" 
              className="btn btn-secondary" 
              style={{ width: '100%', backgroundColor: '#4285f4', borderColor: '#4285f4' }}
              onClick={handleGoogleLogin}
            >
              <span style={{ marginRight: '8px' }}>🔍</span>
              {t('common.googleLogin')}
            </button>
          </form>
          
          <div className="text-center mt-2">
            <p className="text-muted">
              {t('auth.registerPrompt')} <Link to="/register">{t('auth.registerLink')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
