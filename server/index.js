const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true, // Changed to true to ensure session is created
  cookie: { 
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategy (only if credentials are configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id' && 
    process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret') {
  
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.NODE_ENV === 'production' 
      ? 'https://calla.sg/api/auth/google/callback'
      : 'http://localhost:5000/api/auth/google/callback',
    passReqToCallback: true
  }, async (req, accessToken, refreshToken, profile, done) => {
    try {
      // Check if user already exists
      db.get(
        'SELECT * FROM users WHERE email = ?',
        [profile.emails[0].value],
        (err, user) => {
          if (err) return done(err);
          
          if (user) {
            // User exists, return user
            return done(null, user);
          } else {
            // Only allow creating a new user if the flow explicitly allowed it (Register route)
            const allowNew = req?.session?.allowNew === true;
            const roleFromSession = req?.session?.googleRole;
            if (!allowNew) {
              // Block new account creation on plain login flow
              return done(null, false, { message: 'User not registered' });
            }
            const roleToAssign = (roleFromSession === 'coach' || roleFromSession === 'student') ? roleFromSession : 'student';

            const newUser = {
              email: profile.emails[0].value,
              name: profile.displayName,
              role: roleToAssign,
              google_id: profile.id
            };

            db.run(
              'INSERT INTO users (email, name, role, google_id) VALUES (?, ?, ?, ?)',
              [newUser.email, newUser.name, newUser.role, newUser.google_id],
              function(err) {
                if (err) return done(err);
                newUser.id = this.lastID;
                return done(null, newUser);
              }
            );
          }
        }
      );
    } catch (error) {
      return done(error);
    }
  }));
  
  console.log('✅ Google OAuth strategy configured');
} else {
  console.log('⚠️  Google OAuth not configured - using placeholder credentials');
}

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
    done(err, user);
  });
});

// Database setup
const db = new sqlite3.Database('./coaching.db');

// Initialize database tables
db.serialize(() => {
  // Users table (coaches and students)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('coach', 'student')),
    google_id TEXT UNIQUE,
    description TEXT,
    expertise TEXT, -- JSON string of string[]
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Ensure google_id/description/expertise columns exist (simple migration for older DBs)
  db.get("PRAGMA table_info(users)", (err) => {
    if (err) {
      console.error('Error checking users table info:', err);
      return;
    }
    db.all("PRAGMA table_info(users)", (err2, columns) => {
      if (err2) {
        console.error('Error reading users table info:', err2);
        return;
      }
      const has = (name) => Array.isArray(columns) && columns.some((c) => c.name === name);
      if (!has('google_id')) {
        db.run("ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE", (alterErr) => {
          if (alterErr) console.error('Error adding google_id column:', alterErr);
        });
      }
      if (!has('description')) {
        db.run("ALTER TABLE users ADD COLUMN description TEXT", (alterErr) => {
          if (alterErr) console.error('Error adding description column:', alterErr);
        });
      }
      if (!has('expertise')) {
        db.run("ALTER TABLE users ADD COLUMN expertise TEXT", (alterErr) => {
          if (alterErr) console.error('Error adding expertise column:', alterErr);
        });
      }
    });
  });

  // Sessions table (coach availability)
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coach_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    max_students INTEGER DEFAULT 1,
    price DECIMAL(10,2) DEFAULT 0,
    status TEXT DEFAULT 'available' CHECK(status IN ('available', 'booked', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES users (id)
  )`);

  // Bookings table
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions (id),
    FOREIGN KEY (student_id) REFERENCES users (id)
  )`);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Routes

// Register
app.post('/api/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').notEmpty().trim(),
  body('role').isIn(['coach', 'student'])
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
    [email, hashedPassword, name, role],
    function(err) {
      if (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }

      const token = jwt.sign(
        { id: this.lastID, email, role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: { id: this.lastID, email, name, role }
      });
    }
  );
});

// Login
app.post('/api/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      });
    }
  );
});

