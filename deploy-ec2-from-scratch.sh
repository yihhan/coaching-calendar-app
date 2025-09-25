#!/bin/bash

# =============================================================================
# COACHING CALENDAR APP - EC2 DEPLOYMENT SCRIPT FROM SCRATCH
# =============================================================================
# This script sets up a complete deployment environment on EC2 Ubuntu
# Run this script as root or with sudo privileges
# =============================================================================

set -e  # Exit on any error

echo "🚀 STARTING EC2 DEPLOYMENT FROM SCRATCH 🚀"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root or with sudo"
   exit 1
fi

# =============================================================================
# STEP 1: UPDATE SYSTEM AND INSTALL ESSENTIAL PACKAGES
# =============================================================================
print_header "Step 1: Updating system and installing essential packages"

apt-get update -y
apt-get upgrade -y
apt-get install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

print_status "System updated and essential packages installed"

# =============================================================================
# STEP 2: INSTALL NODE.JS AND NPM
# =============================================================================
print_header "Step 2: Installing Node.js and npm"

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_status "Node.js installed: $NODE_VERSION"
print_status "npm installed: $NPM_VERSION"

# =============================================================================
# STEP 3: INSTALL NGINX
# =============================================================================
print_header "Step 3: Installing and configuring Nginx"

apt-get install -y nginx

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

print_status "Nginx installed and started"

# =============================================================================
# STEP 4: INSTALL PM2
# =============================================================================
print_header "Step 4: Installing PM2 process manager"

npm install -g pm2

# Setup PM2 startup script
pm2 startup systemd -u ubuntu --hp /home/ubuntu

print_status "PM2 installed and configured"

# =============================================================================
# STEP 5: INSTALL SQLITE3
# =============================================================================
print_header "Step 5: Installing SQLite3"

apt-get install -y sqlite3

print_status "SQLite3 installed"

# =============================================================================
# STEP 6: CONFIGURE FIREWALL
# =============================================================================
print_header "Step 6: Configuring firewall"

# Install UFW if not present
apt-get install -y ufw

# Configure firewall
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 5000  # For direct API access if needed

print_status "Firewall configured"

# =============================================================================
# STEP 7: CREATE APPLICATION DIRECTORY
# =============================================================================
print_header "Step 7: Creating application directory"

# Create application directory
mkdir -p /var/www/coaching-calendar-app
chown -R ubuntu:ubuntu /var/www/coaching-calendar-app

print_status "Application directory created: /var/www/coaching-calendar-app"

# =============================================================================
# STEP 8: CLONE REPOSITORY
# =============================================================================
print_header "Step 8: Cloning repository"

cd /var/www/coaching-calendar-app

# Clone your repository (replace with your actual repository URL)
print_warning "Please update the repository URL in this script with your actual GitHub repository"
print_warning "Current placeholder: https://github.com/yihhan/coaching-calendar-app.git"

# Uncomment and update this line with your actual repository:
# git clone https://github.com/yihhan/coaching-calendar-app.git .

# For now, create a placeholder structure
mkdir -p server client
print_warning "Repository cloning skipped - please manually clone your repository"

print_status "Repository structure prepared"

# =============================================================================
# STEP 9: INSTALL BACKEND DEPENDENCIES
# =============================================================================
print_header "Step 9: Installing backend dependencies"

cd /var/www/coaching-calendar-app/server

# Create package.json if it doesn't exist
if [ ! -f package.json ]; then
    cat > package.json << 'EOF'
{
  "name": "coaching-calendar-server",
  "version": "1.0.0",
  "description": "Backend server for coaching calendar app",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "express-session": "^1.18.2",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "sqlite3": "^5.1.6"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.5.0",
    "supertest": "^6.3.3"
  }
}
EOF
fi

# Install dependencies
npm install

print_status "Backend dependencies installed"

# =============================================================================
# STEP 10: INSTALL FRONTEND DEPENDENCIES
# =============================================================================
print_header "Step 10: Installing frontend dependencies"

cd /var/www/coaching-calendar-app/client

