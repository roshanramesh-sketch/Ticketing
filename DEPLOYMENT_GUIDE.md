# TicketFlow - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the TicketFlow ticketing application on your Ubuntu 22.04 LTS VM with Docker.

---

## System Requirements

- **OS**: Ubuntu 22.04 LTS
- **CPU**: 2+ cores
- **RAM**: 2GB+ (4GB recommended)
- **Storage**: 10GB+ available space
- **Docker**: Version 20.10+
- **Docker Compose**: Version 1.29+
- **PostgreSQL 18**: Running on 10.20.10.65:5434

---

## Pre-Deployment Setup

### 1. Install Docker and Docker Compose

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add current user to docker group (optional but recommended)
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### 2. Verify PostgreSQL Connection

```bash
# Test database connectivity from Ubuntu VM
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing

# You should see the PostgreSQL prompt if connection succeeds
# Type \q to exit
```

### 3. Prepare Gmail Service Account Key

```bash
# Create secrets directory
mkdir -p /home/ubuntu/ticketflow/secrets

# Copy your Gmail service account JSON key file
# Replace the path with your actual key file location
cp /path/to/tickets-key.json /home/ubuntu/ticketflow/secrets/tickets-key.json

# Set proper permissions
chmod 600 /home/ubuntu/ticketflow/secrets/tickets-key.json
```

---

## Deployment Steps

### Step 1: Clone/Setup Project Directory

```bash
# Create application directory
mkdir -p /home/ubuntu/ticketflow
cd /home/ubuntu/ticketflow

# If using git (clone your repository)
git clone <your-repository-url> .

# Or copy all application files to this directory
```

### Step 2: Configure Environment Variables

The `.env` file is already configured with your credentials. Verify the following values:

```bash
# View current .env configuration
cat .env
```

**Ensure these values are correct:**

```
DB_HOST=10.20.10.65
DB_PORT=5434
DB_USER=user_ticketing_app
DB_PASSWORD=Ticketing@123
DB_NAME=db_ticketing
GMAIL_USER_EMAIL=tickets@bcits.co
```

### Step 3: Build and Start the Application

```bash
# Navigate to project directory
cd /home/ubuntu/ticketflow

# Build the Docker image
docker-compose build

# Start the application
docker-compose up -d

# View logs
docker-compose logs -f
```

### Step 4: Verify Application is Running

```bash
# Check container status
docker-compose ps

# Test the application
curl http://localhost:8080/api/ping

# Expected response:
# {"message":"pong"}

# Test with full URL
curl http://10.20.10.65:8080/api/ping
```

### Step 5: Access the Application

Open your browser and navigate to:
```
http://10.20.10.65:8080
```

**Admin Login Credentials:**
- **Email**: roshan.ramesh@bcits.in
- **Password**: Ticketing#321!

---

## Post-Deployment Configuration

### 1. Configure Gmail Integration (Optional)

The application is configured to use Gmail for email handling. The service account key should be placed at:
```
/home/ubuntu/ticketflow/secrets/tickets-key.json
```

This is automatically mounted in the Docker container.

### 2. Setup Log Rotation

```bash
# Logs are automatically managed by Docker with JSON driver
# Default retention: 10MB per file, 3 files maximum
# Located at: /home/ubuntu/ticketflow/logs

# To customize, edit docker-compose.yml logging section
```

### 3. Configure SSL/TLS (Recommended for Production)

For HTTPS support, use a reverse proxy like Nginx:

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/ticketflow
```

**Nginx Configuration:**

```nginx
server {
    listen 443 ssl http2;
    server_name 10.20.10.65;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/key.key;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name 10.20.10.65;
    return 301 https://$server_name$request_uri;
}
```

Enable and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/ticketflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## Maintenance and Management

### Starting/Stopping the Application

```bash
# Start application
docker-compose up -d

# Stop application
docker-compose down

# Restart application
docker-compose restart

# Restart specific service
docker-compose restart ticketflow
```

### Viewing Logs

```bash
# View all logs
docker-compose logs

# View only application logs
docker-compose logs ticketflow

# Follow logs (real-time)
docker-compose logs -f ticketflow

# View logs for last 100 lines
docker-compose logs --tail=100 ticketflow
```

### Updating the Application

```bash
# Pull latest code (if using git)
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Verify update
docker-compose logs -f ticketflow
```

### Database Backups

```bash
# Create a backup
pg_dump -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing < backup_20240101_120000.sql
```

### Resource Monitoring

```bash
# Monitor container resource usage
docker stats ticketflow-app

