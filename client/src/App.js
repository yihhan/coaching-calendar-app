import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import CoachCalendar from './components/CoachCalendar';
import StudentBooking from './components/StudentBooking';
import Profile from './components/Profile';
import AvailabilityCalendar from './components/AvailabilityCalendar';
import AuthCallback from './components/AuthCallback';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="container text-center mt-3">
        <div className="card">
          <div className="card-body">
            <h3>Loading...</h3>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/calendar" element={user && user.role === 'coach' ? <CoachCalendar /> : <Navigate to="/dashboard" />} />
      <Route path="/availability" element={user ? <AvailabilityCalendar /> : <Navigate to="/login" />} />
      <Route path="/booking" element={user && user.role === 'student' ? <StudentBooking /> : <Navigate to="/dashboard" />} />
      <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
      <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
