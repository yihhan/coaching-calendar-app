const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      console.log('Invalid JSON received:', buf.toString());
      throw new Error('Invalid JSON');
    }
  }
}));

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
                if (err) {
                  if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE constraint failed: users.email')) {
                    return done(null, false, { message: 'Email already exists' });
                  }
                  return done(err);
                }
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
const db = new sqlite3.Database(process.env.NODE_ENV === 'production' 
  ? '/var/www/coaching-calendar-app/server/coaching.db' 
  : './coaching.db');

// Email service setup
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_ENABLED = EMAIL_USER && EMAIL_PASS && 
                      EMAIL_USER !== 'your-email@gmail.com' && 
                      EMAIL_PASS !== 'your-app-password';

let emailTransporter = null;

if (EMAIL_ENABLED) {
  emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });
  
  // Verify email configuration on startup
  emailTransporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email service verification failed:', error.message);
      console.error('   Please check your EMAIL_USER and EMAIL_PASS in .env file');
      console.error('   For Gmail, you need to use an App Password, not your regular password');
    } else {
      console.log('✅ Email service configured and verified');
    }
  });
} else {
  console.warn('⚠️  Email service not configured. Set EMAIL_USER and EMAIL_PASS in .env file to enable email notifications.');
  console.warn('   Example:');
  console.warn('   EMAIL_USER=your-email@gmail.com');
  console.warn('   EMAIL_PASS=your-gmail-app-password');
}

