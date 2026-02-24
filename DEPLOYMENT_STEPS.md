# Deployment Guide - Next Steps

## Summary of Fixes Applied

All authentication and production-readiness issues have been fixed:

✅ **Session Configuration**: Fixed proxy trust and cookie settings
✅ **CORS Configuration**: Dynamic support for both IPs and domains  
✅ **Environment Variables**: Added `APP_URL` and `TRUST_PROXY` for flexible deployment
✅ **Logging**: Comprehensive authentication and session logging for debugging
✅ **Production Ready**: Supports changing IPs and future domain migration

---

## Deployment Steps

### Prerequisites

- **SSH Access**: `ticket_os_user@10.20.10.65` (password: `Bcits@123`)
- **VPN Connection**: Connected to VPN for accessing 10.20.10.65
- **Application Path**: `/application/ticketing_hub` on the VM

### Step 1: Transfer Updated Files to VM

From your Windows laptop, use SCP or WinSCP to transfer the updated files:

**Files to transfer**:
- `.env`
- `.env.production`
- `server/index.ts`
- `server/routes/auth.ts`
- `docker-compose.yml`
- `PRODUCTION_CONFIGURATION.md` (new)

**Using SCP** (from PowerShell or WSL):
```powershell
scp .env ticket_os_user@10.20.10.65:/application/ticketing_hub/
scp .env.production ticket_os_user@10.20.10.65:/application/ticketing_hub/
scp server/index.ts ticket_os_user@10.20.10.65:/application/ticketing_hub/server/
scp server/routes/auth.ts ticket_os_user@10.20.10.65:/application/ticketing_hub/server/routes/
scp docker-compose.yml ticket_os_user@10.20.10.65:/application/ticketing_hub/
scp PRODUCTION_CONFIGURATION.md ticket_os_user@10.20.10.65:/application/ticketing_hub/
```

**Alternative**: Use WinSCP GUI to transfer files.

---

### Step 2: SSH into the VM

```bash
ssh ticket_os_user@10.20.10.65
# Password: Bcits@123
```

---

### Step 3: Navigate to Application Directory

```bash
cd /application/ticketing_hub
```

---

### Step 4: Verify Files are Updated

```bash
# Check that APP_URL is present in .env
grep APP_URL .env

# Check docker-compose.yml
grep APP_URL docker-compose.yml
```

Expected output should show:
```
APP_URL=http://10.20.10.65:8080
```

---

### Step 5: Stop Current Application

```bash
sudo docker-compose down
```

---

### Step 6: Rebuild Application

This step rebuilds the Docker image with the updated code:

```bash
sudo docker-compose up -d --build
```

**Expected output**:
- Building ticketflow image
- Downloading dependencies
- Building client and server
- Starting container

**Build time**: ~5-10 minutes

---

### Step 7: Monitor Logs for Startup

```bash
sudo docker-compose logs -f ticketflow
```

**Look for these key log messages**:
- `[Database] Successfully connected to PostgreSQL`
- `[Server] Trust proxy enabled`
- `[Session] Initializing with: ...`
- `🚀 Fusion Starter server running on port 8080`

Press `Ctrl+C` to stop viewing logs.

---

### Step 8: Verify Container is Running

```bash
sudo docker-compose ps
```

Expected output:
```
NAME                IMAGE              STATUS
ticketflow-app      ticketflow         Up (healthy)
```

---

### Step 9: Test API Health

```bash
curl http://localhost:8080/api/ping
```

Expected output:
```json
{"message":"pong"}
```

---

### Step 10: Test from Your Laptop Browser

Open your browser and navigate to:
```
http://10.20.10.65:8080/login
```

**Test Login**:
1. Open Browser DevTools (F12)
2. Go to Network tab
3. Enter credentials:
   - Email: `demo@example.com`
   - Password: `password123`
   
   OR use admin credentials from README:
   - Email: `roshan.ramesh@bcits.in`
   - Password: `Ticketing#321!`

