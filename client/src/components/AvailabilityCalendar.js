import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import TruncatedText from './TruncatedText';

const AvailabilityCalendar = () => {
  const [sessions, setSessions] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCoach, setSelectedCoach] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    // Default to list view on mobile devices
    if (window.innerWidth <= 768) {
      return 'list';
    }
    return 'month';
  }); // month, week, day, list

  const fetchCoaches = useCallback(async () => {
    try {
      const response = await api.get('/coaches');
      setCoaches(response.data);
    } catch (error) {
      console.error('Failed to fetch coaches:', error);
    }
  }, []);

  const fetchSessions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCoach) {
        params.append('coach_id', selectedCoach);
      }
      
      // Add date range for the current view
      const startDate = new Date(currentDate);
      const endDate = new Date(currentDate);
      
      if (viewMode === 'month') {
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
      } else if (viewMode === 'week') {
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        endDate.setDate(startDate.getDate() + 6);
      }
      
      // Temporarily disable date filtering to debug
      // params.append('start_date', startDate.toISOString().split('T')[0]);
      // params.append('end_date', endDate.toISOString().split('T')[0]);
      
      console.log('Fetching from:', `/sessions/calendar?${params}`);
      const response = await api.get(`/sessions/calendar?${params}`);
      console.log('Sessions response:', response.data);
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to fetch sessions');
    }
  }, [selectedCoach, currentDate, viewMode]);

  const fetchData = useCallback(async () => {
    try {
      await Promise.all([
        fetchCoaches(),
        fetchSessions()
      ]);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [fetchCoaches, fetchSessions]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getSessionsForDate = (date) => {
    if (!date) return [];
    // Use local date string instead of ISO string to avoid timezone issues
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    console.log(`Looking for sessions on ${dateStr}, total sessions: ${sessions.length}`);
    const daySessions = sessions.filter(session => {
      // Handle the session time format properly
      let sessionDateStr;
      if (session.start_time.includes('T')) {
        // Format: "2025-09-30T12:50" -> "2025-09-30"
        // Extract just the date part before the 'T'
        sessionDateStr = session.start_time.split('T')[0];
      } else {
        // Fallback to Date parsing
        sessionDateStr = new Date(session.start_time).toISOString().split('T')[0];
      }
      
      console.log(`Comparing ${dateStr} with ${sessionDateStr} (from ${session.start_time})`);
      return sessionDateStr === dateStr;
    });
    console.log(`Found ${daySessions.length} sessions for ${dateStr}`);
    return daySessions;
  };

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (direction * 7));
    setCurrentDate(newDate);
  };

  const navigateDay = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + direction);
    setCurrentDate(newDate);
  };

  const getWeekDates = (date) => {
    const weekDates = [];
    const dayOfWeek = date.getDay();
    const startDate = new Date(date);
    startDate.setDate(date.getDate() - dayOfWeek);
    
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(startDate);
      weekDate.setDate(startDate.getDate() + i);
      weekDates.push(weekDate);
    }
    
    return weekDates;
  };

  const renderListView = () => {
    // Group sessions by date
    const groupedSessions = sessions.reduce((groups, session) => {
      const date = new Date(session.start_time).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
      return groups;
    }, {});

    // Sort dates
    const sortedDates = Object.keys(groupedSessions).sort((a, b) => new Date(a) - new Date(b));

    return (
      <div className="calendar-list-view">
        {sortedDates.length === 0 ? (
          <div className="text-center">
            <h3>No sessions available</h3>
            <p className="text-muted">No sessions scheduled</p>
          </div>
        ) : (
          sortedDates.map(date => (
            <div key={date} className="date-group mb-4">
              <div className="date-header">
                <h4 className="date-title">{new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</h4>
              </div>
              
              <div className="sessions-list">
                {groupedSessions[date].map(session => (
                  <div key={session.id} className={`session-card session-${session.availability_status} mb-3`}>
                    <div className="session-header d-flex justify-content-between align-items-start">
                      <h5 className="session-title-truncated" title={session.title}>
                        {session.title.toUpperCase()}
                      </h5>
                      <span className={`session-price badge ${session.availability_status === 'booked' ? 'bg-danger' : session.availability_status === 'partially_booked' ? 'bg-warning' : 'bg-success'}`}>
                        ${session.price}
                      </span>
                    </div>
                    
                    <div className="session-details">
                      <div className="mb-2">
                        <strong>Coach:</strong> {session.coach_name}
                      </div>
                      
                      <div className="mb-2">
                        <strong>Time:</strong> {formatTime(session.start_time)} - {formatTime(session.end_time)}
                      </div>
                      
                      <div className="mb-2">
                        <strong>Capacity:</strong> {session.booked_count || 0} / {session.max_students} students
                      </div>
                      
                      {session.description && (
                        <div className="session-description">
                          <strong>Description:</strong> 
                          <TruncatedText 
                            text={session.description} 
                            maxLines={2}
                            truncateBy="lines"
                            className="ml-1"
                          />
                        </div>
                      )}
                      
                      <div className="session-status mt-2">
                        {session.availability_status === 'booked' && (
                          <span className="badge bg-danger">FULL</span>
                        )}
                        {session.availability_status === 'partially_booked' && (
                          <span className="badge bg-warning">{session.booked_count}/{session.max_students}</span>
                        )}
                        {session.availability_status === 'available' && (
                          <span className="badge bg-success">Available</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    return (
      <div className="calendar-month">
        <div className="calendar-header">
          <h3>{monthName}</h3>
          <div className="calendar-navigation">
            <button onClick={() => navigateMonth(-1)} className="btn btn-sm btn-outline-primary">←</button>
            <button onClick={() => navigateMonth(1)} className="btn btn-sm btn-outline-primary">→</button>
          </div>
        </div>
        
        <div className="calendar-grid">
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>
          
          <div className="calendar-days">
            {days.map((day, index) => {
              const daySessions = getSessionsForDate(day);
              return (
                <div key={index} className={`calendar-day ${day ? 'has-date' : 'empty'}`}>
                  {day && (
                    <>
                      <div className="day-number">{day.getDate()}</div>
                      <div className="day-sessions">
                        {daySessions.map(session => (
                          <div key={session.id} className={`session-item session-${session.availability_status}`}>
                            <div className="session-time">{formatTime(session.start_time)}</div>
                            <div className="session-title text-truncate" title={session.title}>
                              {session.title.toUpperCase()}
                            </div>
                            <div className="session-coach text-truncate" title={session.coach_name}>
                              {session.coach_name}
                            </div>
                            {session.availability_status === 'booked' && (
                              <div className="session-status">FULL</div>
                            )}
                            {session.availability_status === 'partially_booked' && (
                              <div className="session-status">{session.booked_count}/{session.max_students}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];
    const weekRange = `${weekStart.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`;
    
    return (
      <div className="calendar-week">
        <div className="calendar-header">
          <h3>Week of {weekRange}</h3>
          <div className="calendar-navigation">
            <button onClick={() => navigateWeek(-1)} className="btn btn-sm btn-outline-primary">←</button>
            <button onClick={() => navigateWeek(1)} className="btn btn-sm btn-outline-primary">→</button>
          </div>
        </div>
        
        <div className="calendar-week-grid">
          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="calendar-weekday">{day}</div>
            ))}
          </div>
          
          <div className="calendar-week-days">
            {weekDates.map((day, index) => {
              const daySessions = getSessionsForDate(day);
              return (
                <div key={index} className="calendar-week-day">
                  <div className="day-number">{day.getDate()}</div>
                  <div className="day-sessions">
                    {daySessions.map(session => (
                      <div key={session.id} className={`session-item session-${session.availability_status}`}>
                        <div className="session-time">{formatTime(session.start_time)}</div>
                        <div className="session-title text-truncate" title={session.title}>
                          {session.title.toUpperCase()}
                        </div>
                        <div className="session-coach text-truncate" title={session.coach_name}>
                          {session.coach_name}
                        </div>
                        <div className="session-price">${session.price}</div>
                        {session.availability_status === 'booked' && (
                          <div className="session-status">FULL</div>
                        )}
                        {session.availability_status === 'partially_booked' && (
                          <div className="session-status">{session.booked_count}/{session.max_students}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const daySessions = getSessionsForDate(currentDate);
    const dayName = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    return (
      <div className="calendar-day-view">
        <div className="calendar-header">
          <h3>{dayName}</h3>
          <div className="calendar-navigation">
            <button onClick={() => navigateDay(-1)} className="btn btn-sm btn-outline-primary">←</button>
            <button onClick={() => navigateDay(1)} className="btn btn-sm btn-outline-primary">→</button>
          </div>
        </div>
        
        <div className="calendar-day-sessions">
          {daySessions.length === 0 ? (
            <div className="no-sessions">No sessions available for this day</div>
          ) : (
            daySessions.map(session => (
              <div key={session.id} className={`session-card session-${session.availability_status}`}>
                <div className="session-header">
                  <h5 className="session-title-truncated" title={session.title}>
                    {session.title.toUpperCase()}
                  </h5>
                  <div className="session-header-right">
                    <span className="session-price">${session.price}</span>
                    {session.availability_status === 'booked' && (
                      <span className="session-status-badge">FULL</span>
                    )}
                    {session.availability_status === 'partially_booked' && (
                      <span className="session-status-badge">{session.booked_count}/{session.max_students}</span>
                    )}
                  </div>
                </div>
                <div className="session-details">
                  <div className="session-time">
                    <strong>Time:</strong> {formatTime(session.start_time)} - {formatTime(session.end_time)}
                  </div>
                  <div className="session-coach">
                    <strong>Coach:</strong> <span className="text-truncate" title={session.coach_name}>{session.coach_name}</span>
                  </div>
                  <div className="session-capacity">
                    <strong>Capacity:</strong> {session.max_students} students
                  </div>
                  {session.description && (
                    <div className="session-description">
                      <strong>Description:</strong> 
                      <TruncatedText 
                        text={session.description} 
                        maxLines={2}
                        truncateBy="lines"
                        className="ml-1"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mt-3">
        <div className="card">
          <div className="card-body text-center">
            <h3>Loading calendar...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-3">
      <div className="card">
        <div className="card-header">
          <h2>Coach Availability Calendar</h2>
        </div>
        <div className="card-body">
          {/* Filters */}
          <div className="card mb-4" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <div className="card-body">
              <h5 className="card-title mb-3" style={{ color: '#0f172a', fontWeight: '600' }}>
                <i className="fas fa-filter me-2" style={{ color: '#4f46e5' }}></i>
                Filter Options
              </h5>
              <div className="row g-3 align-items-end">
                <div className="col-md-4">
                  <label htmlFor="coachFilter" className="form-label fw-semibold mb-2" style={{ color: '#475569' }}>
                    Coach
                  </label>
                  <select 
                    id="coachFilter"
                    className="form-select" 
                    value={selectedCoach} 
                    onChange={(e) => setSelectedCoach(e.target.value)}
                    style={{ 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      backgroundColor: '#ffffff',
                      height: '42px',
                      textAlign: 'left',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    <option value="">All Coaches</option>
                    {coaches.map(coach => (
                      <option key={coach.id} value={coach.id} title={coach.name}>{coach.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label htmlFor="viewMode" className="form-label fw-semibold mb-2" style={{ color: '#475569' }}>
                    View Mode
                  </label>
                  <select 
                    id="viewMode"
                    className="form-select" 
                    value={viewMode} 
                    onChange={(e) => setViewMode(e.target.value)}
                    style={{ 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      backgroundColor: '#ffffff',
                      height: '42px',
                      textAlign: 'left'
                    }}
                  >
                    <option value="month">Month</option>
                    <option value="week">Week</option>
                    <option value="day">Day</option>
                    <option value="list">List</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label htmlFor="datePicker" className="form-label fw-semibold mb-2" style={{ color: '#475569' }}>
                    Go to Date
                  </label>
                  <input 
                    id="datePicker"
                    type="date" 
                    className="form-control" 
                    value={currentDate.toISOString().split('T')[0]}
                    onChange={(e) => setCurrentDate(new Date(e.target.value))}
                    style={{ 
                      border: '1px solid #d1d5db', 
                      borderRadius: '8px',
                      padding: '10px 12px',
                      fontSize: '14px',
                      backgroundColor: '#ffffff',
                      height: '42px',
                      textAlign: 'left'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>


          {/* Calendar View */}
          <div className="calendar-container">
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
            {viewMode === 'list' && renderListView()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
