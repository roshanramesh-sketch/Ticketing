# TicketFlow - Next Steps for Deployment

## ✅ Current Status

You are at `/application/ticketing_hub` with:
- ✅ Docker 29.1.3 installed (aarch64 compatible)
- ✅ Docker Compose v5.0.0 installed
- ✅ PostgreSQL 18 running on 10.20.10.65:5434
- ✅ All database schemas and tables created
- ✅ All application files ready
- ✅ Configuration files ready

---

## 🚀 Deployment Steps (Follow in Order)

### Step 1: Initialize Database with Sample Data (5 minutes)

This step adds the admin user and sample data for testing.

```bash
# Navigate to application directory
cd /application/ticketing_hub

# Connect to PostgreSQL and run initialization script
PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing -f init-db.sql
```

**Expected Output:**
```
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
INSERT 0 1
 total_users | total_tickets | total_kb_articles | total_activity_logs
-------------+---------------+-------------------+---------------------
           4 |             4 |                 4 |                   2
(1 row)
```

### Step 2: Create Secrets Directory (2 minutes)

```bash
# Create secrets directory
mkdir -p /application/ticketing_hub/secrets
chmod 700 /application/ticketing_hub/secrets

# If you have Gmail service account key, copy it
# cp /path/to/tickets-key.json /application/ticketing_hub/secrets/tickets-key.json
# chmod 600 /application/ticketing_hub/secrets/tickets-key.json
```

### Step 3: Build Docker Image (5-10 minutes)

On aarch64, the build may take longer due to multi-stage compilation.

```bash
cd /application/ticketing_hub

# Build the Docker image
docker compose build --no-cache

# Expected output will show build progress ending with:
# => => naming to docker.io/library/ticketing_hub-ticketflow:latest
```

**Time Estimate:** 5-10 minutes (depending on system)

### Step 4: Start the Application (3 minutes)

```bash
cd /application/ticketing_hub

# Start all services
docker compose up -d

# Verify containers are running
docker compose ps

# Expected output:
# NAME                  IMAGE                              STATUS
# ticketflow-app        ticketing_hub-ticketflow:latest    Up (healthy)
```

### Step 5: Verify Application is Running (2 minutes)

```bash
# Test the API endpoint
curl http://localhost:8080/api/ping

# Expected response:
# {"message":"pong"}

# Check application logs
docker compose logs ticketflow

# Should show no errors and application ready
```

### Step 6: Access the Application (1 minute)

Open your browser and navigate to:
```
http://10.20.10.65:8080
```

**Login with admin credentials:**
- Email: `roshan.ramesh@bcits.in`
- Password: `Ticketing#321!`

---

## ✨ Verify All Features Work

Once logged in, test these features:

- [ ] **Dashboard** - Should show 4 tickets and stats
- [ ] **Tickets** - Should list all sample tickets
- [ ] **Knowledge Base** - Should show 4 KB articles
- [ ] **Create New Ticket** - Create a test ticket
- [ ] **Admin Panel** - Should show 4 users and activity logs
- [ ] **Settings** - Should display your profile

---

## 📊 Database Verification

Verify the sample data was added:

```bash
# Connect to database
PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing

# View users
SELECT id, firstname, lastname, email, role FROM schema_auth.table_users;

# View tickets
SELECT id, subject, status, priority FROM schema_ticket.table_tickets;

# View KB articles
SELECT id, title, category FROM schema_kb.table_kb_items;

# Exit
\q
```

---

## 🔍 Troubleshooting

### Issue: Docker build fails on aarch64

**Error:** `failed to solve with frontend dockerfile.v0`

**Solution:**
```bash
# Ensure DOCKER_BUILDKIT is enabled
export DOCKER_BUILDKIT=1
docker compose build --no-cache
```

### Issue: Container exits immediately

**Check logs:**
```bash
docker compose logs ticketflow
```