// Google OAuth routes (only if configured)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id' && 
    process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret') {
  
  // Google OAuth routes
  app.get('/api/auth/google', (req, res, next) => {
    // Disallow new registrations via this route
    req.session.allowNew = false;
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
  });

  // IMPORTANT: Callback route must come BEFORE the role route to avoid conflicts
  app.get('/api/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login` }),
    (req, res) => {
      console.log('Google OAuth callback - Session role:', req.session.googleRole);
      console.log('Google OAuth callback - User:', req.user);
      
      // If this is a new user and we have a role in session, update their role
      if (req.session.googleRole && req.user) {
        console.log('Updating user role to:', req.session.googleRole);
        db.run(
          'UPDATE users SET role = ? WHERE id = ?',
          [req.session.googleRole, req.user.id],
          (err) => {
            if (err) {
              console.error('Error updating user role:', err);
            } else {
              req.user.role = req.session.googleRole;
              console.log('User role updated successfully');
            }
            
            // Clear the session role
            delete req.session.googleRole;
            
            // Generate JWT token for the authenticated user
            const token = jwt.sign(
              { id: req.user.id, email: req.user.email, role: req.user.role },
              process.env.JWT_SECRET || 'your-secret-key',
              { expiresIn: '24h' }
            );

            // Redirect to frontend with token
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
              id: req.user.id,
              email: req.user.email,
              name: req.user.name,
              role: req.user.role
            }))}`);
          }
        );
      } else {
        console.log('No session role found, using existing user role:', req.user.role);
        // Generate JWT token for the authenticated user
        const token = jwt.sign(
          { id: req.user.id, email: req.user.email, role: req.user.role },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '24h' }
        );

        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify({
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role
        }))}`);
      }
    }
  );

  // Google OAuth with role selection (Register flow only)
  app.get('/api/auth/google/:role', (req, res, next) => {
    const role = req.params.role;
    console.log('Google OAuth role selection - Role:', role);
    console.log('Google OAuth role selection - Session ID:', req.sessionID);

    if (!['student', 'coach'].includes(role)) {
      console.log('Invalid role provided:', role);
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Store role in session and explicitly allow new account creation for this flow
    req.session.googleRole = role;
    req.session.allowNew = true;
    console.log('Session role set to:', req.session.googleRole);

    passport.authenticate('google', {
      scope: ['profile', 'email']
    })(req, res, next);
  });
} else {
  // Fallback routes when Google OAuth is not configured
  app.get('/api/auth/google', (req, res) => {
    res.status(400).json({ 
      error: 'Google OAuth not configured', 
      message: 'Please configure Google OAuth credentials in your .env file' 
    });
  });
  
  app.get('/api/auth/google/:role', (req, res) => {
    res.status(400).json({ 
      error: 'Google OAuth not configured', 
      message: 'Please configure Google OAuth credentials in your .env file' 
    });
  });
  
}

// Test endpoint to verify Google OAuth setup
app.get('/api/test/google-setup', (req, res) => {
  const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
  const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
  const clientIdValid = process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id';
  const clientSecretValid = process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret';
  const isConfigured = hasClientId && hasClientSecret && clientIdValid && clientSecretValid;
  
  res.json({
    hasClientId,
    hasClientSecret,
    clientIdValid,
    clientSecretValid,
    isConfigured,
    message: isConfigured ? 'Google OAuth is properly configured!' : 'Google OAuth needs configuration. Please update your .env file with real Google credentials.'
  });
});

// Logout
app.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  db.get(
    'SELECT id, email, name, role, description, expertise, created_at FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (user && user.expertise) {
        try { user.expertise = JSON.parse(user.expertise); } catch (_) { user.expertise = []; }
      }
      res.json(user);
    }
  );
});

// Update profile (coach only for now)
app.put('/api/profile', authenticateToken, [
  body('name').optional().isString().trim().isLength({ min: 1 }),
  body('description').optional().isString(),
  body('expertise').optional()
], (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, expertise } = req.body;
  if (!name && !description && typeof expertise === 'undefined') {
    return res.status(400).json({ error: 'No changes provided' });
  }

  const isCoach = req.user.role === 'coach';
  // Normalize expertise to JSON string if provided
  let expertiseJson = undefined;
  if (typeof expertise !== 'undefined') {
    try {
      const list = Array.isArray(expertise) ? expertise : [];
      expertiseJson = JSON.stringify(list);
    } catch (_) {
      expertiseJson = JSON.stringify([]);
    }
  }

  const fields = [];
  const params = [];
  if (typeof name !== 'undefined') { fields.push('name = ?'); params.push(name); }
  if (isCoach && typeof description !== 'undefined') { fields.push('description = ?'); params.push(description); }
  if (isCoach && typeof expertiseJson !== 'undefined') { fields.push('expertise = ?'); params.push(expertiseJson); }
  params.push(req.user.id);

  db.run(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      // Return the updated profile
      db.get(
        'SELECT id, email, name, role, description, expertise, created_at FROM users WHERE id = ?',
        [req.user.id],
        (err2, user) => {
          if (err2) {
            return res.status(500).json({ error: 'Database error' });
          }
          // Parse expertise back to array
          if (user && user.expertise) {
            try { user.expertise = JSON.parse(user.expertise); } catch (_) { user.expertise = []; }
          }
          res.json({ message: 'Profile updated', user });
        }
      );
    }
  );
});

