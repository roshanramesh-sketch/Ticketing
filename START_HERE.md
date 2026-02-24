# ⚡ START HERE - TicketFlow Deployment Guide

## 🎯 Your Current Situation

✅ **Location**: `/application/ticketing_hub`  
✅ **Docker**: 29.1.3 (aarch64 ARM64)  
✅ **Docker Compose**: v5.0.0  
✅ **Database**: PostgreSQL 18 running at 10.20.10.65:5434  
✅ **All Code**: Ready in `/application/ticketing_hub`  
✅ **All Config**: Ready and updated for your environment

**Status**: Ready to deploy! Just follow the steps below.

---

## 📋 What You'll Get After Deployment

✅ **Web Application** running on http://10.20.10.65:8080  
✅ **Admin Dashboard** with 4 sample tickets  
✅ **Knowledge Base** with 4 sample articles  
✅ **Admin Panel** for user management  
✅ **4 Sample Users** for testing  
✅ **Activity Logs** for auditing  

---

## ⏱️ Deployment Time: ~15-20 minutes

| Step | Action | Time |
|------|--------|------|
| 1 | Initialize Database | 2 min |
| 2 | Create Directories | 1 min |
| 3 | Build Docker Image | 5-10 min |
| 4 | Start Containers | 2 min |
| 5 | Verify Running | 2 min |
| 6 | Test Access | 1 min |

---

## 🚀 Let's Deploy! (6 Simple Steps)

### **Step 1: Initialize the Database** ⚙️

Run this command to add the admin user and sample data:

```bash
cd /application/ticketing_hub

PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing -f init-db.sql
```

**What this does:**
- ✅ Adds admin user: roshan.ramesh@bcits.in
- ✅ Adds 3 sample users for testing
- ✅ Creates 3 ticket categories
- ✅ Adds 4 sample tickets
- ✅ Adds 4 knowledge base articles
- ✅ Logs sample activity

**Expected output:**
```
INSERT 0 1
...
(Shows multiple INSERT statements)
...
 total_users | total_tickets | total_kb_articles | total_activity_logs
-------------+---------------+-------------------+---------------------
           4 |             4 |                 4 |                   2
(1 row)
```

✅ If you see this, move to Step 2

---

### **Step 2: Create Secrets Directory** 📁

```bash
mkdir -p /application/ticketing_hub/secrets
chmod 700 /application/ticketing_hub/secrets
```

*Optional: If you have Gmail service account key:*
```bash
cp /path/to/tickets-key.json /application/ticketing_hub/secrets/tickets-key.json
chmod 600 /application/ticketing_hub/secrets/tickets-key.json
```

---

### **Step 3: Build the Docker Image** 🐳

This creates a Docker container image. It takes 5-10 minutes on aarch64.

```bash
cd /application/ticketing_hub

docker compose build --no-cache
```

**What you'll see:**
- Building Node.js base image
- Installing dependencies
- Compiling React frontend
- Building production bundle
- Creating final image

**Expected final output:**
```
=> => naming to docker.io/library/ticketing_hub-ticketflow:latest
```

✅ When you see this, move to Step 4

---

### **Step 4: Start the Application** ▶️

```bash
cd /application/ticketing_hub

docker compose up -d
```

**Expected output:**
```
Creating ticketflow-app ... done
```

**What this does:**
- Creates Docker network
- Starts the application container
- Application listens on port 8080

---

### **Step 5: Verify It's Running** ✅

Check container status:

```bash
docker compose ps
```

**Expected output:**
```
NAME                  IMAGE                              STATUS
ticketflow-app        ticketing_hub-ticketflow:latest    Up (healthy)
```

**Key things to verify:**
- ✅ Status shows "Up (healthy)"
- ✅ Container is running
- ✅ Port 8080 is mapped

If something goes wrong, check logs:
```bash
docker compose logs ticketflow
```

---

### **Step 6: Access the Application** 🌐

Open your browser and go to:

```
http://10.20.10.65:8080
```

You should see the **TicketFlow Login Page**

**Login with:**
- Email: `roshan.ramesh@bcits.in`
- Password: `Ticketing#321!`

---

## ✨ After You Login - What to Test

Once logged in, you should see:

1. **Dashboard**
   - Total Tickets: 4
   - Open Tickets: 4
   - Archived: 1
   - Charts with sample data

2. **Tickets Page**
   - 4 sample tickets visible
   - Different statuses and priorities
   - Can create new tickets