**Common causes:**
- Database connection refused → Verify PostgreSQL is running
- Port 8080 in use → Check `sudo lsof -i :8080`
- Environment variables missing → Check `.env` file

### Issue: Cannot connect to database

**Test connection:**
```bash
PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing -c "SELECT 1"
```

**If fails:**
- Verify PostgreSQL is running: `ps aux | grep postgres`
- Check PostgreSQL is listening: `netstat -tlnp | grep 5434`
- Verify firewall allows connection: `sudo ufw allow 5434/tcp`

### Issue: Health check failing

**Container shows as `Unhealthy`:**
```bash
# Check health status
docker compose ps

# View detailed logs
docker inspect ticketflow-app | grep -A 10 "Health"

# Manually test endpoint
curl -v http://localhost:8080/api/ping

# If curl not available, install it
sudo apt install -y curl
```

---

## 📝 Daily Operations

### Start Application
```bash
cd /application/ticketing_hub
docker compose up -d
```

### Stop Application
```bash
cd /application/ticketing_hub
docker compose down
```

### View Logs
```bash
docker compose logs -f ticketflow
# Press Ctrl+C to exit
```

### Restart Application
```bash
docker compose restart
```

### Check Status
```bash
docker compose ps
docker stats ticketflow-app
```

---

## 🔒 Security Setup (Recommended)

### 1. Change Session Secret

Edit `.env` and update:
```
SESSION_SECRET=YourNewSecureRandomSecretHere123456789
```

Restart the application:
```bash
docker compose restart
```

### 2. Setup Firewall

```bash
# Enable UFW
sudo ufw --force enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS
sudo ufw allow 443/tcp

# Block direct PostgreSQL access (if not needed)
sudo ufw deny 5434/tcp

# View rules
sudo ufw status
```

### 3. Setup SSL/TLS (Optional but Recommended)

Install Nginx as reverse proxy:

```bash
# Install Nginx
sudo apt install -y nginx

# Create config file
sudo nano /etc/nginx/sites-available/ticketflow
```

**Add this configuration:**

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

    # Generate self-signed certificate (for testing):
    # sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    #   -keyout /etc/ssl/private/ticketflow.key \
    #   -out /etc/ssl/certs/ticketflow.crt

    ssl_certificate /etc/ssl/certs/ticketflow.crt;
    ssl_certificate_key /etc/ssl/private/ticketflow.key;

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

Enable and start:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ticketflow /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Verify
sudo systemctl status nginx
```

---

## 🔄 Update Application

To update to new version:

```bash
cd /application/ticketing_hub

# Pull latest code (if using git)
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Verify
docker compose logs -f
```

---

## 📦 Backup and Recovery

### Create Database Backup

```bash
# Backup database
PGPASSWORD='Ticketing@123' pg_dump -h 10.20.10.65 -p 5434 \
  -U user_ticketing_app -d db_ticketing > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
PGPASSWORD='Ticketing@123' pg_dump -h 10.20.10.65 -p 5434 \
  -U user_ticketing_app -d db_ticketing | gzip > backup_$(date +%Y%m%d_%H%M%S).sql.gz
```

### Restore from Backup

```bash
PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 \
  -U user_ticketing_app -d db_ticketing < backup_20240101_120000.sql
```

### Automated Daily Backups

Create backup script: `/application/ticketing_hub/backup.sh`

```bash
#!/bin/bash
BACKUP_DIR="/application/ticketing_hub/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Create backup
PGPASSWORD='Ticketing@123' pg_dump -h 10.20.10.65 -p 5434 \
  -U user_ticketing_app -d db_ticketing | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/db_backup_$DATE.sql.gz"
```

Make executable and add to crontab:

```bash
chmod +x /application/ticketing_hub/backup.sh

# Edit crontab
sudo crontab -e

