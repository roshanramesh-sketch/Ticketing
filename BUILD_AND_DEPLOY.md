# TicketFlow - Build and Deployment Instructions

## Quick Start Summary

This document provides step-by-step instructions to build and deploy the TicketFlow ticketing application on your Ubuntu 22.04 LTS VM.

---

## Prerequisites Checklist

Before starting, ensure you have:

- [ ] Ubuntu 22.04 LTS VM with 2+ CPU cores and 2GB+ RAM
- [ ] PostgreSQL 18 running on 10.20.10.65:5434
- [ ] Database: `db_ticketing` with user `user_ticketing_app`
- [ ] Database password: `Ticketing@123`
- [ ] Admin credentials: `roshan.ramesh@bcits.in` / `Ticketing#321!`
- [ ] Gmail service account key: `tickets-key.json` (optional)
- [ ] Internet connection to download Docker and dependencies
- [ ] SSH access to the VM

---

## Step 1: Prepare Your System

### 1.1 SSH into Your VM

```bash
ssh ubuntu@10.20.10.65
# Or use your preferred SSH method
```

### 1.2 Update System

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### 1.3 Install Docker

```bash
# Download and install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add docker to user group (optional but recommended)
sudo usermod -aG docker $USER

# Verify installation
docker --version
```

### 1.4 Install Docker Compose

```bash
# Download latest Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Make executable
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker-compose --version
```

### 1.5 Install PostgreSQL Client (for database management)

```bash
sudo apt install -y postgresql-client
```

### 1.6 Verify Database Connectivity

```bash
# Test connection to PostgreSQL
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing

# You should see the PostgreSQL prompt: db_ticketing=>
# Type \q to exit
```

---

## Step 2: Setup Application Directory

### 2.1 Create Application Directory

```bash
# Create and navigate to application directory
mkdir -p /home/ubuntu/ticketflow
cd /home/ubuntu/ticketflow
```

### 2.2 Clone or Copy Application Files

**Option A: If using Git**

```bash
# Clone the repository (replace with your actual repo URL)
git clone <your-repository-url> .
```

**Option B: If copying files locally**

```bash
# Copy all application files to /home/ubuntu/ticketflow
# Use SCP or your preferred file transfer method
```

### 2.3 Verify File Structure

```bash
# List files to ensure everything is copied
ls -la /home/ubuntu/ticketflow

# You should see:
# - client/
# - server/
# - shared/
# - public/
# - Dockerfile
# - docker-compose.yml
# - package.json
# - .env
# - deploy.sh
# - And other configuration files
```

---

## Step 3: Configure Secrets and Keys

### 3.1 Create Secrets Directory

```bash
mkdir -p /home/ubuntu/ticketflow/secrets
chmod 700 /home/ubuntu/ticketflow/secrets
```

### 3.2 Add Gmail Service Account Key (Optional)

If you want email integration, copy your Gmail service account JSON file:

```bash
# Copy your Gmail key file
# Replace /path/to/tickets-key.json with actual path
cp /path/to/tickets-key.json /home/ubuntu/ticketflow/secrets/tickets-key.json

# Set permissions
chmod 600 /home/ubuntu/ticketflow/secrets/tickets-key.json
```

### 3.3 Verify Environment Configuration

```bash
# Check .env file
cat /home/ubuntu/ticketflow/.env

# Verify these critical values:
# DB_HOST=10.20.10.65
# DB_PORT=5434
# DB_USER=user_ticketing_app
# DB_PASSWORD=Ticketing@123
# DB_NAME=db_ticketing
```

---

## Step 4: Build the Application

### 4.1 Make Deployment Script Executable

```bash
chmod +x /home/ubuntu/ticketflow/deploy.sh
```

### 4.2 Run Automated Deployment (Recommended)

```bash
# Navigate to application directory
cd /home/ubuntu/ticketflow

# Run deployment script with sudo
sudo ./deploy.sh

# The script will:
# - Check prerequisites
# - Verify database connectivity
# - Create necessary directories
# - Build Docker image (may take 5-10 minutes)
# - Start containers
# - Run health checks
```

### 4.3 Manual Build (Alternative)

If you prefer manual control:

```bash
cd /home/ubuntu/ticketflow

# Build Docker image
docker-compose build --no-cache

# Start application
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## Step 5: Verify Deployment

### 5.1 Check Container Status

```bash
# List running containers
docker-compose ps

# Expected output should show:
# ticketflow-app    Up (Healthy)
# check-db          Exited (0)
```

### 5.2 Test API Endpoint

```bash
# Test the ping endpoint
curl http://localhost:8080/api/ping

# Expected response:
# {"message":"pong"}
```

### 5.3 Access the Application

Open your browser and go to:
```
http://10.20.10.65:8080
```

You should see the TicketFlow login page.

### 5.4 Login with Admin Credentials

- **Email**: roshan.ramesh@bcits.in
- **Password**: Ticketing#321!

---

## Step 6: Configure for Production

### 6.1 Enable SSL/TLS (Recommended)

```bash
# Install Nginx as reverse proxy
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Create Nginx config (edit with your preferred editor)
sudo nano /etc/nginx/sites-available/ticketflow
```

**Nginx Configuration:**

```nginx
upstream ticketflow {
    server 127.0.0.1:8080;
}