// Email notification function
const sendBookingNotification = async (coachEmail, coachName, studentName, sessionTitle, sessionDate, sessionTime) => {
  if (!EMAIL_ENABLED || !emailTransporter) {
    console.warn('⚠️  Email not configured - skipping booking notification email');
    return null;
  }

  try {
    const safeStudentName = studentName || 'Student';
    const mailOptions = {
      from: EMAIL_USER,
      to: coachEmail,
      subject: `New Booking Request - ${sessionTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">New Booking Request</h2>
          <p>Hi ${coachName},</p>
          <p>You have received a new booking request from <strong>${safeStudentName}</strong>:</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">${sessionTitle}</h3>
            <p><strong>Date:</strong> ${sessionDate}</p>
            <p><strong>Time:</strong> ${sessionTime}</p>
            <p><strong>Student:</strong> ${safeStudentName}</p>
          </div>
          
          <p>Please log in to your dashboard to confirm or decline this booking.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated notification from Calla - Just a good teacher away
            </p>
          </div>
        </div>
      `
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log(`📧 Booking notification sent to ${coachEmail}:`, result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Failed to send booking notification:', error.message);
    console.error('   Error details:', error.response || error);
    throw error;
  }
};

// Email notification to student upon coach decision
const sendStudentDecisionNotification = async (studentEmail, studentName, coachName, sessionTitle, sessionDate, sessionTime, decision) => {
  if (!EMAIL_ENABLED || !emailTransporter) {
    console.warn('⚠️  Email not configured - skipping student decision notification email');
    return null;
  }

  try {
    const safeStudentName = studentName || 'Student';
    const prettyDecision = (decision === 'approved') ? 'Approved' : 'Rejected';
    const subject = `Booking ${prettyDecision} - ${sessionTitle}`;

    const mailOptions = {
      from: EMAIL_USER,
      to: studentEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: ${decision === 'approved' ? '#10b981' : '#ef4444'};">Booking ${prettyDecision}</h2>
          <p>Hi ${safeStudentName},</p>
          <p>Your booking has been <strong>${prettyDecision.toLowerCase()}</strong> by <strong>${coachName}</strong>.</p>

          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">${sessionTitle}</h3>
            <p><strong>Date:</strong> ${sessionDate}</p>
            <p><strong>Time:</strong> ${sessionTime}</p>
            <p><strong>Coach:</strong> ${coachName}</p>
            <p><strong>Status:</strong> ${prettyDecision}</p>
          </div>

          <p>Please log in to your dashboard for details.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated notification from Calla - Just a good teacher away
            </p>
          </div>
        </div>
      `
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log(`📧 Student ${prettyDecision} notification sent to ${studentEmail}:`, result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Failed to send student decision notification:', error.message);
    console.error('   Error details:', error.response || error);
    throw error;
  }
};

// Email notification to subscribed students when coach creates a new session
const sendNewSessionNotification = async (studentEmail, studentName, coachName, sessionTitle, sessionDescription, sessionDate, sessionTime, sessionPrice, sessionMaxStudents) => {
  if (!EMAIL_ENABLED || !emailTransporter) {
    console.warn('⚠️  Email not configured - skipping new session notification email');
    return null;
  }

  try {
    const safeStudentName = studentName || 'Student';
    const subject = `New Session Available - ${sessionTitle} by ${coachName}`;

    const mailOptions = {
      from: EMAIL_USER,
      to: studentEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3b82f6;">New Session Available!</h2>
          <p>Hi ${safeStudentName},</p>
          <p><strong>${coachName}</strong> has just added a new coaching session that you might be interested in:</p>
          
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <h3 style="margin-top: 0; color: #1e40af;">${sessionTitle}</h3>
            ${sessionDescription ? `<p style="color: #4b5563;">${sessionDescription}</p>` : ''}
            <p><strong>Date:</strong> ${sessionDate}</p>
            <p><strong>Time:</strong> ${sessionTime}</p>
            <p><strong>Price:</strong> $${parseFloat(sessionPrice).toFixed(2)}</p>
            <p><strong>Capacity:</strong> ${sessionMaxStudents} student${sessionMaxStudents > 1 ? 's' : ''}</p>
            <p><strong>Coach:</strong> ${coachName}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/booking" 
               style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Book This Session
            </a>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
            You're receiving this because you're following ${coachName}. 
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile" style="color: #3b82f6;">Manage your subscriptions</a>
          </p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              This is an automated notification from Calla - Just a good teacher away
            </p>
          </div>
        </div>
      `
    };

    const result = await emailTransporter.sendMail(mailOptions);
    console.log(`📧 New session notification sent to ${studentEmail}:`, result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Failed to send new session notification:', error.message);
    console.error('   Error details:', error.response || error);
    throw error;
  }
};

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
  db.all("PRAGMA table_info(users)", (err, columns) => {
      if (err) {
        console.error('Error reading users table info:', err);
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

  // Credits table for coaches
  db.run(`CREATE TABLE IF NOT EXISTS credits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    coach_id INTEGER NOT NULL UNIQUE,
    balance DECIMAL(10,2) DEFAULT 100.00,
    last_deduction_date DATE DEFAULT CURRENT_DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (coach_id) REFERENCES users (id)
  )`, (err) => {
    if (err) {
      console.error('Error creating credits table:', err);
    } else {
      console.log('✅ Credits table ready');
    }
  });

  // Coach subscriptions table (students following coaches for session alerts)
  db.run(`CREATE TABLE IF NOT EXISTS coach_subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    coach_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES users (id),
    FOREIGN KEY (coach_id) REFERENCES users (id),
    UNIQUE(student_id, coach_id)
  )`, (err) => {
    if (err) {
      console.error('Error creating coach_subscriptions table:', err);
    } else {
      console.log('✅ Coach subscriptions table ready');
    }
  });

  // Session visibility whitelist (for private sessions - who can see them)
  db.run(`CREATE TABLE IF NOT EXISTS session_visibility_whitelist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users (id),
    UNIQUE(session_id, student_id)
  )`, (err) => {
    if (err) {
      console.error('Error creating session_visibility_whitelist table:', err);
    } else {
      console.log('✅ Session visibility whitelist table ready');
    }
  });

  // Add visibility column to sessions table if it doesn't exist
  // Note: ALTER TABLE ADD COLUMN doesn't support IF NOT EXISTS in SQLite
  // We'll try to add it and ignore the error if it already exists
  db.run(`ALTER TABLE sessions ADD COLUMN visibility TEXT DEFAULT 'public'`, (err) => {
    // SQLite returns error if column exists, which is fine
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding visibility column:', err);
    }
  });
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
        if (err.code === 'SQLITE_CONSTRAINT' && err.message.includes('UNIQUE constraint failed: users.email')) {
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
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 2000 }),
  body('expertise').optional().isArray()
], (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, expertise } = req.body;
  if ((!name || name === null) && (!description || description === null) && typeof expertise === 'undefined') {
    return res.status(400).json({ error: 'No changes provided' });
  }

  const isCoach = req.user.role === 'coach';
  // Normalize expertise to JSON string if provided
  let expertiseJson = undefined;
  if (typeof expertise !== 'undefined') {
    try {
      const list = Array.isArray(expertise) ? expertise : [];
      // Validate expertise items are strings and not too long
      const validList = list.filter(item => 
        typeof item === 'string' && item.trim().length > 0 && item.length <= 50
      );
      expertiseJson = JSON.stringify(validList);
    } catch (_) {
      expertiseJson = JSON.stringify([]);
    }
  }

  const fields = [];
  const params = [];
  if (typeof name !== 'undefined' && name !== null) { fields.push('name = ?'); params.push(name); }
  if (isCoach && typeof description !== 'undefined' && description !== null) { fields.push('description = ?'); params.push(description); }
  if (isCoach && typeof expertiseJson !== 'undefined' && expertiseJson !== null) { fields.push('expertise = ?'); params.push(expertiseJson); }
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

        // Get visibility and whitelist from request
        const visibility = req.body.visibility || 'public'; // Default to public
        const whitelist_student_ids = Array.isArray(req.body.whitelist_student_ids) ? req.body.whitelist_student_ids : []; // Array of student IDs for whitelist

        // Insert this occurrence
        db.run(
          'INSERT INTO sessions (coach_id, title, description, start_time, end_time, max_students, price, visibility) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [req.user.id, title, description, sStr, eStr, max_students, price, visibility],
          function(insertErr) {
            if (insertErr) {
              return res.status(500).json({ error: 'Database error' });
            }
            const sessionId = this.lastID;
            created.push({ id: sessionId, title, description, start_time: sStr, end_time: eStr, max_students, price, visibility });

            // If visibility is 'whitelist', add students to whitelist
            if (visibility === 'whitelist' && whitelist_student_ids.length > 0) {
              whitelist_student_ids.forEach((studentId) => {
                db.run(
                  'INSERT INTO session_visibility_whitelist (session_id, student_id) VALUES (?, ?)',
                  [sessionId, parseInt(studentId)],
                  (whitelistErr) => {
                    if (whitelistErr) {
                      console.error(`Error adding student ${studentId} to whitelist:`, whitelistErr);
                    }
                  }
                );
              });
            }
            
            // Notify subscribed students about the new session (non-blocking)
            // Only notify if visibility is 'public' or 'subscribers_only'
            if (index === 0 && (visibility === 'public' || visibility === 'subscribers_only')) {
              // For subscribers_only, only notify subscribers
              // For public, notify all subscribers
              db.all(
                `SELECT u.email, u.name as student_name 
                 FROM coach_subscriptions cs
                 JOIN users u ON cs.student_id = u.id
                 WHERE cs.coach_id = ?`,
                [req.user.id],
                async (subErr, subscribers) => {
                  if (!subErr && subscribers && subscribers.length > 0) {
                    const sessionDate = new Date(sStr).toLocaleDateString();
                    const sessionTime = new Date(sStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const coachName = req.user.name || 'Coach';
                    
                    // Send notifications to all subscribers
                    for (const subscriber of subscribers) {
                      try {
                        await sendNewSessionNotification(
                          subscriber.email,
                          subscriber.student_name,
                          coachName,
                          title,
                          description,
                          sessionDate,
                          sessionTime,
                          price,
                          max_students
                        );
                      } catch (notifyErr) {
                        console.error(`Failed to send new session notification to ${subscriber.email}:`, notifyErr);
                      }
                    }
                    console.log(`📧 Sent new session notifications to ${subscribers.length} subscribed student(s)`);
                  }
                }
              );
            }

            // For whitelist visibility, notify only whitelisted students
            if (index === 0 && visibility === 'whitelist' && whitelist_student_ids.length > 0) {
              const studentIdPlaceholders = whitelist_student_ids.map(() => '?').join(',');
              db.all(
                `SELECT email, name as student_name FROM users WHERE id IN (${studentIdPlaceholders}) AND role = 'student'`,
                whitelist_student_ids.map(id => parseInt(id)),
                async (whitelistErr, whitelistedStudents) => {
                  if (!whitelistErr && whitelistedStudents && whitelistedStudents.length > 0) {
                    const sessionDate = new Date(sStr).toLocaleDateString();
                    const sessionTime = new Date(sStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const coachName = req.user.name || 'Coach';
                    
                    for (const student of whitelistedStudents) {
                      try {
                        await sendNewSessionNotification(
                          student.email,
                          student.student_name,
                          coachName,
                          title,
                          description,
                          sessionDate,
                          sessionTime,
                          price,
                          max_students
                        );
                      } catch (notifyErr) {
                        console.error(`Failed to send new session notification to ${student.email}:`, notifyErr);
                      }
                    }
                    console.log(`📧 Sent new session notifications to ${whitelistedStudents.length} whitelisted student(s)`);
                  }
                }
              );
            }
            
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
app.get('/api/sessions/available', authenticateToken, (req, res) => {
  const { coach_id, start_date, end_date, expertise } = req.query;
  const studentId = req.user && req.user.role === 'student' ? req.user.id : null;
  
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
  
  // Visibility filtering: Only show sessions the student is allowed to see
  if (studentId) {
    const studentIdInt = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;
    // Use explicit exclusion approach: Show sessions EXCEPT restricted ones the student can't access
    // This ensures subscribers_only sessions are hidden if student is not subscribed
    // and whitelist sessions are hidden if student is not whitelisted
    query += ` AND NOT (
      (s.visibility = 'subscribers_only' AND NOT EXISTS (
        SELECT 1 FROM coach_subscriptions cs 
        WHERE cs.coach_id = s.coach_id 
        AND cs.student_id = ?
      ))
      OR (s.visibility = 'whitelist' AND NOT EXISTS (
        SELECT 1 FROM session_visibility_whitelist svw 
        WHERE svw.session_id = s.id 
        AND svw.student_id = ?
      ))
    )`;
    params.push(studentIdInt, studentIdInt);
  } else {
    // If not authenticated as student, only show public sessions (or NULL for backward compatibility)
    query += ` AND (s.visibility = 'public' OR s.visibility IS NULL)`;
  }
  
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
      console.error('Error fetching available sessions:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(sessions);
  });
});

// Get all sessions for availability calendar (shows both available and booked)
// This endpoint allows optional authentication - if authenticated, respects visibility; if not, shows only public
app.get('/api/sessions/calendar', (req, res) => {
  const { start_date, end_date } = req.query;
  let coach_id = req.query.coach_id;
  let studentId = null;

  // Try to authenticate if token is provided (optional)
  const authHeader = req.headers['authorization'];
  let authenticatedCoachId = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      if (payload) {
        if (payload.role === 'coach') {
          // Track if the authenticated user is a coach viewing their own sessions
          authenticatedCoachId = String(payload.id);
          // If no coach_id is specified in query, default to their own sessions
          if (!coach_id) {
            coach_id = authenticatedCoachId;
          }
        } else if (payload.role === 'student') {
          // Students need visibility filtering
          studentId = payload.id;
        }
      }
    } catch (_) {
      // Ignore invalid tokens; treat as public request
    }
  }
  
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
  
  // Visibility filtering: Only show sessions the user is allowed to see
  // Coaches see all their own sessions (handled by coach_id filter)
  // Students see sessions based on visibility rules (even when filtering by coach)
  // Unauthenticated users see only public sessions
  
  // First, handle coach filtering
  if (coach_id) {
    query += ' AND s.coach_id = ?';
    params.push(coach_id);
    
    // If the authenticated user is the coach themselves, they see all their sessions
    // Otherwise, apply visibility filtering
    const isOwnCoach = authenticatedCoachId && coach_id === authenticatedCoachId;
    if (!isOwnCoach) {
      // Apply visibility filtering for students or unauthenticated users viewing a coach
      if (studentId) {
        // Student viewing a specific coach - use explicit exclusion
        const studentIdInt = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;
        query += ` AND NOT (
          (s.visibility = 'subscribers_only' AND NOT EXISTS (
            SELECT 1 FROM coach_subscriptions cs 
            WHERE cs.coach_id = s.coach_id 
            AND cs.student_id = ?
          ))
          OR (s.visibility = 'whitelist' AND NOT EXISTS (
            SELECT 1 FROM session_visibility_whitelist svw 
            WHERE svw.session_id = s.id 
            AND svw.student_id = ?
          ))
        )`;
        params.push(studentIdInt, studentIdInt);
      } else {
        // Unauthenticated user viewing a coach - only public sessions (or NULL for backward compatibility)
        query += ` AND (s.visibility = 'public' OR s.visibility IS NULL)`;
      }
    }
    // If it's the coach viewing their own sessions, no visibility filter needed
  } else if (studentId) {
    // Student viewing all coaches - use explicit exclusion
    const studentIdInt = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;
    query += ` AND NOT (
      (s.visibility = 'subscribers_only' AND NOT EXISTS (
        SELECT 1 FROM coach_subscriptions cs 
        WHERE cs.coach_id = s.coach_id 
        AND cs.student_id = ?
      ))
      OR (s.visibility = 'whitelist' AND NOT EXISTS (
        SELECT 1 FROM session_visibility_whitelist svw 
        WHERE svw.session_id = s.id 
        AND svw.student_id = ?
      ))
    )`;
    params.push(studentIdInt, studentIdInt);
  } else {
    // Not authenticated and no coach filter - only show public sessions (or NULL for backward compatibility)
    query += ` AND (s.visibility = 'public' OR s.visibility IS NULL)`;
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
      console.error('Error fetching calendar sessions:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(sessions);
  });
});

// Approve booking
app.put('/api/bookings/:id/approve', authenticateToken, (req, res) => {
  try {
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can approve bookings' });
    }

    const bookingId = parseInt(req.params.id, 10);
    if (isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking ID' });
    }

    const coachId = typeof req.user.id === 'string' ? parseInt(req.user.id, 10) : req.user.id;
    if (isNaN(coachId)) {
      console.error('Invalid coach ID:', req.user.id);
      return res.status(500).json({ error: 'Invalid coach ID' });
    }

    // First check if the booking exists and belongs to a session owned by this coach
    db.get(
      'SELECT b.*, s.coach_id FROM bookings b JOIN sessions s ON b.session_id = s.id WHERE b.id = ? AND s.coach_id = ?',
      [bookingId, coachId],
      (err, booking) => {
        if (err) {
          console.error('Error fetching booking:', err);
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
            console.error('Error checking session capacity:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          if (!sessionInfo) {
            console.error('Session info not found for booking:', bookingId);
            return res.status(404).json({ error: 'Session not found' });
          }

          // Handle case where confirmed_count might be null or undefined
          // COUNT() returns a number, but check if sessionInfo exists
          const confirmedCount = sessionInfo ? (parseInt(sessionInfo.confirmed_count) || 0) : 0;
          const maxStudents = sessionInfo ? (parseInt(sessionInfo.max_students) || 1) : 1;

          if (confirmedCount >= maxStudents) {
            return res.status(400).json({ error: 'Session is full' });
          }

          // Approve the booking
          db.run(
            'UPDATE bookings SET status = "confirmed" WHERE id = ?',
            [bookingId],
            function(updateErr) {
              if (updateErr) {
                console.error('Error updating booking status:', updateErr);
                return res.status(500).json({ error: 'Database error' });
              }

              // Send response FIRST, then handle email notification asynchronously
              res.json({
                message: 'Booking approved successfully',
                booking: { id: bookingId, status: 'confirmed' }
              });

              // Notify student (non-blocking, happens after response is sent)
              db.get(
                `SELECT s.title, s.start_time, u.name as coach_name, u2.name as student_name, u2.email as student_email
                 FROM bookings b
                 JOIN sessions s ON b.session_id = s.id
                 JOIN users u ON s.coach_id = u.id
                 JOIN users u2 ON b.student_id = u2.id
                 WHERE b.id = ?`,
                [bookingId],
                async (infoErr, info) => {
                  if (infoErr) {
                    console.error('Error fetching info for email notification:', infoErr);
                    return;
                  }
                  if (!info) {
                    console.error('No info found for email notification');
                    return;
                  }
                  try {
                    const sessionDate = new Date(info.start_time).toLocaleDateString();
                    const sessionTime = new Date(info.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    await sendStudentDecisionNotification(
                      info.student_email,
                      info.student_name,
                      info.coach_name,
                      info.title,
                      sessionDate,
                      sessionTime,
                      'approved'
                    );
                  } catch (notifyErr) {
                    console.error('Failed sending approve email to student:', notifyErr);
                  }
                }
              );
              
              // Email notification happens asynchronously after response is sent
            }
          );
        }
      );
    }
  );
  } catch (error) {
    console.error('Error in approve booking endpoint:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
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

          // Notify student (non-blocking)
          db.get(
            `SELECT s.title, s.start_time, u.name as coach_name, u2.name as student_name, u2.email as student_email
             FROM bookings b
             JOIN sessions s ON b.session_id = s.id
             JOIN users u ON s.coach_id = u.id
             JOIN users u2 ON b.student_id = u2.id
             WHERE b.id = ?`,
            [bookingId],
            async (infoErr, info) => {
              if (!infoErr && info) {
                try {
                  const sessionDate = new Date(info.start_time).toLocaleDateString();
                  const sessionTime = new Date(info.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  await sendStudentDecisionNotification(
                    info.student_email,
                    info.student_name,
                    info.coach_name,
                    info.title,
                    sessionDate,
                    sessionTime,
                    'rejected'
                  );
                } catch (notifyErr) {
                  console.error('Failed sending reject email to student:', notifyErr);
                }
              }
            }
          );

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

// Get all students (for coaches to select for whitelist)
app.get('/api/students', authenticateToken, (req, res) => {
  if (req.user.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can view students' });
  }

  db.all(
    'SELECT id, name, email, created_at FROM users WHERE role = ? ORDER BY name',
    ['student'],
    (err, students) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(students);
    }
  );
});

// Coach Subscription endpoints (for students to follow coaches and get session alerts)

// Subscribe to a coach (student only)
app.post('/api/subscriptions/:coachId', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can subscribe to coaches' });
  }

  const coachId = parseInt(req.params.coachId);
  const studentId = req.user.id;

  if (coachId === studentId) {
    return res.status(400).json({ error: 'Cannot subscribe to yourself' });
  }

  // Verify coach exists and is actually a coach
  db.get(
    'SELECT id, name, role FROM users WHERE id = ? AND role = ?',
    [coachId, 'coach'],
    (err, coach) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!coach) {
        return res.status(404).json({ error: 'Coach not found' });
      }

      // Check if already subscribed
      db.get(
        'SELECT id FROM coach_subscriptions WHERE student_id = ? AND coach_id = ?',
        [studentId, coachId],
        (err2, existing) => {
          if (err2) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (existing) {
            return res.status(400).json({ error: 'Already subscribed to this coach' });
          }

          // Create subscription
          db.run(
            'INSERT INTO coach_subscriptions (student_id, coach_id) VALUES (?, ?)',
            [studentId, coachId],
            function(insertErr) {
              if (insertErr) {
                return res.status(500).json({ error: 'Database error' });
              }
              res.status(201).json({
                message: `You are now following ${coach.name}. You'll receive email alerts when they add new sessions.`,
                subscription: { id: this.lastID, student_id: studentId, coach_id: coachId }
              });
            }
          );
        }
      );
    }
  );
});

// Unsubscribe from a coach (student only)
app.delete('/api/subscriptions/:coachId', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can unsubscribe from coaches' });
  }

  const coachId = parseInt(req.params.coachId);
  const studentId = req.user.id;

  db.run(
    'DELETE FROM coach_subscriptions WHERE student_id = ? AND coach_id = ?',
    [studentId, coachId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Subscription not found' });
      }
      res.json({ message: 'Unsubscribed successfully' });
    }
  );
});

