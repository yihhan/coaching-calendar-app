import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState(null);
  const [loading, setLoading] = useState(false);

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
          <h1 className="card-title">Welcome to your Dashboard, {user.name}!</h1>
        </div>
        <div className="card-body">
          <div className="grid grid-3">
            {user.role === 'coach' ? (
              <>
                <div className="card">
                  <div className="card-body">
                    <h3>Account Credits</h3>
                    {loading ? (
                      <p>Loading credits...</p>
                    ) : credits ? (
                      <div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: credits.balance > 50 ? '#10b981' : credits.balance > 20 ? '#f59e0b' : '#ef4444' }}>
                          ${credits.balance.toFixed(2)}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                          Account Balance
                        </p>
                      </div>
                    ) : (
                      <p>Failed to load credits</p>
                    )}
                    <button onClick={fetchCredits} className="btn btn-sm btn-outline-primary" style={{ marginTop: '1rem' }}>
                      Refresh
                    </button>
                  </div>
                </div>

                <div className="card">
                  <div className="card-body">
                    <h3>Coach Features</h3>
                    <p>As a coach, you can:</p>
                    <ul>
                      <li>Create and manage your available sessions</li>
                      <li>View your calendar and bookings</li>
                      <li>Set session prices and capacity</li>
                      <li>Track your student bookings</li>
                    </ul>
                    <a href="/calendar" className="btn btn-primary">
                      Manage My Sessions
                    </a>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-body">
                    <h3>Quick Stats</h3>
                    <p>Your coaching dashboard will show:</p>
                    <ul>
                      <li>Total sessions created</li>
                      <li>Upcoming bookings</li>
                      <li>Revenue summary</li>
                      <li>Student feedback</li>
                    </ul>
                    <a href="/profile" className="btn btn-secondary">
                      View Profile
                    </a>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="card">
                  <div className="card-body">
                    <h3>Student Features</h3>
                    <p>As a student, you can:</p>
                    <ul>
                      <li>Browse available coaching sessions</li>
                      <li>Book sessions with your favorite coaches</li>
                      <li>View your upcoming sessions</li>
                      <li>Cancel bookings if needed</li>
                    </ul>
                    <a href="/booking" className="btn btn-primary">
                      Browse Sessions
                    </a>
                  </div>
                </div>
                
                <div className="card">
                  <div className="card-body">
                    <h3>My Bookings</h3>
                    <p>Track your learning journey:</p>
                    <ul>
                      <li>View all your booked sessions</li>
                      <li>See session details and coach info</li>
                      <li>Manage your schedule</li>
                      <li>Rate your experiences</li>
                    </ul>
                    <a href="/profile" className="btn btn-secondary">
                      View Profile
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