# Create package.json if it doesn't exist
if [ ! -f package.json ]; then
    cat > package.json << 'EOF'
{
  "name": "coaching-calendar-client",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.11.1",
    "react-scripts": "5.0.1",
    "react-select": "^5.7.0",
    "react-toastify": "^9.1.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
EOF
fi

# Install dependencies
npm install

print_status "Frontend dependencies installed"

# =============================================================================
# STEP 11: CREATE ENVIRONMENT FILES
# =============================================================================
print_header "Step 11: Creating environment files"

# Create server .env file
cd /var/www/coaching-calendar-app/server
cat > .env << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
DB_PATH=/var/www/coaching-calendar-app/server/coaching.db

# JWT Secret (CHANGE THIS TO A SECURE RANDOM STRING)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Session Secret (CHANGE THIS TO A SECURE RANDOM STRING)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Google OAuth (Add your Google OAuth credentials)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URL (Update with your domain)
FRONTEND_URL=https://yourdomain.com

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com
EOF

print_warning "Please update the .env file with your actual configuration values"
print_status "Environment file created: /var/www/coaching-calendar-app/server/.env"

# =============================================================================
# STEP 12: CONFIGURE NGINX
# =============================================================================
print_header "Step 12: Configuring Nginx"

# Create Nginx configuration
cat > /etc/nginx/sites-available/coaching-calendar << 'EOF'
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # Update with your domain
    
    # Frontend static files
    location / {
        root /var/www/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/coaching-calendar /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx

print_warning "Please update the domain name in the Nginx configuration"
print_status "Nginx configured"

# =============================================================================
# STEP 13: BUILD FRONTEND
# =============================================================================
print_header "Step 13: Building frontend"

cd /var/www/coaching-calendar-app/client

# Set environment variable for production build
export REACT_APP_API_URL=https://yourdomain.com

# Build the frontend
npm run build

# Copy build files to web directory
cp -r build/* /var/www/html/

print_warning "Please update REACT_APP_API_URL with your actual domain"
print_status "Frontend built and deployed"

# =============================================================================
# STEP 14: START BACKEND WITH PM2
# =============================================================================
print_header "Step 14: Starting backend with PM2"

cd /var/www/coaching-calendar-app/server

# Start the application with PM2
pm2 start index.js --name "coaching-api" --env production

# Save PM2 configuration
pm2 save

print_status "Backend started with PM2"

# =============================================================================
# STEP 15: SETUP SSL WITH CERTBOT (OPTIONAL)
# =============================================================================
print_header "Step 15: Setting up SSL with Certbot (Optional)"

print_warning "SSL setup is optional. To enable HTTPS:"
print_warning "1. Update your domain DNS to point to this server"
print_warning "2. Run: apt-get install -y certbot python3-certbot-nginx"
print_warning "3. Run: certbot --nginx -d yourdomain.com -d www.yourdomain.com"
print_warning "4. Update FRONTEND_URL in .env to use https://"

# =============================================================================
# DEPLOYMENT COMPLETE
# =============================================================================
print_header "🎉 DEPLOYMENT COMPLETE! 🎉"

echo ""
echo "=========================================="
echo "✅ EC2 DEPLOYMENT FROM SCRATCH COMPLETE"
echo "=========================================="
echo ""
echo "📋 NEXT STEPS:"
echo "1. Update your domain DNS to point to this server's IP"
echo "2. Update the following files with your actual values:"
echo "   - /var/www/coaching-calendar-app/server/.env"
echo "   - /etc/nginx/sites-available/coaching-calendar"
echo "3. Clone your actual repository:"
echo "   cd /var/www/coaching-calendar-app"
echo "   git clone https://github.com/yihhan/coaching-calendar-app.git ."
echo "4. Install dependencies and rebuild:"
echo "   cd server && npm install"
echo "   cd ../client && npm install && npm run build"
echo "   sudo cp -r build/* /var/www/html/"
echo "5. Restart services:"
echo "   pm2 restart coaching-api"
echo "   sudo systemctl reload nginx"
echo ""
echo "🔧 USEFUL COMMANDS:"
echo "- Check PM2 status: pm2 status"
echo "- View PM2 logs: pm2 logs coaching-api"
echo "- Restart backend: pm2 restart coaching-api"
echo "- Check Nginx status: sudo systemctl status nginx"
echo "- Test Nginx config: sudo nginx -t"
echo "- Reload Nginx: sudo systemctl reload nginx"
echo ""
echo "🌐 ACCESS YOUR APPLICATION:"
echo "- Frontend: http://your-server-ip"
echo "- API: http://your-server-ip/api"
echo ""
echo "📁 IMPORTANT DIRECTORIES:"
echo "- Application: /var/www/coaching-calendar-app"
echo "- Web files: /var/www/html"
echo "- Nginx config: /etc/nginx/sites-available/coaching-calendar"
echo "- Environment: /var/www/coaching-calendar-app/server/.env"
echo ""
echo "🔒 SECURITY REMINDERS:"
echo "- Change JWT_SECRET and SESSION_SECRET in .env"
echo "- Set up SSL certificates for HTTPS"
echo "- Configure Google OAuth credentials"
echo "- Update firewall rules if needed"
echo ""
echo "🎯 DEPLOYMENT SUCCESSFUL!"
echo "Your coaching calendar application is now running on EC2!"
echo ""

# Show current status
echo "📊 CURRENT STATUS:"
echo "- Nginx: $(systemctl is-active nginx)"
echo "- PM2: $(pm2 status --no-color | grep coaching-api | awk '{print $10}')"
echo "- Node.js: $(node --version)"
echo "- npm: $(npm --version)"
echo ""

print_status "Deployment script completed successfully!"