server {
    listen 80;
    server_name 10.20.10.65;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name 10.20.10.65;

    # SSL configuration (optional - use certbot for real certificates)
    # ssl_certificate /etc/ssl/certs/your-cert.crt;
    # ssl_certificate_key /etc/ssl/private/your-key.key;

    location / {
        proxy_pass http://ticketflow;
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

Enable and test:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ticketflow /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 6.2 Setup Firewall

```bash
# Enable UFW
sudo ufw --force enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Check rules
sudo ufw status
```

### 6.3 Setup Automatic Backups

```bash
# Create backup script
sudo nano /home/ubuntu/ticketflow/backup.sh

# Add the backup script content (see DEPLOYMENT_GUIDE.md)

# Make executable
chmod +x /home/ubuntu/ticketflow/backup.sh

# Add to crontab
sudo crontab -e

# Add this line for daily backup at 2 AM:
# 0 2 * * * /home/ubuntu/ticketflow/backup.sh
```

---

## Step 7: Post-Deployment Tasks

### 7.1 Test All Features

1. **Login**: Use admin credentials
2. **Dashboard**: Verify stats load correctly
3. **Create Ticket**: Test ticket creation
4. **Knowledge Base**: Test KB article management
5. **Admin Panel**: Verify user management works
6. **Settings**: Test password change functionality

### 7.2 Verify Database Integration

```bash
# Check if data is being saved in database
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing

# In PostgreSQL prompt:
SELECT COUNT(*) FROM schema_ticket.table_tickets;
SELECT COUNT(*) FROM schema_auth.table_users;

# Type \q to exit
```

### 7.3 Enable Log Monitoring

```bash
# View application logs
docker-compose logs -f ticketflow

# Monitor system resources
docker stats ticketflow-app

# Check for errors
docker-compose logs ticketflow | grep -i "error"
```

### 7.4 Test Email Integration (if configured)

The application is configured to use Gmail for email. If you've added the service account key:

1. Navigate to Knowledge Base
2. Create an article
3. The system will be ready to process incoming emails from tickets@bcits.co

---

## Daily Operations

### Starting the Application

```bash
cd /home/ubuntu/ticketflow
docker-compose up -d
```

### Stopping the Application

```bash
cd /home/ubuntu/ticketflow
docker-compose down
```

### Viewing Logs

```bash
cd /home/ubuntu/ticketflow
docker-compose logs -f
```

### Restarting the Application

```bash
cd /home/ubuntu/ticketflow
docker-compose restart
```

### Updating the Application

```bash
cd /home/ubuntu/ticketflow

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# View logs to confirm
docker-compose logs -f
```

---

## Troubleshooting

### Problem: Container won't start

**Solution:**
```bash
# Check logs
docker-compose logs ticketflow

# Verify database connectivity
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing

# Check .env file configuration
cat .env
```

### Problem: Application responds slowly

**Solution:**
```bash
# Check resource usage
docker stats ticketflow-app

# Check system resources
free -h
df -h

# Increase memory limit in docker-compose.yml if needed
```

### Problem: Database connection refused

**Solution:**
```bash
# Test PostgreSQL connection
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing

# If connection fails, check:
# 1. PostgreSQL is running on the target server
# 2. Network connectivity between VM and database server
# 3. Firewall allows connections to port 5434
```

### Problem: Port 8080 already in use

**Solution:**
```bash
# Find process using port
sudo lsof -i :8080

# Kill the process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
```

---

## Maintenance Schedule

| Task | Frequency | Command |
|------|-----------|---------|
| Backup Database | Daily | `pg_dump ... > backup.sql` |
| Check Logs | Daily | `docker-compose logs \| grep -i error` |
| Update Application | Weekly | `git pull && docker-compose up -d --build` |
| Monitor Resources | Daily | `docker stats` |
| Clean Old Logs | Monthly | `docker system prune -a` |
| Renew SSL Certificate | Annually | `certbot renew` |

---

## Security Checklist

- [ ] Changed default SESSION_SECRET
- [ ] SSL/TLS certificates installed
- [ ] Firewall is properly configured
- [ ] Backups are tested and working
- [ ] Admin password verified in database
- [ ] SSH key-based authentication enabled
- [ ] Non-root user running Docker
- [ ] Regular security updates applied
- [ ] Log monitoring enabled
- [ ] Database password changed from default (already Ticketing@123)

---

## Support Resources

- **Docker Docs**: https://docs.docker.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs
- **Application Guide**: See TICKETING_APP_GUIDE.md
- **Deployment Guide**: See DEPLOYMENT_GUIDE.md
- **Fixes Documentation**: See FIXES_APPLIED.md

---

## Next Steps

1. ✅ Complete Step 1-7 above
2. ✅ Test all application features
3. ✅ Configure SSL/TLS for production
4. ✅ Setup automated backups
5. ✅ Enable monitoring and logging
6. ✅ Create runbooks for common tasks
7. ✅ Train team on application usage
8. ✅ Document any customizations

---

## Additional Configuration Files

All necessary files are included in the repository:

- **Dockerfile** - Container definition
- **docker-compose.yml** - Service orchestration
- **deploy.sh** - Automated deployment script
- **.env** - Environment variables (credentials included)
- **DEPLOYMENT_GUIDE.md** - Detailed deployment instructions

---

**Deployment Completed**: [Your Date]
**Application Version**: 1.0.0
**Status**: Ready for Production
