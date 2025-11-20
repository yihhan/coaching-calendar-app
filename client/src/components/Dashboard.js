import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    if (user && user.role === 'coach') {
      fetchCredits();
    }
  }, [user]);

  const fetchCredits = async () => {
    setLoading(true);
    try {
      const response = await api.get('/credits');
      setCredits(response.data);
    } catch (error) {
      console.error('Error fetching credits:', error.response?.data || error.message);
      setCredits(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">{t('dashboard.welcome', { name: user.name })}</h1>
        </div>
        <div className="card-body">
          <div className="grid grid-3">
            {user.role === 'coach' ? (
              <>
                <div className="card">
                  <div className="card-body">
                      <h3>{t('dashboard.accountCredits')}</h3>
                    {loading ? (
                        <p>{t('dashboard.loadingCredits')}</p>
                    ) : credits ? (
                      <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: credits.balance > 50 ? '#10b981' : credits.balance > 20 ? '#f59e0b' : '#ef4444' }}>
                          ${credits.balance.toFixed(2)}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                          {t('dashboard.accountBalance')}
                        </p>
                      </div>
                    ) : (
                        <p>{t('dashboard.failedCredits')}</p>
                    )}
                      <button onClick={fetchCredits} className="btn btn-sm btn-outline-primary" style={{ marginTop: '1rem' }}>
                        {t('common.refresh')}
                    </button>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                      <h3>{t('dashboard.coachFeatures')}</h3>
                      <p>{t('dashboard.coachDescription')}</p>
                    <ul>
                        {t('dashboard.coachFeatureList').map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                    </ul>
                    <a href="/calendar" className="btn btn-primary">
                        {t('dashboard.manageSessions')}
                    </a>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-body">
                      <h3>{t('dashboard.quickStats')}</h3>
                      <p>{t('dashboard.quickStatsDescription')}</p>
                    <ul>
                        {t('dashboard.quickStatsList').map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                    </ul>
                    <a href="/profile" className="btn btn-secondary">
                        {t('dashboard.viewProfile')}
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="card">
                  <div className="card-body">
                      <h3>{t('dashboard.studentFeatures')}</h3>
                      <p>{t('dashboard.studentDescription')}</p>
                    <ul>
                        {t('dashboard.studentFeatureList').map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                    </ul>
                    <a href="/booking" className="btn btn-primary">
                        {t('dashboard.browseSessions')}
                    </a>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-body">
                      <h3>{t('dashboard.myBookings')}</h3>
                      <p>{t('dashboard.myBookingsDescription')}</p>
                    <ul>
                        {t('dashboard.myBookingsList').map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                    </ul>
                    <a href="/profile" className="btn btn-secondary">
                        {t('dashboard.viewProfile')}
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