// Coach routes

// Create session
app.post('/api/sessions', authenticateToken, [
  body('title').notEmpty().trim(),
  body('start_time').isISO8601(),
  body('end_time').isISO8601(),
  body('max_students').optional().isInt({ min: 1 }),
  body('price').optional().isFloat({ min: 0 })
], (req, res) => {
  if (req.user.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can create sessions' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, start_time, end_time, max_students = 1, price = 0, repeat_interval = 'none', occurrences = 1 } = req.body;

  // Helper to format Date -> 'YYYY-MM-DDTHH:mm'
  const formatDateTime = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Parse base start/end
  const baseStart = new Date(start_time);
  const baseEnd = new Date(end_time);
  if (isNaN(baseStart.getTime()) || isNaN(baseEnd.getTime()) || baseEnd <= baseStart) {
    return res.status(400).json({ error: 'Invalid start/end time' });
  }

  const totalOccurrences = Math.max(1, Math.min(parseInt(occurrences || 1, 10), 52)); // cap at 52

  const created = [];
  const conflicts = [];

  const processOccurrence = (index) => {
    if (index >= totalOccurrences) {
      const hasRepeat = repeat_interval && repeat_interval !== 'none' && totalOccurrences > 1;
      const message = hasRepeat
        ? `Created ${created.length} session(s). Skipped ${conflicts.length} due to conflicts.`
        : 'Session created successfully';
      return res.status(created.length > 0 ? 201 : 409).json({
        message,
        created_count: created.length,
        skipped_count: conflicts.length,
        created,
        skipped: conflicts
      });
    }

    // Compute shifted times for this occurrence
    let offsetMs = 0;
    if (repeat_interval === 'weekly') {
      offsetMs = index * 7 * 24 * 60 * 60 * 1000;
    } else if (repeat_interval === 'daily') {
      offsetMs = index * 24 * 60 * 60 * 1000;
    }
    const s = new Date(baseStart.getTime() + offsetMs);
    const e = new Date(baseEnd.getTime() + offsetMs);
    const sStr = formatDateTime(s);
    const eStr = formatDateTime(e);

    // Overlap check for this occurrence
    db.get(
      `SELECT id FROM sessions 
       WHERE coach_id = ? 
       AND status IN ('available', 'booked')
       AND (
         (start_time < ? AND end_time > ?) OR
         (start_time < ? AND end_time > ?) OR
         (start_time >= ? AND end_time <= ?)
       )`,
      [req.user.id, eStr, sStr, sStr, eStr, sStr, eStr],
      (err, overlappingSession) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        if (overlappingSession) {
          conflicts.push({ index, start_time: sStr, end_time: eStr });
          return processOccurrence(index + 1);
        }

        // Insert this occurrence
        db.run(
          'INSERT INTO sessions (coach_id, title, description, start_time, end_time, max_students, price) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [req.user.id, title, description, sStr, eStr, max_students, price],
          function(insertErr) {
            if (insertErr) {
              return res.status(500).json({ error: 'Database error' });
            }
            created.push({ id: this.lastID, title, description, start_time: sStr, end_time: eStr, max_students, price });
            return processOccurrence(index + 1);
          }
        );
      }
    );
  };

  processOccurrence(0);
});

// Get coach's sessions
app.get('/api/sessions/coach', authenticateToken, (req, res) => {
  if (req.user.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can view their sessions' });
  }

  db.all(
    'SELECT s.*, COUNT(b.id) as booked_count FROM sessions s LEFT JOIN bookings b ON s.id = b.session_id AND b.status = "confirmed" WHERE s.coach_id = ? GROUP BY s.id ORDER BY s.start_time',
    [req.user.id],
    (err, sessions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(sessions);
    }
  );
});

