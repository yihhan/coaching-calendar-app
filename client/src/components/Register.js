import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-toastify';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
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
    
    if (formData.password !== formData.confirmPassword) {
      toast.error(t('auth.passwordMismatch'));
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error(t('auth.passwordTooShort'));
      return;
    }
    
    setLoading(true);

    const result = await register(formData.email, formData.password, formData.name, formData.role);
    
    if (result.success) {
      toast.success(t('auth.registerSuccess'));
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
    
    setLoading(false);
  };

  const handleGoogleLogin = () => {
    // Get the selected role from the form
    const role = formData.role;
    // Use current origin for production, localhost for development
    const baseUrl = window.location.origin === 'http://localhost:3000' 
      ? 'http://localhost:5000' 
      : window.location.origin;
    window.location.href = `${baseUrl}/api/auth/google/${role}`;
  };

  return (
    <div className="container">
      <div className="grid" style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title text-center">{t('auth.registerTitle')}</h2>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">{t('common.fullName')}</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
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
              <label htmlFor="role">{t('auth.roleLabel')}</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="student">{t('common.student')}</option>
                <option value="coach">{t('common.coach')}</option>
              </select>
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
                minLength="6"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">{t('common.confirmPassword')}</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                minLength="6"
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? t('auth.registerLoading') : t('auth.registerButton')}
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
              {t('common.googleSignup')}
            </button>
          </form>
          
          <div className="text-center mt-2">
            <p className="text-muted">
              {t('auth.hasAccountPrompt')} <Link to="/login">{t('auth.loginLink')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
