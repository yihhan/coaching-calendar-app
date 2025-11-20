# Setup Guide for Coaching Calendar App

## Prerequisites

### 1. Install Node.js

Node.js is required to run this application. You need **Node.js v14 or higher**.

**Download and Install:**
- Visit: https://nodejs.org/
- Download the LTS (Long Term Support) version
- Run the installer and follow the installation wizard
- Make sure to check "Add to PATH" during installation

**Verify Installation:**
After installation, open a new PowerShell or Command Prompt window and run:
```powershell
node --version
npm --version
```

You should see version numbers for both commands.

## Installation Steps

Once Node.js is installed, follow these steps:

### Step 1: Install Dependencies

From the root directory (`C:\calla`), run:

```powershell
# Install root dependencies
npm install

# Install all dependencies (root, server, and client)
npm run install-all
```

Or install individually:
```powershell
# Root dependencies
npm install

# Server dependencies
cd server
npm install
cd ..

# Client dependencies
cd client
npm install
cd ..
```

### Step 2: Environment Configuration

The `.env` file has already been created in the `server/` directory with basic configuration. You can modify it if needed:

**Required:**
- `JWT_SECRET` - Secret key for JWT tokens (change this to a secure random string in production)
- `PORT` - Backend server port (default: 5000)

**Optional:**
- `SESSION_SECRET` - Secret for session management
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` - For Google OAuth login
- `EMAIL_USER` and `EMAIL_PASS` - For email notifications

### Step 3: Start the Application

**Option A: Run both server and client together (recommended):**
```powershell
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend client on `http://localhost:3000`

**Option B: Run separately:**

Terminal 1 (Backend):
```powershell
cd server
npm run dev
```

Terminal 2 (Frontend):
```powershell
cd client
npm start
```

## Troubleshooting

### Node.js not found
- Make sure Node.js is installed and added to PATH
- Restart your terminal/PowerShell after installation
- Verify with `node --version`

### Port already in use
- Change the PORT in `server/.env` if 5000 is already in use
- Make sure ports 3000 and 5000 are available

### Dependencies installation fails
- Make sure you have internet connection
- Try deleting `node_modules` folders and `package-lock.json` files, then run `npm install` again
- Check that you have Node.js v14 or higher

## Next Steps

1. Open your browser and go to `http://localhost:3000`
2. Register a new account (as coach or student)
3. Start using the application!

For more information, see the [README.md](README.md) file.