// Delete a session (coach only). Block if there are confirmed bookings
app.delete('/api/sessions/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can delete sessions' });
  }

  const sessionId = req.params.id;

  // Ensure session belongs to coach
  db.get(
    'SELECT id FROM sessions WHERE id = ? AND coach_id = ?',
    [sessionId, req.user.id],
    (err, session) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      // Check for confirmed bookings
      db.get(
        'SELECT COUNT(*) AS count FROM bookings WHERE session_id = ? AND status = "confirmed"',
        [sessionId],
        (err2, row) => {
          if (err2) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (row.count > 0) {
            return res.status(400).json({ error: 'Cannot delete a session with confirmed bookings' });
          }

          // Safe to delete: remove pending/cancelled bookings then session
          db.run('DELETE FROM bookings WHERE session_id = ?', [sessionId], (err3) => {
            if (err3) {
              return res.status(500).json({ error: 'Database error' });
            }
            db.run('DELETE FROM sessions WHERE id = ?', [sessionId], function(err4) {
              if (err4) {
                return res.status(500).json({ error: 'Database error' });
              }
              return res.json({ message: 'Session deleted successfully' });
            });
          });
        }
      );
    }
  );
});

// Get all available sessions (for students)
app.get('/api/sessions/available', (req, res) => {
  const { coach_id, start_date, end_date, expertise } = req.query;
  
  let query = `
    SELECT 
      s.*, 
      u.name as coach_name, 
      u.email as coach_email,
      u.expertise as coach_expertise,
      (SELECT COUNT(*) FROM bookings b1 WHERE b1.session_id = s.id AND b1.status = 'confirmed') as booked_count,
      (SELECT COUNT(*) FROM bookings b2 WHERE b2.session_id = s.id AND b2.status IN ('confirmed', 'pending')) as held_count
    FROM sessions s 
    JOIN users u ON s.coach_id = u.id 
    WHERE s.status = "available" AND s.start_time > datetime('now')
  `;
  
  const params = [];
  
  if (coach_id) {
    query += ' AND s.coach_id = ?';
    params.push(coach_id);
  }
  if (expertise) {
    query += ' AND (u.expertise LIKE ?)';
    params.push('%"' + expertise + '"%');
  }
  
  if (start_date) {
    query += ' AND s.start_time >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    query += ' AND s.start_time <= ?';
    params.push(end_date);
  }
  
  query += ' ORDER BY s.start_time';
  
  db.all(query, params, (err, sessions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(sessions);
  });
});

// Get all sessions for availability calendar (shows both available and booked)
app.get('/api/sessions/calendar', (req, res) => {
  const { coach_id, start_date, end_date } = req.query;
  
  let query = `
    SELECT 
      s.*, 
      u.name as coach_name, 
      u.email as coach_email,
      (SELECT COUNT(*) FROM bookings b1 WHERE b1.session_id = s.id AND b1.status = 'confirmed') as booked_count,
      (SELECT COUNT(*) FROM bookings b2 WHERE b2.session_id = s.id AND b2.status IN ('confirmed','pending')) as held_count,
      CASE 
        WHEN (SELECT COUNT(*) FROM bookings b3 WHERE b3.session_id = s.id AND b3.status IN ('confirmed','pending')) >= s.max_students THEN 'booked'
        WHEN (SELECT COUNT(*) FROM bookings b4 WHERE b4.session_id = s.id AND b4.status = 'confirmed') > 0 THEN 'partially_booked'
        ELSE 'available'
      END as availability_status
    FROM sessions s 
    JOIN users u ON s.coach_id = u.id 
    WHERE s.status = "available" AND s.start_time > datetime('now')
  `;
  
  const params = [];
  
  if (coach_id) {
    query += ' AND s.coach_id = ?';
    params.push(coach_id);
  }
  
  if (start_date) {
    query += ' AND s.start_time >= ?';
    params.push(start_date);
  }
  
  if (end_date) {
    query += ' AND s.start_time <= ?';
    params.push(end_date);
  }
  
  query += ' ORDER BY s.start_time';
  
  db.all(query, params, (err, sessions) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(sessions);
  });
});

// Approve booking
app.put('/api/bookings/:id/approve', authenticateToken, (req, res) => {
  if (req.user.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can approve bookings' });
  }

  const bookingId = req.params.id;

  // First check if the booking exists and belongs to a session owned by this coach
  db.get(
    'SELECT b.*, s.coach_id FROM bookings b JOIN sessions s ON b.session_id = s.id WHERE b.id = ? AND s.coach_id = ?',
    [bookingId, req.user.id],
    (err, booking) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found or not authorized' });
      }

      if (booking.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending bookings can be approved' });
      }

      // Check if session is still available (not full)
      db.get(
        'SELECT s.max_students, COUNT(b2.id) as confirmed_count FROM sessions s LEFT JOIN bookings b2 ON s.id = b2.session_id AND b2.status = "confirmed" WHERE s.id = ? GROUP BY s.id',
        [booking.session_id],
        (err, sessionInfo) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (sessionInfo.confirmed_count >= sessionInfo.max_students) {
            return res.status(400).json({ error: 'Session is full' });
          }

          // Approve the booking
          db.run(
            'UPDATE bookings SET status = "confirmed" WHERE id = ?',
            [bookingId],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                message: 'Booking approved successfully',
                booking: { id: bookingId, status: 'confirmed' }
              });
            }
          );
        }
      );
    }
  );
});