// Get student's subscriptions (student only)
app.get('/api/subscriptions', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can view their subscriptions' });
  }

  db.all(
    `SELECT cs.id, cs.coach_id, cs.created_at,
            u.name as coach_name, u.email as coach_email, u.description as coach_description, u.expertise as coach_expertise
     FROM coach_subscriptions cs
     JOIN users u ON cs.coach_id = u.id
     WHERE cs.student_id = ?
     ORDER BY cs.created_at DESC`,
    [req.user.id],
    (err, subscriptions) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      // Parse expertise JSON
      const parsed = subscriptions.map(sub => {
        if (sub.coach_expertise) {
          try {
            sub.coach_expertise = JSON.parse(sub.coach_expertise);
          } catch (_) {
            sub.coach_expertise = [];
          }
        }
        return sub;
      });
      res.json(parsed);
    }
  );
});

// Check if student is subscribed to a specific coach
app.get('/api/subscriptions/:coachId', authenticateToken, (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can check subscriptions' });
  }

  const coachId = parseInt(req.params.coachId);
  const studentId = req.user.id;

  db.get(
    'SELECT id FROM coach_subscriptions WHERE student_id = ? AND coach_id = ?',
    [studentId, coachId],
    (err, subscription) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ subscribed: !!subscription });
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

                  // Send email notification to coach
                  db.get(
                    'SELECT u.email, u.name as coach_name FROM users u JOIN sessions s ON u.id = s.coach_id WHERE s.id = ?',
                    [session_id],
                    async (err, coach) => {
                      if (err) {
                        console.error('Error fetching coach info for email:', err);
                      } else if (coach) {
                        // Fetch student's display name for email (fallback to email)
                        db.get(
                          'SELECT name, email FROM users WHERE id = ?',
                          [req.user.id],
                          async (studentErr, student) => {
                            const studentDisplayName = (student && student.name)
                              ? student.name
                              : (student && student.email)
                                ? student.email
                                : 'Student';

                            try {
                              const sessionDate = new Date(session.start_time).toLocaleDateString();
                              const sessionTime = new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              await sendBookingNotification(
                                coach.email,
                                coach.coach_name,
                                studentDisplayName,
                                session.title,
                                sessionDate,
                                sessionTime
                              );
                            } catch (emailError) {
                              console.error('Failed to send booking notification email:', emailError);
                            }
                          }
                        );
                      }
                    }
                  );

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

