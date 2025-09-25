#!/bin/bash

# =============================================================================
# COACHING CALENDAR APP - QUICK DEPLOYMENT SCRIPT
# =============================================================================
# This script updates an existing deployment with latest changes
# Run this script from the application directory
# =============================================================================

set -e  # Exit on any error

echo "🚀 QUICK DEPLOYMENT SCRIPT 🚀"
echo "============================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_header() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "server" ] || [ ! -d "client" ]; then
    echo "❌ Please run this script from the coaching-calendar-app directory"
    echo "Expected structure:"
    echo "  coaching-calendar-app/"
    echo "  ├── server/"
    echo "  └── client/"
    exit 1
fi

# =============================================================================
# STEP 1: PULL LATEST CHANGES
# =============================================================================
print_header "Step 1: Pulling latest changes from repository"

git pull origin main

print_status "Latest changes pulled"

# =============================================================================
# STEP 2: UPDATE BACKEND DEPENDENCIES
# =============================================================================
print_header "Step 2: Updating backend dependencies"

cd server
npm install
cd ..

print_status "Backend dependencies updated"

# =============================================================================
# STEP 3: UPDATE FRONTEND DEPENDENCIES
# =============================================================================
print_header "Step 3: Updating frontend dependencies"

cd client
npm install
cd ..

print_status "Frontend dependencies updated"

# =============================================================================
# STEP 4: BUILD FRONTEND
# =============================================================================
print_header "Step 4: Building frontend"

cd client

# Set environment variable for production build
export REACT_APP_API_URL=https://calla.sg

# Build the frontend
npm run build

# Copy build files to web directory
sudo cp -r build/* /var/www/html/

cd ..

print_status "Frontend built and deployed"

# =============================================================================
# STEP 5: RESTART BACKEND
# =============================================================================
print_header "Step 5: Restarting backend"

pm2 restart coaching-api

print_status "Backend restarted"

# =============================================================================
# STEP 6: RELOAD NGINX
# =============================================================================
print_header "Step 6: Reloading Nginx"

sudo systemctl reload nginx

print_status "Nginx reloaded"

# =============================================================================
# DEPLOYMENT COMPLETE
# =============================================================================
print_header "🎉 QUICK DEPLOYMENT COMPLETE! 🎉"

echo ""
echo "✅ DEPLOYMENT SUCCESSFUL!"
echo ""
echo "📊 STATUS CHECK:"
echo "- PM2 Status:"
pm2 status
echo ""
echo "- Nginx Status:"
sudo systemctl status nginx --no-pager -l
echo ""
echo "🌐 Your application is now updated and running!"
echo ""

print_status "Quick deployment completed successfully!"