// Reject booking
app.put('/api/bookings/:id/reject', authenticateToken, (req, res) => {
  if (req.user.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can reject bookings' });
  }

  const bookingId = req.params.id;

  // First check if the booking exists and belongs to a session owned by this coach
  db.get(
    'SELECT b.*, s.coach_id FROM bookings b JOIN sessions s ON b.session_id = s.id WHERE b.id = ? AND s.coach_id = ?',
    [bookingId, req.user.id],
    (err, booking) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found or not authorized' });
      }

      if (booking.status !== 'pending') {
        return res.status(400).json({ error: 'Only pending bookings can be rejected' });
      }

      // Reject the booking
      db.run(
        'UPDATE bookings SET status = "cancelled" WHERE id = ?',
        [bookingId],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            message: 'Booking rejected successfully',
            booking: { id: bookingId, status: 'cancelled' }
          });
        }
      );
    }
  );
});

// Get pending bookings for coach
app.get('/api/bookings/pending', authenticateToken, (req, res) => {
  if (req.user.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can view pending bookings' });
  }

  db.all(
    `SELECT b.*, s.title as session_title, s.start_time, s.end_time, u.name as student_name, u.email as student_email 
     FROM bookings b 
     JOIN sessions s ON b.session_id = s.id 
     JOIN users u ON b.student_id = u.id 
     WHERE s.coach_id = ? AND b.status = 'pending' 
     ORDER BY b.created_at DESC`,
    [req.user.id],
    (err, bookings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(bookings);
    }
  );
});

// Student routes

// Book a session
app.post('/api/bookings', authenticateToken, [
  body('session_id').isInt()
], (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can book sessions' });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { session_id } = req.body;

  // Check if session exists and is available
  db.get(
    'SELECT * FROM sessions WHERE id = ? AND status = "available"',
    [session_id],
    (err, session) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!session) {
        return res.status(404).json({ error: 'Session not found or not available' });
      }

      // Check if student already has a booking (confirmed or pending) for this session
      db.get(
        'SELECT * FROM bookings WHERE session_id = ? AND student_id = ? AND status IN ("confirmed", "pending")',
        [session_id, req.user.id],
        (err, existingBooking) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

          if (existingBooking) {
            return res.status(400).json({ error: 'You already have a booking or pending request for this session' });
          }

          // Check if session is full considering confirmed + pending
          db.get(
            'SELECT COUNT(*) as count FROM bookings WHERE session_id = ? AND status IN ("confirmed", "pending")',
            [session_id],
            (err, result) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              if (result.count >= session.max_students) {
                return res.status(400).json({ error: 'Session is full or has pending approvals reaching capacity' });
              }

              // Create booking with pending status
              db.run(
                'INSERT INTO bookings (session_id, student_id, status) VALUES (?, ?, "pending")',
                [session_id, req.user.id],
                function(err) {
                  if (err) {
                    return res.status(500).json({ error: 'Database error' });
                  }

                  res.status(201).json({
                    message: 'Booking request submitted. Waiting for coach approval.',
                    booking: { id: this.lastID, session_id, student_id: req.user.id, status: 'pending' }
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Get student's bookings
app.get('/api/bookings/student', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can view their bookings' });
  }

  db.all(
    `SELECT b.*, s.title, s.description, s.start_time, s.end_time, s.price,
            u.name as coach_name, u.email as coach_email
     FROM bookings b
     JOIN sessions s ON b.session_id = s.id
     JOIN users u ON s.coach_id = u.id
     WHERE b.student_id = ?
     ORDER BY s.start_time`,
    [req.user.id],
    (err, bookings) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(bookings);
    }
  );
});

// Cancel booking
app.put('/api/bookings/:id/cancel', authenticateToken, (req, res) => {
  const bookingId = req.params.id;

  db.run(
    'UPDATE bookings SET status = "cancelled" WHERE id = ? AND student_id = ?',
    [bookingId, req.user.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Booking not found or not authorized' });
      }

      res.json({ message: 'Booking cancelled successfully' });
    }
  );
});

// Get all coaches
app.get('/api/coaches', (req, res) => {
  db.all(
    'SELECT id, name, email FROM users WHERE role = "coach"',
    (err, coaches) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(coaches);
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