4. Click "Sign In"

**Expected Results**:
- POST to `/api/auth/login` returns **200 OK**
- Response includes user data (not an error)
- Browser redirects to dashboard
- No 401 error in console

---

### Step 11: Verify Session Persistence

After successful login:
1. Refresh the page (F5)
2. You should remain logged in
3. No redirect to login page

---

### Step 12: Check Application Logs for Authentication

Back in SSH terminal:

```bash
sudo docker-compose logs -f ticketflow | grep '\[Auth\]'
```

You should see logs like:
```
[Auth] Login attempt for: demo@example.com
[Auth] Session created for user 1 (demo@example.com)
[Auth] Session ID: xxxxx
[Auth] Session saved successfully for user 1
[Auth] Auth check - Session ID: xxxxx
[Auth] User authenticated: demo@example.com (ID: 1)
```

---

## Verification Database (Optional)

To verify users exist in the database:

```bash
# Switch to postgres user
sudo su - postgres

# Connect to database
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing
# Password: Ticketing@123

# Check users
SELECT id, email, role FROM schema_auth.table_users;

# Exit
\q
exit
```

---

## Troubleshooting

### Issue: Still getting 401 error

**Check logs**:
```bash
sudo docker-compose logs -f ticketflow
```

Look for:
- `[CORS] Blocked origin: ...` - if present, check APP_URL matches browser URL
- `[Auth] Not authenticated` - session not being created
- Database connection errors

**Solution**: Rebuild with `--no-cache`:
```bash
sudo docker-compose down
sudo docker-compose build --no-cache
sudo docker-compose up -d
```

---

### Issue: Container won't start

**Check status**:
```bash
sudo docker-compose ps
sudo docker-compose logs ticketflow
```

Common causes:
- Port 8080 already in use
- Database not accessible
- Build errors

---

### Issue: Can't connect to database

**Test database connectivity**:
```bash
# From the container
sudo docker exec -it ticketflow-app sh -c "PGPASSWORD=Ticketing@123 psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing -c 'SELECT 1;'"
```

---

## Next Steps After Successful Deployment

1. **Test all features**:
   - Login/Logout
   - Dashboard
   - Creating tickets
   - Knowledge base
   - Admin panel (if admin user)

2. **Review production configuration guide**:
   - Read `PRODUCTION_CONFIGURATION.md`
   - Plan for domain migration if needed
   - Consider SSL/TLS setup

3. **Monitor logs** for a few days:
   ```bash
   sudo docker-compose logs -f
   ```

4. **Set up backups** (see DEPLOYMENT_GUIDE.md)

5. **Consider firewall configuration**:
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 8080/tcp
   sudo ufw enable
   ```

---

## Quick Commands Reference

### View logs
```bash
sudo docker-compose logs -f ticketflow
```

### Restart application
```bash
sudo docker-compose restart ticketflow
```

### Stop application
```bash
sudo docker-compose down
```

### Start application
```bash
sudo docker-compose up -d
```

### Check status
```bash
sudo docker-compose ps
```

### Rebuild after code changes
```bash
sudo docker-compose up -d --build
```

---

## Success Criteria

✅ Application starts without errors
✅ API /ping endpoint responds with "pong"
✅ Login page loads at http://10.20.10.65:8080/login
✅ Login succeeds (200 response, no 401 error)
✅ Session persists on page refresh
✅ User can navigate to dashboard and other pages
✅ No CORS errors in browser console
✅ Logs show authentication success messages

---

## Support

For detailed configuration options, see:
- `PRODUCTION_CONFIGURATION.md` - Production setup guide
- `DEPLOYMENT_GUIDE.md` - Full deployment reference
- `QUICK_COMMANDS.md` - Command reference

For authentication issues specifically, review:
- `PRODUCTION_CONFIGURATION.md` → "Troubleshooting Authentication Issues" section
