# Coaching Calendar App

A full-stack web application that allows coaches to manage their availability and students to book coaching sessions.

## Features

### For Coaches:
- Create and manage coaching sessions
- Set session times, prices, and capacity
- View bookings and manage calendar
- Track session statistics

### For Students:
- Browse available coaching sessions
- Book sessions with preferred coaches
- View and manage their bookings
- Filter sessions by coach and date

### General Features:
- User authentication (register/login)
- Role-based access control
- Responsive design
- Real-time notifications
- Session management

## Tech Stack

### Backend:
- Node.js with Express
- SQLite database
- JWT authentication
- bcryptjs for password hashing
- express-validator for input validation

### Frontend:
- React 18
- React Router for navigation
- Axios for API calls
- React Toastify for notifications
- Custom CSS for styling

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd coaching-calendar-app/server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the server directory:
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
```

4. Start the server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd coaching-calendar-app/client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The client will run on `http://localhost:3000`

### Running Both Together

From the root directory (`coaching-calendar-app`):

1. Install root dependencies:
```bash
npm install
```

2. Install all dependencies:
```bash
npm run install-all
```

3. Start both servers:
```bash
npm run dev
```

## Usage

### Getting Started

1. **Register**: Create an account as either a coach or student
2. **Login**: Access your dashboard
3. **Coaches**: Create sessions and manage your calendar
4. **Students**: Browse and book available sessions

### For Coaches

1. Go to "My Calendar" to create new sessions
2. Set session details (title, description, time, price, capacity)
3. View your created sessions and bookings
4. Manage your availability

### For Students

1. Go to "Book Sessions" to browse available sessions
2. Use filters to find sessions by coach or date
3. Book sessions that fit your schedule
4. View your bookings and cancel if needed

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `GET /api/profile` - Get user profile

### Sessions
- `POST /api/sessions` - Create new session (coaches only)
- `GET /api/sessions/coach` - Get coach's sessions
- `GET /api/sessions/available` - Get available sessions

### Bookings
- `POST /api/bookings` - Book a session (students only)
- `GET /api/bookings/student` - Get student's bookings
- `PUT /api/bookings/:id/cancel` - Cancel a booking

### Coaches
- `GET /api/coaches` - Get all coaches

## Database Schema

### Users Table
- `id` - Primary key
- `email` - Unique email address
- `password` - Hashed password
- `name` - User's full name
- `role` - 'coach' or 'student'
- `created_at` - Registration timestamp

### Sessions Table
- `id` - Primary key
- `coach_id` - Foreign key to users
- `title` - Session title
- `description` - Session description
- `start_time` - Session start time
- `end_time` - Session end time
- `max_students` - Maximum number of students
- `price` - Session price
- `status` - 'available', 'booked', or 'cancelled'

### Bookings Table
- `id` - Primary key
- `session_id` - Foreign key to sessions
- `student_id` - Foreign key to users
- `status` - 'pending', 'confirmed', or 'cancelled'
- `created_at` - Booking timestamp

## Development

### Project Structure
```
coaching-calendar-app/
├── server/                 # Backend API
│   ├── index.js           # Main server file
│   ├── package.json       # Server dependencies
│   └── .env               # Environment variables
├── client/                # Frontend React app
│   ├── public/            # Static files
│   ├── src/               # React source code
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   └── services/      # API services
│   └── package.json       # Client dependencies
└── package.json           # Root package.json
```

### Adding New Features

1. **Backend**: Add new routes in `server/index.js`
2. **Frontend**: Create new components in `client/src/components/`
3. **Database**: Modify schema in the server initialization code

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.
