# 🚀 EC2 Deployment Guide - Coaching Calendar App

This guide provides complete instructions for deploying the Coaching Calendar App on AWS EC2 from scratch.

## 📋 Prerequisites

- AWS EC2 instance (Ubuntu 20.04+ recommended)
- Domain name (optional, but recommended for production)
- Google OAuth credentials (for Google login functionality)
- SSH access to your EC2 instance

## 🛠️ Quick Start

### Option 1: Automated Deployment (Recommended)

1. **Connect to your EC2 instance:**
   ```bash
   ssh -i your-key.pem ubuntu@your-ec2-ip
   ```

2. **Download and run the deployment script:**
   ```bash
   wget https://raw.githubusercontent.com/yihhan/coaching-calendar-app/main/deploy-ec2-from-scratch.sh
   chmod +x deploy-ec2-from-scratch.sh
   sudo ./deploy-ec2-from-scratch.sh
   ```

3. **Follow the script prompts and update configuration files as needed**

### Option 2: Manual Deployment

Follow the step-by-step instructions below.

## 📝 Step-by-Step Manual Deployment

### Step 1: Update System and Install Dependencies

```bash
# Update system
sudo apt-get update -y
sudo apt-get upgrade -y

# Install essential packages
sudo apt-get install -y curl wget git unzip software-properties-common

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Nginx
sudo apt-get install -y nginx

# Install PM2
sudo npm install -g pm2

# Install SQLite3
sudo apt-get install -y sqlite3

# Configure firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
```

### Step 2: Create Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/coaching-calendar-app
sudo chown -R ubuntu:ubuntu /var/www/coaching-calendar-app
```

### Step 3: Clone Repository

```bash
cd /var/www/coaching-calendar-app
git clone https://github.com/yihhan/coaching-calendar-app.git .
```

### Step 4: Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Step 5: Configure Environment

```bash
# Create server environment file
cd ../server
cp .env.example .env
nano .env
```

Update the `.env` file with your configuration:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FRONTEND_URL=https://yourdomain.com
```

### Step 6: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/coaching-calendar
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
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
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/coaching-calendar /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: Build and Deploy Frontend

```bash
cd /var/www/coaching-calendar-app/client

# Set environment variable
export REACT_APP_API_URL=https://yourdomain.com

# Build frontend
npm run build

# Deploy to web directory
sudo cp -r build/* /var/www/html/
```

### Step 8: Start Backend with PM2

```bash
cd /var/www/coaching-calendar-app/server

# Start application
pm2 start index.js --name "coaching-api" --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### Step 9: Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Update environment file to use HTTPS
nano /var/www/coaching-calendar-app/server/.env
# Change FRONTEND_URL to https://yourdomain.com
```

## 🔄 Updating Your Application

For future updates, use the quick deployment script:

```bash
cd /var/www/coaching-calendar-app
chmod +x quick-deploy.sh
./quick-deploy.sh
```

Or manually:

```bash
cd /var/www/coaching-calendar-app
git pull origin main
cd server && npm install
cd ../client && npm install && npm run build
sudo cp -r build/* /var/www/html/
pm2 restart coaching-api
sudo systemctl reload nginx
```

## 🛠️ Useful Commands

### PM2 Commands
```bash
pm2 status                    # Check application status
pm2 logs coaching-api         # View application logs
pm2 restart coaching-api      # Restart application
pm2 stop coaching-api         # Stop application
pm2 start coaching-api        # Start application
```

### Nginx Commands
```bash
sudo systemctl status nginx   # Check Nginx status
sudo nginx -t                 # Test Nginx configuration
sudo systemctl reload nginx   # Reload Nginx configuration
sudo systemctl restart nginx  # Restart Nginx
```

### System Commands
```bash
sudo systemctl status nginx   # Check Nginx status
sudo ufw status              # Check firewall status
df -h                        # Check disk usage
free -h                      # Check memory usage
```

## 🔧 Configuration Files

### Important Files and Locations

- **Application Code:** `/var/www/coaching-calendar-app/`
- **Environment Config:** `/var/www/coaching-calendar-app/server/.env`
- **Nginx Config:** `/etc/nginx/sites-available/coaching-calendar`
- **Web Files:** `/var/www/html/`
- **PM2 Config:** `~/.pm2/`

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Backend port | `5000` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `SESSION_SECRET` | Session secret | `your-session-secret` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `your-client-id` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | `your-client-secret` |
| `FRONTEND_URL` | Frontend URL | `https://yourdomain.com` |

## 🔒 Security Considerations

1. **Change Default Secrets:** Update `JWT_SECRET` and `SESSION_SECRET` in `.env`
2. **Use HTTPS:** Set up SSL certificates with Certbot
3. **Firewall:** Configure UFW to only allow necessary ports
4. **Regular Updates:** Keep system and dependencies updated
5. **Backup:** Regularly backup your database and configuration

## 🐛 Troubleshooting

### Common Issues

1. **Port 5000 in use:**
   ```bash
   sudo lsof -i :5000
   sudo kill -9 <PID>
   ```

2. **Nginx configuration error:**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

3. **PM2 application not starting:**
   ```bash
   pm2 logs coaching-api
   pm2 restart coaching-api
   ```

4. **Frontend not loading:**
   ```bash
   ls -la /var/www/html/
   sudo systemctl status nginx
   ```

### Log Locations

- **Application Logs:** `pm2 logs coaching-api`
- **Nginx Logs:** `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- **System Logs:** `journalctl -u nginx`

## 📞 Support

If you encounter issues:

1. Check the logs using the commands above
2. Verify all configuration files are correct
3. Ensure all services are running
4. Check firewall and security group settings
5. Verify domain DNS settings

## 🎉 Success!

Once deployed, your application will be available at:
- **Frontend:** `http://yourdomain.com` (or `https://yourdomain.com` with SSL)
- **API:** `http://yourdomain.com/api`

Your coaching calendar application is now live on EC2! 🚀