# Add line for 2 AM daily backup:
0 2 * * * /application/ticketing_hub/backup.sh
```

---

## 📋 Complete Checklist

### Pre-Deployment
- [x] Docker 29.1.3 installed
- [x] Docker Compose v5.0.0 installed
- [x] PostgreSQL 18 running
- [x] Database schemas created
- [x] All files in `/application/ticketing_hub`

### Deployment
- [ ] Step 1: Initialize database with `init-db.sql`
- [ ] Step 2: Create secrets directory
- [ ] Step 3: Build Docker image
- [ ] Step 4: Start containers
- [ ] Step 5: Verify application running
- [ ] Step 6: Access and test login

### Post-Deployment
- [ ] Test all features (Dashboard, Tickets, KB, Admin)
- [ ] Verify sample data in database
- [ ] Change SESSION_SECRET in `.env`
- [ ] Setup firewall rules
- [ ] Setup SSL/TLS (optional)
- [ ] Create automated backups
- [ ] Document any customizations

---

## 🎯 Quick Command Reference

```bash
# Build
docker compose build --no-cache

# Start
docker compose up -d

# Stop
docker compose down

# Logs
docker compose logs -f

# Restart
docker compose restart

# Status
docker compose ps

# Test API
curl http://localhost:8080/api/ping

# Database backup
PGPASSWORD='Ticketing@123' pg_dump -h 10.20.10.65 -p 5434 \
  -U user_ticketing_app -d db_ticketing > backup.sql

# Database restore
PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 \
  -U user_ticketing_app -d db_ticketing < backup.sql
```

---

## 📞 Support

### Check Logs
```bash
docker compose logs -f
```

### Test Database
```bash
PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 \
  -U user_ticketing_app -d db_ticketing -c "SELECT 1"
```

### Test API
```bash
curl -v http://localhost:8080/api/ping
```

### Docker Info
```bash
docker info
docker compose version
docker images
docker ps
```

---

## 🌐 Access Information

Once deployed:

| Item | Value |
|------|-------|
| **Application URL** | http://10.20.10.65:8080 |
| **Admin Email** | roshan.ramesh@bcits.in |
| **Admin Password** | Ticketing#321! |
| **Database Host** | 10.20.10.65 |
| **Database Port** | 5434 |
| **Database User** | user_ticketing_app |
| **Database Password** | Ticketing@123 |
| **Database Name** | db_ticketing |

---

## ⏱️ Deployment Timeline

| Step | Duration | Status |
|------|----------|--------|
| Initialize DB | 2 min | |
| Create directories | 1 min | |
| Build Docker image | 5-10 min | |
| Start containers | 2 min | |
| Verify running | 2 min | |
| Test access | 1 min | |
| **TOTAL** | **~15-20 min** | |

---

## 🎉 Success Criteria

You'll know deployment is successful when:

1. ✅ Docker containers are running: `docker compose ps` shows all green
2. ✅ API responds: `curl http://localhost:8080/api/ping` returns `{"message":"pong"}`
3. ✅ Browser access: Can open http://10.20.10.65:8080
4. ✅ Login works: Can login with admin credentials
5. ✅ Dashboard loads: Shows 4 tickets and statistics
6. ✅ Tickets visible: See all sample tickets
7. ✅ KB articles visible: See 4 knowledge base articles
8. ✅ Admin panel works: Can access user management
9. ✅ No errors: `docker compose logs` shows no error messages

---

## 📚 Documentation Files

- **BUILD_AND_DEPLOY.md** - Comprehensive deployment guide
- **DEPLOYMENT_GUIDE.md** - Production setup and maintenance
- **QUICK_COMMANDS.md** - Command quick reference
- **TICKETING_APP_GUIDE.md** - Application features
- **DEPLOYMENT_READY.md** - Overview and checklist

---

**Ready to Deploy?** 

Run **Step 1** above to initialize the database, then follow each step in order.

**Current Directory**: `/application/ticketing_hub`  
**Status**: All systems ready! ✅

Good luck with your deployment! 🚀
