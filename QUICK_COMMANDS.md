# TicketFlow - Quick Commands Reference

## Pre-Deployment Commands

### Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Verify installation
docker --version
docker-compose --version
```

### Install PostgreSQL Client

```bash
sudo apt install -y postgresql-client
```

### Test Database Connection

```bash
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing

# Password: Ticketing@123
```

---

## Setup Commands

### Create Application Directory

```bash
mkdir -p /home/ubuntu/ticketflow
cd /home/ubuntu/ticketflow
```

### Create Secrets Directory

```bash
mkdir -p /home/ubuntu/ticketflow/secrets
chmod 700 /home/ubuntu/ticketflow/secrets
```

### Copy Gmail Key (Optional)

```bash
cp /path/to/tickets-key.json /home/ubuntu/ticketflow/secrets/tickets-key.json
chmod 600 /home/ubuntu/ticketflow/secrets/tickets-key.json
```

---

## Deployment Commands

### Make Script Executable

```bash
chmod +x /home/ubuntu/ticketflow/deploy.sh
```

### Automated Deployment (Recommended)

```bash
cd /home/ubuntu/ticketflow
sudo ./deploy.sh
```

### Manual Build

```bash
cd /home/ubuntu/ticketflow

# Build image
docker-compose build --no-cache

# Start containers
docker-compose up -d

# View logs
docker-compose logs -f
```

### Test Deployment

```bash
# Check container status
docker-compose ps

# Test API
curl http://localhost:8080/api/ping

# Expected: {"message":"pong"}
```

---

## Daily Operations

### Start Application

```bash
cd /home/ubuntu/ticketflow
docker-compose up -d
```

### Stop Application

```bash
cd /home/ubuntu/ticketflow
docker-compose down
```

### View Logs

```bash
cd /home/ubuntu/ticketflow

# All logs
docker-compose logs -f

# Only application logs
docker-compose logs -f ticketflow

# Last 100 lines
docker-compose logs --tail=100 ticketflow

# Grep for errors
docker-compose logs ticketflow | grep -i error
```

### Restart Application

```bash
cd /home/ubuntu/ticketflow
docker-compose restart

# Or restart specific service
docker-compose restart ticketflow
```

### Check Container Status

```bash
# Detailed status
docker-compose ps

# Check health
docker inspect --format='{{.State.Health.Status}}' ticketflow-app

# System resources
docker stats ticketflow-app
```

---

## Database Commands

### Connect to Database

```bash
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing
```

### Common Database Queries

```sql
-- Count users
SELECT COUNT(*) FROM schema_auth.table_users;

-- Count tickets
SELECT COUNT(*) FROM schema_ticket.table_tickets;

-- View all users
SELECT id, firstname, lastname, email, role FROM schema_auth.table_users;

-- View recent tickets
SELECT id, subject, status, created_time FROM schema_ticket.table_tickets LIMIT 10;

-- Count KB articles
SELECT COUNT(*) FROM schema_kb.table_kb_items;

-- View activity logs
SELECT user_id, action, timestamp FROM schema_system.table_activity_logs LIMIT 10;
```

### Backup Database

```bash
# Create backup
pg_dump -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup with compression
pg_dump -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Restore from backup
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing < backup_20240101_120000.sql
```

---

## Update & Upgrade Commands

### Update Application (with Git)

```bash
cd /home/ubuntu/ticketflow

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Verify
docker-compose logs -f
```

### Update Application (without Git)

```bash
cd /home/ubuntu/ticketflow

# Copy new files
# (use SCP or your preferred method)

# Rebuild
docker-compose build --no-cache
docker-compose up -d

# Verify
docker-compose logs -f
```

---

## Firewall Commands

### Enable UFW

```bash
sudo ufw --force enable
```

### Allow Ports

```bash
# SSH
sudo ufw allow 22/tcp

# HTTP
sudo ufw allow 80/tcp

# HTTPS
sudo ufw allow 443/tcp

# PostgreSQL (if needed)
sudo ufw allow 5434/tcp
```

### Check Firewall Status

```bash
sudo ufw status
sudo ufw status verbose
```

---

## SSL/TLS Setup (Nginx)

### Install Nginx

```bash
sudo apt install -y nginx
```

### Create Nginx Config

```bash
sudo nano /etc/nginx/sites-available/ticketflow
```

**Add this content:**

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

    # Add SSL certificates here
    # ssl_certificate /etc/ssl/certs/cert.crt;
    # ssl_certificate_key /etc/ssl/private/key.key;

    location / {
        proxy_pass http://ticketflow;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Enable and Test Nginx

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/ticketflow /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx
```

