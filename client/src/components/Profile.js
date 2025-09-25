import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', expertise: [] });
  const [showAllExpertise, setShowAllExpertise] = useState(false);
  const EXPERTISE_OPTIONS = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Computer Science',
    'Public Speaking', 'Career Coaching', 'Fitness', 'Music'
  ];
  const expertiseOptions = EXPERTISE_OPTIONS.map(v => ({ value: v, label: v }));

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      setProfile(response.data);
      setForm({ 
        name: response.data?.name || '',
        description: response.data?.description || '',
        expertise: Array.isArray(response.data?.expertise) ? response.data.expertise : []
      });
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/profile', { name: form.name, description: form.description, expertise: form.expertise });
      toast.success('Profile updated');
      // Update local state
      setProfile(res.data.user);
      if (setUser) setUser(res.data.user);
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="container">
        <div className="card">
          <div className="card-body text-center">
            <h3>Loading profile...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Profile</h1>
        </div>
        
        <div className="card-body">
          <div className="d-flex justify-content-end mb-3 gap-2">
            {!editing && (
              <>
                <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>
                <button className="btn btn-secondary" onClick={() => toast.info('Password change coming soon!')}>Change Password</button>
              </>
            )}
          </div>
          <div className="grid grid-3">
            <div className="card h-100">
              <div className="card-body">
                <h3>Personal Information</h3>
                {!editing ? (
                  <div className="mb-2">
                    <strong>Name:</strong> {profile?.name}
                  </div>
                ) : (
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Name</label>
                    <input
                      id="name"
                      name="name"
                      className="form-control"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                )}
                <div className="mb-2">
                  <strong>Email:</strong> {profile?.email}
                </div>
                <div className="mb-2">
                  <strong>Role:</strong>{' '}
                  <span className={`badge ${profile?.role === 'coach' ? 'badge-primary' : 'badge-success'}`}>
                    {profile?.role}
                  </span>
                </div>
                <div className="mb-2">
                  <strong>Member Since:</strong> {formatDate(profile?.created_at)}
                </div>
              </div>
            </div>
            
            {profile?.role === 'coach' && (
            <div className="card h-100">
              <div className="card-body">
                <h3>About</h3>
                {!editing ? (
                  <>
                    {profile?.description ? (
                      <p style={{ whiteSpace: 'pre-wrap' }}>{profile.description}</p>
                    ) : (
                      <p className="text-muted">No description added yet.</p>
                    )}
                  </>
                ) : (
                  <div className="mb-3">
                    <textarea
                      id="description"
                      name="description"
                      className="form-control"
                      rows="8"
                      style={{ minHeight: '180px', width: '100%' }}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Tell students about your experience, approach, and what you offer"
                    />
                  </div>
                )}
                
              </div>
            </div>
            )}

            

            {profile?.role === 'coach' && (
            <div className="card h-100">
              <div className="card-body">
                <h3>Expertise</h3>
                {!editing ? (
                  <>
                    {Array.isArray(profile?.expertise) && profile.expertise.length > 0 ? (
                      <>
                        {!showAllExpertise ? (
                          <div>
                            <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                              {profile.expertise.slice(0, 3).map(e => (
                                <li key={e}>{e}</li>
                              ))}
                            </ul>
                            {profile.expertise.length > 3 && (
                              <button type="button" className="btn btn-sm btn-light mt-2" onClick={() => setShowAllExpertise(true)}>
                                +{profile.expertise.length - 3} more
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px' }}>
                            <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                              {profile.expertise.map(e => (
                                <li key={e}>{e}</li>
                              ))}
                            </ul>
                            <div className="mt-2 text-end">
                              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowAllExpertise(false)}>Show less</button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-muted">No expertise selected.</p>
                    )}
                  </>
                ) : (
                  <div>
                    <Select
                      inputId="expertise"
                      isMulti
                      options={expertiseOptions}
                      value={form.expertise.map(v => ({ value: v, label: v }))}
                      onChange={(vals) => {
                        const values = Array.isArray(vals) ? vals.map(v => v.value) : [];
                        setForm(prev => ({ ...prev, expertise: values }));
                      }}
                      classNamePrefix="react-select"
                      styles={{ container: (base) => ({ ...base, width: '100%' }) }}
                      placeholder="Search and select expertise..."
                    />
                  </div>
                )}
              </div>
            </div>
            )}
          </div>
          
          {profile?.role === 'coach' && editing && (
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button type="button" className="btn btn-success" onClick={handleSave}>Save Changes</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          )}
          
          {profile?.role === 'student' && editing && (
            <div className="d-flex justify-content-end gap-2 mt-3">
              <button type="button" className="btn btn-success" onClick={handleSave}>Save Changes</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          )}
          
          {profile?.role === 'coach' && (
            <div className="card mt-3">
              <div className="card-body">
                <h3>Coach Statistics</h3>
                <p className="text-muted">Track your coaching performance and student engagement.</p>
                
                <div className="grid grid-3">
                  <div className="text-center">
                    <h4>0</h4>
                    <p className="text-muted">Total Sessions</p>
                  </div>
                  <div className="text-center">
                    <h4>0</h4>
                    <p className="text-muted">Students Taught</p>
                  </div>
                  <div className="text-center">
                    <h4>$0</h4>
                    <p className="text-muted">Total Revenue</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <a href="/calendar" className="btn btn-primary">
                    Manage Sessions
                  </a>
                </div>
              </div>
            </div>
          )}
          
          {profile?.role === 'student' && (
            <div className="card mt-3">
              <div className="card-body">
                <h3>Learning Progress</h3>
                <p className="text-muted">Track your learning journey and achievements.</p>
                
                <div className="grid grid-3">
                  <div className="text-center">
                    <h4>0</h4>
                    <p className="text-muted">Sessions Booked</p>
                  </div>
                  <div className="text-center">
                    <h4>0</h4>
                    <p className="text-muted">Coaches Worked With</p>
                  </div>
                  <div className="text-center">
                    <h4>$0</h4>
                    <p className="text-muted">Total Spent</p>
                  </div>
                </div>
                
                <div className="mt-3">
                  <a href="/booking" className="btn btn-primary">
                    Browse Sessions
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