3. **Knowledge Base**
   - 4 sample articles
   - Organized by categories
   - Can search and filter

4. **Admin Panel** (for admin users)
   - 4 users listed
   - Can manage roles
   - Activity logs visible

5. **Settings**
   - View your profile
   - Change password option

---

## 🆘 If Something Goes Wrong

### Issue: Container won't start

**Check:**
```bash
docker compose logs ticketflow
```

**Common causes:**
- Database not accessible
- Port 8080 in use
- Environment variables wrong

**Solutions:**
```bash
# Test database
PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing -c "SELECT 1"

# Check port
sudo lsof -i :8080

# Stop and restart
docker compose down
docker compose up -d
```

### Issue: Cannot access http://10.20.10.65:8080

**Check:**
```bash
# Verify container is running
docker compose ps

# Test API endpoint
curl http://localhost:8080/api/ping
# Should return: {"message":"pong"}

# Check logs
docker compose logs
```

### Issue: Login fails

**Check:**
```bash
# Verify admin user exists
PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing -c "SELECT * FROM schema_auth.table_users WHERE email='roshan.ramesh@bcits.in'"

# Verify app can connect to DB
docker compose logs | grep -i database
```

---

## 📊 Verify Database Data

See what was added:

```bash
# Connect to database
PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing

# View users
SELECT id, firstname, lastname, email, role FROM schema_auth.table_users;

# View tickets
SELECT id, subject, status FROM schema_ticket.table_tickets;

# View KB articles
SELECT id, title, category FROM schema_kb.table_kb_items;

# Exit
\q
```

---

## 🎛️ Daily Operations Commands

**Start application:**
```bash
cd /application/ticketing_hub
docker compose up -d
```

**Stop application:**
```bash
docker compose down
```

**View logs:**
```bash
docker compose logs -f
# Press Ctrl+C to exit
```

**Restart application:**
```bash
docker compose restart
```

**Check status:**
```bash
docker compose ps
docker stats ticketflow-app
```

**Backup database:**
```bash
PGPASSWORD='Ticketing@123' pg_dump -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 📚 Documentation Available

For more detailed information:

- **NEXT_STEPS_DEPLOYMENT.md** - Complete deployment guide with troubleshooting
- **DEPLOYMENT_COMMANDS.sh** - All commands in a shell script
- **QUICK_COMMANDS.md** - Quick reference for all commands
- **BUILD_AND_DEPLOY.md** - Comprehensive guide
- **DEPLOYMENT_GUIDE.md** - Production setup
- **TICKETING_APP_GUIDE.md** - Application features

---

## 🔐 Security Reminders

After successful deployment:

1. **Change SESSION_SECRET** in `.env`
2. **Setup firewall** with UFW
3. **Setup SSL/TLS** for HTTPS (see NEXT_STEPS_DEPLOYMENT.md)
4. **Create database backups** regularly
5. **Change default passwords** if needed

---

## ✅ Success Checklist

After completing all 6 steps, you should have:

- [ ] Database initialized with sample data
- [ ] Docker image built successfully
- [ ] Application container running
- [ ] Can access http://10.20.10.65:8080
- [ ] Can login with admin credentials
- [ ] Dashboard shows 4 tickets
- [ ] Knowledge Base shows 4 articles
- [ ] Admin panel is accessible
- [ ] No errors in logs

---

## 🎉 What's Next?

1. **Immediate**: Complete the 6 steps above
2. **After deployment**: Test all features
3. **Optional**: Setup SSL/TLS for HTTPS
4. **Optional**: Setup automated backups
5. **Optional**: Configure firewall rules

---

## 📞 Need Help?

**Check these first:**

1. **Logs**: `docker compose logs`
2. **Status**: `docker compose ps`
3. **Database**: `PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing -c "SELECT 1"`
4. **API**: `curl http://localhost:8080/api/ping`

**Then check:**
- NEXT_STEPS_DEPLOYMENT.md - Troubleshooting section
- QUICK_COMMANDS.md - Command reference

---

## 🚀 Ready to Deploy?

### Run Step 1 Now:

```bash
cd /application/ticketing_hub

PGPASSWORD='Ticketing@123' psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing -f init-db.sql
```

Then follow the remaining 5 steps above!

---

**Current Location**: `/application/ticketing_hub`  
**Status**: ✅ All systems ready - Deploy now!  
**Estimated Time**: ~15-20 minutes  
**Difficulty**: Easy - Just follow the 6 steps

Good luck! You're almost there! 🎯
