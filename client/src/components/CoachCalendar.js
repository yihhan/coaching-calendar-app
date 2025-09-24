import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';

const CoachCalendar = () => {
  const [sessions, setSessions] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    start_date: '',
    start_time_slot: '',
    duration_minutes: 60,
    max_students: 1,
    price: 0,
    repeat_interval: 'none',
    occurrences: 1
  });

  // Build user-friendly 15-min interval time options (06:00 - 22:45)
  const buildTimeOptions = () => {
    const options = [];
    for (let h = 6; h <= 22; h++) {
      for (let m of [0, 15, 30, 45]) {
        const hh = String(h).padStart(2, '0');
        const mm = String(m).padStart(2, '0');
        options.push(`${hh}:${mm}`);
      }
    }
    return options;
  };

  const timeOptions = buildTimeOptions();

  const updateStartTimeFromParts = (next = {}) => {
    const datePart = next.start_date ?? formData.start_date;
    const timePart = next.start_time_slot ?? formData.start_time_slot;
    if (datePart && timePart) {
      // Compose YYYY-MM-DDTHH:mm without seconds
      const composed = `${datePart}T${timePart}`;
      setFormData(prev => ({ ...prev, start_time: composed }));
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchPendingBookings();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/sessions/coach');
      setSessions(response.data);
    } catch (error) {
      toast.error('Failed to fetch sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingBookings = async () => {
    try {
      const response = await api.get('/bookings/pending');
      setPendingBookings(response.data);
    } catch (error) {
      console.error('Failed to fetch pending bookings:', error);
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/approve`);
      toast.success('Booking approved successfully');
      fetchPendingBookings(); // Refresh pending bookings
      fetchSessions(); // Refresh sessions to update booked count
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve booking');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/reject`);
      toast.success('Booking rejected successfully');
      fetchPendingBookings(); // Refresh pending bookings
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject booking');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'start_date') {
      updateStartTimeFromParts({ start_date: value });
    } else if (name === 'start_time_slot') {
      updateStartTimeFromParts({ start_time_slot: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Compute end_time from start_time + duration
      // Parse the start_time string directly to avoid timezone issues
      const startTimeStr = formData.start_time;
      if (!startTimeStr) {
        toast.error('Please provide a valid start time');
        return;
      }
      
      // Create date object from the start_time string
      const start = new Date(startTimeStr);
      if (isNaN(start.getTime())) {
        toast.error('Please provide a valid start time');
        return;
      }
      
      // Calculate end time by adding duration in minutes
      const end = new Date(start.getTime() + Number(formData.duration_minutes) * 60000);
      
      // Format both times consistently as YYYY-MM-DDTHH:mm
      const formatDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      const payload = {
        title: formData.title,
        description: formData.description,
        start_time: formatDateTime(start),
        end_time: formatDateTime(end),
        max_students: formData.max_students,
        price: formData.price,
        repeat_interval: formData.repeat_interval,
        occurrences: formData.occurrences
      };

      const res = await api.post('/sessions', payload);
      const data = res?.data || {};

      if (typeof data.skipped_count === 'number' && typeof data.created_count === 'number') {
        if (data.skipped_count > 0 && data.created_count > 0) {
          toast.warn(`Created ${data.created_count} session(s), skipped ${data.skipped_count} due to conflicts.`);
        } else if (data.skipped_count > 0 && data.created_count === 0) {
          toast.error('All occurrences conflicted with existing sessions. Nothing was created.');
        } else if (data.created_count > 1) {
          toast.success(`Created ${data.created_count} session(s).`);
        } else {
          toast.success('Session created successfully!');
        }
      } else {
        toast.success('Session created successfully!');
      }
      setShowForm(false);
      setFormData({
        title: '',
        description: '',
        start_time: '',
        start_date: '',
        start_time_slot: '',
        duration_minutes: 60,
        max_students: 1,
        price: 0,
        repeat_interval: 'none',
        occurrences: 1
      });
      fetchSessions();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create session');
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

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body text-center">
            <h3>Loading your sessions...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h1 className="card-title mb-0">My Sessions</h1>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : 'Create New Session'}
          </button>
        </div>
        
        {showForm && (
          <div className="card-body">
            <h3>Create New Session</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="title">Session Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Personal Training Session"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="max_students">Max Students</label>
                  <input
                    type="number"
                    id="max_students"
                    name="max_students"
                    value={formData.max_students}
                    onChange={handleChange}
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Describe what this session will cover..."
                />
              </div>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="start_date">Date</label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="start_time_slot">Time</label>
                  <select
                    id="start_time_slot"
                    name="start_time_slot"
                    value={formData.start_time_slot}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>Select time</option>
                    {timeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="duration_minutes">Duration</label>
                  <select
                    id="duration_minutes"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleChange}
                    required
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                    <option value={120}>120 minutes</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="repeat_interval">Repeat</label>
                  <select
                    id="repeat_interval"
                    name="repeat_interval"
                    value={formData.repeat_interval}
                    onChange={handleChange}
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="price">Price ($)</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="occurrences">Occurrences</label>
                  <input
                    type="number"
                    id="occurrences"
                    name="occurrences"
                    value={formData.occurrences}
                    onChange={handleChange}
                    min="1"
                    max="52"
                    disabled={formData.repeat_interval === 'none'}
                  />
                  <small className="text-muted">Max 52 (one year)</small>
                </div>
              </div>
              
              <button type="submit" className="btn btn-success">
                Create Session
              </button>
            </form>
          </div>
        )}
        
        {/* Pending Bookings Section */}
        {pendingBookings.length > 0 && (
          <div className="card-body border-top">
            <h3 className="mb-3">
              <i className="fas fa-clock me-2" style={{ color: '#f59e0b' }}></i>
              Pending Bookings ({pendingBookings.length})
            </h3>
            <div className="grid grid-1">
              {pendingBookings.map(booking => (
                <div key={booking.id} className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="mb-1">{booking.session_title.toUpperCase()}</h5>
                        <p className="text-muted mb-0">
                          <strong>Student:</strong> {booking.student_name} ({booking.student_email})
                        </p>
                      </div>
                      <span className="badge badge-warning">Pending</span>
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <strong>Date:</strong> {formatDate(booking.start_time)}
                      </div>
                      <div className="col-md-6">
                        <strong>Time:</strong> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <strong>Requested:</strong> {formatDateTime(booking.created_at)}
                    </div>
                    
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => handleApproveBooking(booking.id)}
                      >
                        <i className="fas fa-check me-1"></i>
                        Approve
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRejectBooking(booking.id)}
                      >
                        <i className="fas fa-times me-1"></i>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="card-body">
          <h3>My Sessions</h3>
          {sessions.length === 0 ? (
            <div className="text-center">
              <h3>No sessions created yet</h3>
              <p className="text-muted">Create your first session to start accepting bookings!</p>
            </div>
          ) : (
            <div className="grid grid-2">
              {sessions.map(session => (
                <div key={session.id} className="card">
                  <div className="card-body">
                    <h4>{session.title.toUpperCase()}</h4>
                    {session.description && (
                      <p className="text-muted">{session.description}</p>
                    )}
                    
                    <div className="mb-2">
                      <strong>Date:</strong> {formatDate(session.start_time)}
                    </div>
                    
                    <div className="mb-2">
                      <strong>Time:</strong> {formatTime(session.start_time)} - {formatTime(session.end_time)}
                    </div>
                    
                    <div className="mb-2">
                      <strong>Capacity:</strong> {session.booked_count || 0} / {session.max_students} students
                    </div>
                    
                    <div className="mb-2">
                      <strong>Price:</strong> ${session.price}
                    </div>
                    
                    <div className="mb-2">
                      <strong>Status:</strong> 
                      <span className={`badge ${session.status === 'available' ? 'badge-success' : 'badge-secondary'}`}>
                        {session.status}
                      </span>
                    </div>
                    
                    <div className="mt-3 d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          toast.info('Edit functionality coming soon!');
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={async () => {
                          if (!window.confirm('Delete this session? This cannot be undone.')) return;
                          try {
                            await api.delete(`/sessions/${session.id}`);
                            toast.success('Session deleted');
                            fetchSessions();
                          } catch (err) {
                            toast.error(err.response?.data?.error || 'Failed to delete session');
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoachCalendar;
