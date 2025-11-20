import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { toast } from 'react-toastify';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();

  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return; // guard against double-invocation in StrictMode
    processedRef.current = true;
    (async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const userParam = urlParams.get('user');

      if (!token || !userParam) {
        toast.error('Login failed. Please try again.');
        navigate('/login');
        return;
      }

      try {
        const userFromQuery = JSON.parse(decodeURIComponent(userParam));

        // Persist token and set header BEFORE any API calls
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Try to fetch the freshest profile from backend
        try {
          const { data: freshUser } = await api.get('/profile');
          setUser(freshUser);
        } catch {
          // Fallback to user passed from server if profile fetch is momentarily not ready
          setUser(userFromQuery);
        }

        setToken(token);

        toast.success('Google login successful!');
        navigate('/dashboard');
      } catch (error) {
        console.error('Error finalizing Google login:', error);
        toast.error('Login failed. Please try again.');
        navigate('/login');
      }
    })();
  }, [navigate, setUser, setToken]);

  return (
    <div className="container">
      <div className="card">
        <div className="card-body text-center">
          <h3>Completing login...</h3>
          <p>Please wait while we complete your Google login.</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