# View container details
docker inspect ticketflow-app

# View container processes
docker top ticketflow-app
```

---

## Troubleshooting

### Issue: Container fails to start

```bash
# Check logs for errors
docker-compose logs ticketflow

# Verify database connectivity
docker-compose logs check-db

# Ensure all environment variables are set correctly
cat .env
```

### Issue: Database connection refused

```bash
# Verify PostgreSQL is accessible
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing

# Check firewall (if applicable)
sudo ufw allow 5434/tcp

# Restart database service (if you have access)
```

### Issue: Port 8080 already in use

```bash
# Find process using port 8080
sudo lsof -i :8080

# Kill the process
sudo kill -9 <PID>

# Or change port in docker-compose.yml
# Change "8080:8080" to "8081:8080"
```

### Issue: Permission denied for secrets directory

```bash
# Ensure proper permissions
chmod 755 /home/ubuntu/ticketflow/secrets
chmod 600 /home/ubuntu/ticketflow/secrets/tickets-key.json

# Verify ownership
ls -la /home/ubuntu/ticketflow/secrets/
```

### Issue: High memory usage

```bash
# Check current limits in docker-compose.yml
# Increase the memory allocation in the deploy.resources.limits section

# Restart container
docker-compose down && docker-compose up -d
```

---

## Security Considerations

### 1. Change Default Credentials

```sql
-- Connect to PostgreSQL
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing

-- Update admin password (use bcrypt hash)
-- This should be done in the application UI
```

### 2. Secure Environment Variables

- Never commit `.env` file with real credentials to git
- Use Docker secrets in production
- Rotate SESSION_SECRET regularly

### 3. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw allow 5434/tcp   # PostgreSQL (if needed)
sudo ufw enable
```

### 4. Monitor Logs Regularly

```bash
# Set up log monitoring
docker-compose logs --tail=100 ticketflow | grep -i "error"
```

### 5. SSL/TLS Certificates

For production, obtain proper SSL certificates:
- Use Let's Encrypt with Certbot
- Install a wildcard certificate
- Auto-renew before expiration

---

## Backup and Disaster Recovery

### Automated Backups

Create a backup script `/home/ubuntu/ticketflow/backup.sh`:

```bash
#!/bin/bash

BACKUP_DIR="/home/ubuntu/ticketflow/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Schedule with cron:

```bash
# Run daily backup at 2 AM
crontab -e

# Add this line:
0 2 * * * /home/ubuntu/ticketflow/backup.sh
```

---

## Monitoring and Alerts

### Health Checks

The container includes a health check that runs every 30 seconds:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' ticketflow-app
```

### System Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Monitor Docker
watch docker ps

# Monitor system resources
htop
```

---

## Performance Optimization

### Database Optimization

```sql
-- Create indexes for common queries
CREATE INDEX idx_tickets_status ON schema_ticket.table_tickets(status);
CREATE INDEX idx_tickets_created_time ON schema_ticket.table_tickets(created_time);
CREATE INDEX idx_kb_category ON schema_kb.table_kb_items(category);
```

### Container Optimization

- Adjust CPU and memory limits in docker-compose.yml
- Use read-only filesystem where possible
- Enable container restart policies

### Application Tuning

- Increase Node.js memory: `NODE_OPTIONS=--max-old-space-size=1024`
- Configure connection pooling in database
- Enable compression for responses

---

## Production Checklist

Before going live in production:

- [ ] Database is backed up
- [ ] SSL/TLS certificates are installed
- [ ] All credentials are secure
- [ ] Firewall is properly configured
- [ ] Monitoring and logging are enabled
- [ ] Backup and recovery procedures are tested
- [ ] Admin password has been changed
- [ ] Session secret is unique and secure
- [ ] Resource limits are appropriate
- [ ] All environment variables are set
- [ ] Gmail integration is tested
- [ ] Application is tested end-to-end
- [ ] Team members have access documentation

---

## Support and Troubleshooting

For issues, check:
1. Application logs: `docker-compose logs ticketflow`
2. Database connectivity: `psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing`
3. Docker status: `docker-compose ps`
4. System resources: `docker stats`

---

## Additional Resources

- Docker Documentation: https://docs.docker.com
- PostgreSQL Documentation: https://www.postgresql.org/docs
- TicketFlow Application Guide: See TICKETING_APP_GUIDE.md
- Application Architecture: See AGENTS.md

---

**Deployment Date**: [DATE]
**Application Version**: 1.0.0
**Last Updated**: 2024