// Credit management functions
const initializeCoachCredits = (coachId) => {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT OR IGNORE INTO credits (coach_id, balance, last_deduction_date) VALUES (?, 100.00, CURRENT_DATE)',
      [coachId],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
};

const processDailyCreditDeductions = () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT coach_id, balance, last_deduction_date 
       FROM credits 
       WHERE last_deduction_date < CURRENT_DATE`,
      (err, credits) => {
        if (err) {
          reject(err);
          return;
        }

        const updates = credits.map(credit => {
          const daysSinceLastDeduction = Math.floor(
            (new Date() - new Date(credit.last_deduction_date)) / (1000 * 60 * 60 * 24)
          );
          const newBalance = Math.max(0, credit.balance - daysSinceLastDeduction);
          
          return new Promise((resolveUpdate, rejectUpdate) => {
            db.run(
              'UPDATE credits SET balance = ?, last_deduction_date = CURRENT_DATE WHERE coach_id = ?',
              [newBalance, credit.coach_id],
              function(updateErr) {
                if (updateErr) {
                  rejectUpdate(updateErr);
                } else {
                  resolveUpdate();
                }
              }
            );
          });
        });

        Promise.all(updates)
          .then(() => resolve())
          .catch(reject);
      }
    );
  });
};

// Get coach credits
app.get('/api/credits', authenticateToken, (req, res) => {
  if (req.user.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can access credits' });
  }

  console.log(`📊 Fetching credits for coach ID: ${req.user.id}`);

  db.get(
    'SELECT balance, last_deduction_date FROM credits WHERE coach_id = ?',
    [req.user.id],
    async (err, credit) => {
      if (err) {
        console.error('Database error fetching credits:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // If no credit record exists, create one
      if (!credit) {
        console.log(`💰 No credits found for coach ${req.user.id}, initializing...`);
        try {
          await initializeCoachCredits(req.user.id);
          credit = { balance: 100.00, last_deduction_date: new Date().toISOString().split('T')[0] };
          console.log(`✅ Credits initialized for coach ${req.user.id}`);
        } catch (initErr) {
          console.error('Failed to initialize credits:', initErr);
          return res.status(500).json({ error: 'Failed to initialize credits' });
        }
      }

      // Process daily deductions before returning
      try {
        await processDailyCreditDeductions();
        
        // Get updated balance
        db.get(
          'SELECT balance, last_deduction_date FROM credits WHERE coach_id = ?',
          [req.user.id],
          (finalErr, finalCredit) => {
            if (finalErr) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.json(finalCredit);
          }
        );
      } catch (deductionErr) {
        return res.status(500).json({ error: 'Failed to process credit deductions' });
      }
    }
  );
});

// Initialize credits for existing coaches (admin function)
app.post('/api/credits/initialize-all', authenticateToken, (req, res) => {
  if (req.user.role !== 'coach') {
    return res.status(403).json({ error: 'Only coaches can access this endpoint' });
  }

  db.all('SELECT id FROM users WHERE role = "coach"', (err, coaches) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    const initPromises = coaches.map(coach => initializeCoachCredits(coach.id));
    
    Promise.all(initPromises)
      .then(() => {
        res.json({ message: `Initialized credits for ${coaches.length} coaches` });
      })
      .catch(initErr => {
        res.status(500).json({ error: 'Failed to initialize some credits' });
      });
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.log('Error caught by global handler:', error.message);
  
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
