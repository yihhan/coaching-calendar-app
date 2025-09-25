import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import TruncatedText from './TruncatedText';

const StudentBooking = () => {
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [filters, setFilters] = useState({
    coach_id: '',
    expertise: '',
    start_date: '',
    end_date: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'available') {
      fetchAvailableSessions();
    } else {
      fetchMyBookings();
    }
  }, [activeTab, filters]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchCoaches(),
        fetchAvailableSessions(),
        fetchMyBookings()
      ]);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoaches = async () => {
    try {
      const response = await api.get('/coaches');
      setCoaches(response.data);
    } catch (error) {
      console.error('Failed to fetch coaches:', error);
    }
  };

  const fetchAvailableSessions = async () => {
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
  };

  const fetchMyBookings = async () => {
    try {
      const response = await api.get('/bookings/student');
      setBookings(response.data);
    } catch (error) {
      toast.error('Failed to fetch your bookings');
    }
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

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString();
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
                      <h4 className="session-title-truncated" title={session.title}>
                        {session.title.toUpperCase()}
                      </h4>
                      <p className="text-muted">by {session.coach_name}</p>
                      
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