---

## Monitoring & Debugging

### Monitor Container Resources

```bash
# Real-time stats
docker stats ticketflow-app

# One-time check
docker inspect ticketflow-app

# Process info
docker top ticketflow-app
```

### Check System Resources

```bash
# Memory and CPU
free -h
top -b -n 1

# Disk usage
df -h

# Network
netstat -tuln | grep 8080
```

### View Environment Variables

```bash
# In container
docker exec ticketflow-app env | sort

# From .env file
cat /home/ubuntu/ticketflow/.env
```

### Test API Endpoints

```bash
# Health check
curl http://localhost:8080/api/ping

# Verbose output
curl -v http://localhost:8080/api/ping

# Check headers
curl -i http://localhost:8080/api/ping

# With JSON data
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"roshan.ramesh@bcits.in","password":"Ticketing#321!"}'
```

---

## Troubleshooting Commands

### Check Container Logs

```bash
# Application logs
docker-compose logs ticketflow

# Follow logs
docker-compose logs -f ticketflow

# Specific number of lines
docker-compose logs --tail=50 ticketflow

# With timestamps
docker-compose logs -t ticketflow
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart ticketflow

# Force restart
docker-compose down
docker-compose up -d
```

### Rebuild Container

```bash
# Clean rebuild
docker-compose down
docker system prune -f
docker-compose build --no-cache
docker-compose up -d
```

### Find and Kill Processes

```bash
# Find process on port 8080
sudo lsof -i :8080

# Kill process by PID
sudo kill -9 <PID>

# Kill all Docker containers
docker-compose down
```

---

## Backup & Recovery

### Create Backup

```bash
# Database backup
pg_dump -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing > db_backup.sql

# Application files backup
tar -czf ticketflow_backup.tar.gz /home/ubuntu/ticketflow/
```

### Restore from Backup

```bash
# Restore database
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing < db_backup.sql

# Restore application
tar -xzf ticketflow_backup.tar.gz -C /
```

### Automated Daily Backup

```bash
# Edit crontab
sudo crontab -e

# Add this line for 2 AM daily backup:
0 2 * * * pg_dump -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing | gzip > /home/ubuntu/ticketflow/backups/db_backup_$(date +\%Y\%m\%d_\%H\%M\%S).sql.gz
```

---

## Access Credentials

### Admin Login

```
URL: http://10.20.10.65:8080/login
Email: roshan.ramesh@bcits.in
Password: Ticketing#321!
```

### Database

```
Host: 10.20.10.65
Port: 5434
User: user_ticketing_app
Password: Ticketing@123
Database: db_ticketing
```

### Gmail Service Account

```
Email: tickets@bcits.co
Key File: /home/ubuntu/ticketflow/secrets/tickets-key.json
```

---

## System Information

### Check Ubuntu Version

```bash
lsb_release -a
uname -a
```

### Check Docker Version

```bash
docker --version
docker-compose --version
```

### Check PostgreSQL Version

```bash
psql --version
```

### Get System Uptime

```bash
uptime
```

---

## Common Issues & Solutions

### Issue: Connection refused

```bash
# Check if service is running
docker-compose ps

# Restart service
docker-compose restart

# Check logs
docker-compose logs -f
```

### Issue: Out of memory

```bash
# Check memory usage
docker stats

# Clean up Docker
docker system prune -a

# Increase container memory in docker-compose.yml
```

### Issue: Database connection timeout

```bash
# Test connectivity
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing

# Check network
ping 10.20.10.65

# Check port
nc -zv 10.20.10.65 5434
```

---

## Cleanup Commands

### Remove Stopped Containers

```bash
docker container prune -f
```

### Remove Dangling Images

```bash
docker image prune -f
```

### Remove All Unused Resources

```bash
docker system prune -a -f
```

### Clear Logs

```bash
# Docker logs cleanup
docker system prune --volumes -f

# Application logs cleanup
rm -f /home/ubuntu/ticketflow/logs/*
```

---

## Reference Documentation

For more detailed information, see:

- **BUILD_AND_DEPLOY.md** - Step-by-step deployment guide
- **DEPLOYMENT_GUIDE.md** - Comprehensive deployment documentation
- **TICKETING_APP_GUIDE.md** - Application feature documentation
- **FIXES_APPLIED.md** - Technical fixes and changes

---

**Last Updated**: 2024
**Version**: 1.0.0
**Status**: Ready for Deployment
