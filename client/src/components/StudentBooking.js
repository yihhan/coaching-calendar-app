import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import TruncatedText from './TruncatedText';
import { useLanguage } from '../contexts/LanguageContext';

const StudentBooking = () => {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [subscriptions, setSubscriptions] = useState([]);
  const [subscribing, setSubscribing] = useState({});
  const [filters, setFilters] = useState({
    coach_id: '',
    expertise: '',
    start_date: '',
    end_date: ''
  });

  const fetchSubscriptions = useCallback(async () => {
    try {
      const response = await api.get('/subscriptions');
      setSubscriptions(response.data.map(sub => sub.coach_id));
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    }
  }, []);

  const fetchCoaches = useCallback(async () => {
    try {
      const response = await api.get('/coaches');
      setCoaches(response.data);
    } catch (error) {
      console.error('Failed to fetch coaches:', error);
    }
  }, []);

  const fetchAvailableSessions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.coach_id) params.append('coach_id', filters.coach_id);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.expertise) params.append('expertise', filters.expertise);
      
      const response = await api.get(`/sessions/available?${params}`);
      setSessions(response.data);
    } catch (error) {
      toast.error('Failed to fetch available sessions');
    }
  }, [filters]);

  const fetchMyBookings = useCallback(async () => {
    try {
      const response = await api.get('/bookings/student');
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to fetch your bookings');
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      await Promise.all([
        fetchCoaches(),
        fetchAvailableSessions(),
        fetchMyBookings(),
        fetchSubscriptions()
      ]);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchCoaches, fetchAvailableSessions, fetchMyBookings, fetchSubscriptions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 'available') {
      fetchAvailableSessions();
    } else {
      fetchMyBookings();
    }
  }, [activeTab, filters, fetchAvailableSessions, fetchMyBookings]);

  const handleSubscribe = async (coachId, coachName) => {
    setSubscribing({ ...subscribing, [coachId]: true });
    try {
      await api.post(`/subscriptions/${coachId}`);
      toast.success(t('subscriptions.subscribeSuccess', { coachName }));
      setSubscriptions([...subscriptions, coachId]);
    } catch (error) {
      toast.error(error.response?.data?.error || t('subscriptions.subscribeError'));
    } finally {
      setSubscribing({ ...subscribing, [coachId]: false });
    }
  };

  const isSubscribed = (coachId) => {
    return subscriptions.includes(coachId);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const bookSession = async (sessionId) => {
    try {
      await api.post('/bookings', { session_id: sessionId });
      toast.success('Booking request submitted! Waiting for coach approval.');
      fetchAvailableSessions();
      fetchMyBookings();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to book session');
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled successfully!');
      fetchMyBookings();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel booking');
    }
  };

  const formatDate = (dateTime) => {
    return new Date(dateTime).toLocaleDateString();
  };

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isSessionFull = (session) => {
    const held = typeof session.held_count === 'number' ? session.held_count : (session.booked_count || 0);
    return held >= session.max_students;
  };

  const isSessionBooked = (sessionId) => {
    return bookings.some(booking => 
      booking.session_id === sessionId && booking.status === 'confirmed'
    );
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body text-center">
            <h3>Loading sessions...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title" style={{ marginBottom: '1.5rem' }}>Book Coaching Sessions</h1>
          
          <div className="d-flex gap-2 mb-3">
            <button 
              className={`btn ${activeTab === 'available' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('available')}
            >
              Available Sessions
            </button>
            <button 
              className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('bookings')}
            >
              My Bookings ({bookings.length})
            </button>
          </div>
        </div>
        
        {activeTab === 'available' && (
          <div className="card-body">
            <div className="card mb-3">
              <div className="card-body">
                <h4>Filter Sessions</h4>
                <div className="grid grid-3">
                  <div className="form-group">
                    <label htmlFor="coach_id">Coach</label>
                    <select
                      id="coach_id"
                      name="coach_id"
                      value={filters.coach_id}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Coaches</option>
                      {coaches.map(coach => (
                        <option key={coach.id} value={coach.id} title={coach.name}>
                          {coach.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="expertise">Expertise</label>
                    <select
                      id="expertise"
                      name="expertise"
                      value={filters.expertise}
                      onChange={handleFilterChange}
                    >
                      <option value="">All Expertise</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Biology">Biology</option>
                      <option value="English">English</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Public Speaking">Public Speaking</option>
                      <option value="Career Coaching">Career Coaching</option>
                      <option value="Fitness">Fitness</option>
                      <option value="Music">Music</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="start_date">From Date</label>
                    <input
                      type="date"
                      id="start_date"
                      name="start_date"
                      value={filters.start_date}
                      onChange={handleFilterChange}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="end_date">To Date</label>
                    <input
                      type="date"
                      id="end_date"
                      name="end_date"
                      value={filters.end_date}
                      onChange={handleFilterChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {sessions.length === 0 ? (
              <div className="text-center">
                <h3>No available sessions found</h3>
                <p className="text-muted">Try adjusting your filters or check back later!</p>
              </div>
            ) : (
              <div className="grid grid-2">
                {sessions.map(session => (
                  <div key={session.id} className="card">
                    <div className="card-body">
                      <div className="mb-2">
                        <h4 className="session-title-truncated" title={session.title} style={{ marginBottom: '0.25rem' }}>
                          {session.title.toUpperCase()}
                        </h4>
                        <p className="text-muted mb-0 d-flex align-items-center" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span>by {session.coach_name}</span>
                          {session.coach_id && !isSubscribed(session.coach_id) && (
                            <button
                              onClick={() => handleSubscribe(session.coach_id, session.coach_name)}
                              disabled={subscribing[session.coach_id]}
                              title={t('subscriptions.followTooltip')}
                              style={{ 
                                whiteSpace: 'nowrap',
                                padding: '0.15rem 0.4rem',
                                fontSize: '0.7rem',
                                lineHeight: '1.1',
                                background: 'transparent',
                                border: '1px solid #6c757d',
                                color: '#6c757d',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                marginLeft: '0.25rem'
                              }}
                            >
                              {subscribing[session.coach_id] ? '...' : `🔔 ${t('subscriptions.follow')}`}
                            </button>
                          )}
                          {session.coach_id && isSubscribed(session.coach_id) && (
                            <span className="badge badge-success" style={{ marginLeft: '0.25rem' }} title={t('subscriptions.followingTooltip')}>
                              {t('subscriptions.following')}
                            </span>
                          )}
                        </p>
                      </div>
                      
                      {session.description && (
                        <TruncatedText 
                          text={session.description} 
                          maxLines={2}
                          truncateBy="lines"
                          className="text-muted"
                        />
                      )}
                      
                      <div className="mb-2">
                        <strong>Date:</strong> {formatDate(session.start_time)}
                      </div>
                      
                      <div className="mb-2">
                        <strong>Time:</strong> {formatTime(session.start_time)} - {formatTime(session.end_time)}
                      </div>
                      
                      <div className="mb-2">
                        <strong>Price:</strong> ${session.price}
                      </div>
                      
                      <div className="mb-2">
                        <strong>Spots:</strong> {session.held_count || 0} / {session.max_students}
                      </div>
                      
                      <div className="mt-3">
                        {isSessionBooked(session.id) ? (
                          <span className="btn btn-success" disabled>
                            Already Booked
                          </span>
                        ) : isSessionFull(session) ? (
                          <span className="btn btn-secondary" disabled>
                            Session Full
                          </span>
                        ) : (
                          <button 
                            className="btn btn-primary"
                            onClick={() => bookSession(session.id)}
                          >
                            Book Session
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'bookings' && (
          <div className="card-body">
            {bookings.length === 0 ? (
              <div className="text-center">
                <h3>No bookings yet</h3>
                <p className="text-muted">Book your first session to get started!</p>
              </div>
            ) : (
              <div className="grid grid-2">
                {bookings.map(booking => (
                  <div key={booking.id} className="card">
                    <div className="card-body">
                      <h4>{booking.title && booking.title.toUpperCase()}</h4>
                      <p className="text-muted">with {booking.coach_name}</p>
                      
                      {booking.description && (
                        <p>{booking.description}</p>
                      )}
                      
                      <div className="mb-2">
                        <strong>Date:</strong> {formatDate(booking.start_time)}
                      </div>
                      
                      <div className="mb-2">
                        <strong>Time:</strong> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </div>
                      
                      <div className="mb-2">
                        <strong>Price:</strong> ${booking.price}
                      </div>
                      
                      <div className="mb-2">
                        <strong>Status:</strong> 
                        <span className={`badge ${
                          booking.status === 'confirmed' ? 'badge-success' : 
                          booking.status === 'pending' ? 'badge-warning' : 
                          'badge-danger'
                        }`}>
                          {booking.status === 'confirmed' ? 'Confirmed' : 
                           booking.status === 'pending' ? 'Pending Approval' : 
                           'Cancelled'}
                        </span>
                      </div>
                      
                      <div className="mt-3">
                        {booking.status === 'confirmed' && (
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => cancelBooking(booking.id)}
                          >
                            Cancel Booking
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentBooking;
