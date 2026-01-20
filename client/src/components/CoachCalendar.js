import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import TruncatedText from './TruncatedText';
import { useLanguage } from '../contexts/LanguageContext';

const CoachCalendar = () => {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
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
    occurrences: 1,
    visibility: 'public',
    whitelist_student_ids: []
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

  // Fetch students for whitelist selection
  const fetchStudents = async () => {
    setLoadingStudents(true);
    try {
      const response = await api.get('/students');
      setStudents(response.data || []);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      toast.error('Failed to load students list');
    } finally {
      setLoadingStudents(false);
    }
  };

  // Load students when form opens and visibility is whitelist
  useEffect(() => {
    if (showForm && formData.visibility === 'whitelist' && students.length === 0) {
      fetchStudents();
    }
  }, [showForm, formData.visibility]);

  // Toggle student selection for whitelist
  const toggleStudentSelection = (studentId) => {
    setFormData(prev => {
      const currentIds = prev.whitelist_student_ids || [];
      const isSelected = currentIds.includes(studentId);
      return {
        ...prev,
        whitelist_student_ids: isSelected
          ? currentIds.filter(id => id !== studentId)
          : [...currentIds, studentId]
      };
    });
  };

  // Filter students based on search
  const filteredStudents = students.filter(student => {
    if (!studentSearch) return true;
    const searchLower = studentSearch.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    fetchSessions();
    fetchPendingBookings();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await api.get('/sessions/coach');
      setSessions(response.data);
    } catch (error) {
      toast.error(t('sessions.fetchSessionsError'));
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
      toast.success(t('sessions.bookingApproved'));
      fetchPendingBookings(); // Refresh pending bookings
      fetchSessions(); // Refresh sessions to update booked count
    } catch (error) {
      toast.error(error.response?.data?.error || t('sessions.approveError'));
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      await api.put(`/bookings/${bookingId}/reject`);
      toast.success(t('sessions.bookingRejected'));
      fetchPendingBookings(); // Refresh pending bookings
    } catch (error) {
      toast.error(error.response?.data?.error || t('sessions.rejectError'));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // If visibility changes to whitelist, load students if not already loaded
      if (name === 'visibility' && value === 'whitelist' && students.length === 0) {
        fetchStudents();
      }
      // If visibility changes away from whitelist, clear whitelist selection
      if (name === 'visibility' && value !== 'whitelist') {
        updated.whitelist_student_ids = [];
      }
      return updated;
    });
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
        toast.error(t('sessions.invalidStartTime'));
        return;
      }
      
      // Create date object from the start_time string
      const start = new Date(startTimeStr);
      if (isNaN(start.getTime())) {
        toast.error(t('sessions.invalidStartTime'));
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
          occurrences: formData.occurrences,
          visibility: formData.visibility || 'public',
          whitelist_student_ids: formData.visibility === 'whitelist' ? (formData.whitelist_student_ids || []) : []
        };

        // Validate whitelist selection
        if (formData.visibility === 'whitelist' && (!formData.whitelist_student_ids || formData.whitelist_student_ids.length === 0)) {
          toast.error('Please select at least one student for whitelist visibility'); // Show error message
          return;
        }

      const res = await api.post('/sessions', payload);
      const data = res?.data || {};

      if (typeof data.skipped_count === 'number' && typeof data.created_count === 'number') {
        if (data.skipped_count > 0 && data.created_count > 0) {
          toast.warn(t('sessions.createdSkipped', { created: data.created_count, skipped: data.skipped_count }));
        } else if (data.skipped_count > 0 && data.created_count === 0) {
          toast.error(t('sessions.allConflicted'));
        } else if (data.created_count > 1) {
          toast.success(t('sessions.createdMultiple', { count: data.created_count }));
        } else {
          toast.success(t('sessions.createdSuccess'));
        }
      } else {
        toast.success(t('sessions.createdSuccess'));
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
          occurrences: 1,
          visibility: 'public',
          whitelist_student_ids: []
        });
      fetchSessions();
    } catch (error) {
      toast.error(error.response?.data?.error || t('sessions.createError'));
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
            <h3>{t('sessions.loadingSessions')}</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h1 className="card-title mb-0">{t('sessions.mySessions')}</h1>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? t('sessions.cancel') : t('sessions.createNewSession')}
          </button>
        </div>
        
        {showForm && (
          <div className="card-body">
            <h3>{t('sessions.createSessionTitle')}</h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="title">{t('sessions.sessionTitle')}</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    placeholder={t('sessions.sessionTitlePlaceholder')}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="max_students">{t('sessions.maxStudents')}</label>
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
                <label htmlFor="description">{t('sessions.description')}</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder={t('sessions.descriptionPlaceholder')}
                />
              </div>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="start_date">{t('sessions.date')}</label>
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
                  <label htmlFor="start_time_slot">{t('sessions.time')}</label>
                  <select
                    id="start_time_slot"
                    name="start_time_slot"
                    value={formData.start_time_slot}
                    onChange={handleChange}
                    required
                  >
                    <option value="" disabled>{t('sessions.selectTime')}</option>
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="duration_minutes">{t('sessions.duration')}</label>
                  <select
                    id="duration_minutes"
                    name="duration_minutes"
                    value={formData.duration_minutes}
                    onChange={handleChange}
                    required
                  >
                    <option value={15}>{t('sessions.duration15')}</option>
                    <option value={30}>{t('sessions.duration30')}</option>
                    <option value={45}>{t('sessions.duration45')}</option>
                    <option value={60}>{t('sessions.duration60')}</option>
                    <option value={90}>{t('sessions.duration90')}</option>
                    <option value={120}>{t('sessions.duration120')}</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="repeat_interval">{t('sessions.repeat')}</label>
                  <select
                    id="repeat_interval"
                    name="repeat_interval"
                    value={formData.repeat_interval}
                    onChange={handleChange}
                  >
                    <option value="none">{t('sessions.repeatNone')}</option>
                    <option value="daily">{t('sessions.repeatDaily')}</option>
                    <option value="weekly">{t('sessions.repeatWeekly')}</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-2">
                <div className="form-group">
                  <label htmlFor="price">{t('sessions.price')}</label>
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
                  <label htmlFor="occurrences">{t('sessions.occurrences')}</label>
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
                  <small className="text-muted">{t('sessions.occurrencesMax')}</small>
                </div>
              </div>

              {/* Visibility Settings - Who Can See This Session */}
              <div className="form-group" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <label htmlFor="visibility" style={{ fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>
                  {t('sessions.visibility')}
                </label>
                <select
                  id="visibility"
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem' }}
                >
                  <option value="public">{t('sessions.visibilityPublic')}</option>
                  <option value="subscribers_only">{t('sessions.visibilitySubscribers')}</option>
                  <option value="whitelist">{t('sessions.visibilityWhitelist')}</option>
                </select>
                <small className="text-muted" style={{ display: 'block', marginTop: '0.25rem' }}>
                  {formData.visibility === 'public' && t('sessions.visibilityPublicDesc')}
                  {formData.visibility === 'subscribers_only' && t('sessions.visibilitySubscribersDesc')}
                  {formData.visibility === 'whitelist' && t('sessions.visibilityWhitelistDesc')}
                </small>
              </div>

              {/* Student Selection for Whitelist */}
              {formData.visibility === 'whitelist' && (
                <div className="form-group" style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '5px', marginTop: '10px' }}>
                  <label>{t('sessions.selectStudents')}</label>
                  <input
                    type="text"
                    placeholder={t('sessions.searchStudents')}
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    style={{ marginBottom: '10px', width: '100%', padding: '8px' }}
                  />
                  {loadingStudents ? (
                    <p>{t('sessions.loadingStudents')}</p>
                  ) : (
                    <>
                      <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', padding: '10px', borderRadius: '3px' }}>
                        {filteredStudents.length === 0 ? (
                          <p className="text-muted">{t('sessions.noStudentsSelected')}</p>
                        ) : (
                          filteredStudents.map(student => {
                            const isSelected = (formData.whitelist_student_ids || []).includes(student.id);
                            return (
                              <div
                                key={student.id}
                                onClick={() => toggleStudentSelection(student.id)}
                                style={{
                                  padding: '8px',
                                  marginBottom: '5px',
                                  cursor: 'pointer',
                                  backgroundColor: isSelected ? '#e3f2fd' : '#f5f5f5',
                                  border: isSelected ? '2px solid #2196f3' : '1px solid #ddd',
                                  borderRadius: '3px'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleStudentSelection(student.id)}
                                  style={{ marginRight: '8px' }}
                                />
                                <strong>{student.name}</strong> ({student.email})
                              </div>
                            );
                          })
                        )}
                      </div>
                      {(formData.whitelist_student_ids || []).length > 0 && (
                        <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '3px' }}>
                          <strong>{t('sessions.selectedStudents')}:</strong> {(formData.whitelist_student_ids || []).length}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              
              <button type="submit" className="btn btn-success">
                {t('sessions.createButton')}
              </button>
            </form>
          </div>
        )}
        
        {/* Pending Bookings Section */}
        {pendingBookings.length > 0 && (
          <div className="card-body border-top">
            <h3 className="mb-3">
              <i className="fas fa-clock me-2" style={{ color: '#f59e0b' }}></i>
              {t('sessions.pendingBookings')} ({pendingBookings.length})
            </h3>
            <div className="grid grid-1">
              {pendingBookings.map(booking => (
                <div key={booking.id} className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h5 className="mb-1">{booking.session_title.toUpperCase()}</h5>
                        <p className="text-muted mb-0">
                          <strong>{t('sessions.student')}</strong> {booking.student_name} ({booking.student_email})
                        </p>
                      </div>
                      <span className="badge badge-warning">{t('sessions.pending')}</span>
                    </div>
                    
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <strong>{t('sessions.dateLabel')}</strong> {formatDate(booking.start_time)}
                      </div>
                      <div className="col-md-6">
                        <strong>{t('sessions.timeLabel')}</strong> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <strong>{t('sessions.requested')}</strong> {formatDateTime(booking.created_at)}
                    </div>
                    
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => handleApproveBooking(booking.id)}
                      >
                        <i className="fas fa-check me-1"></i>
                        {t('sessions.approve')}
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRejectBooking(booking.id)}
                      >
                        <i className="fas fa-times me-1"></i>
                        {t('sessions.reject')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="card-body">
          <h3>{t('sessions.mySessions')}</h3>
          {sessions.length === 0 ? (
            <div className="text-center">
              <h3>{t('sessions.noSessionsYet')}</h3>
              <p className="text-muted">{t('sessions.createFirstSession')}</p>
            </div>
          ) : (
            <div className="grid grid-2">
              {sessions.map(session => (
                <div key={session.id} className="card">
                  <div className="card-body">
                    <h4 className="session-title-truncated" title={session.title}>
                      {session.title.toUpperCase()}
                    </h4>
                    {session.description && (
                      <TruncatedText 
                        text={session.description} 
                        maxLines={2}
                        truncateBy="lines"
                        className="text-muted"
                      />
                    )}
                    
                    <div className="mb-2">
                      <strong>{t('sessions.dateLabel')}</strong> {formatDate(session.start_time)}
                    </div>
                    
                    <div className="mb-2">
                      <strong>{t('sessions.timeLabel')}</strong> {formatTime(session.start_time)} - {formatTime(session.end_time)}
                    </div>
                    
                    <div className="mb-2">
                      <strong>{t('sessions.capacity')}</strong> {session.booked_count || 0} / {session.max_students} {t('sessions.students')}
                    </div>
                    
                    <div className="mb-2">
                      <strong>{t('sessions.priceLabel')}</strong> ${session.price}
                    </div>
                    
                    <div className="mb-2">
                      <strong>{t('sessions.status')}</strong> 
                      <span className={`badge ${session.status === 'available' ? 'badge-success' : 'badge-secondary'}`}>
                        {session.status === 'available' ? t('sessions.statusAvailable') : session.status}
                      </span>
                    </div>
                    
                    <div className="mt-3 d-flex gap-2">
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => {
                          toast.info(t('sessions.editComingSoon'));
                        }}
                      >
                        {t('sessions.edit')}
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={async () => {
                          if (!window.confirm(t('sessions.deleteConfirm'))) return;
                          try {
                            await api.delete(`/sessions/${session.id}`);
                            toast.success(t('sessions.sessionDeleted'));
                            fetchSessions();
                          } catch (err) {
                            toast.error(err.response?.data?.error || t('sessions.deleteError'));
                          }
                        }}
                      >
                        {t('sessions.delete')}
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
