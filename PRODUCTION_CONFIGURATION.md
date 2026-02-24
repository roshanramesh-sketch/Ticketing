# Production Configuration Guide

## Overview

This guide explains how to configure the TicketFlow ticketing application for production deployment, supporting both IP-based and domain-based URLs, with the flexibility to change IPs in the future.

## Key Configuration Variables

### APP_URL
The `APP_URL` variable is the central configuration for your deployment. It controls:
- CORS allowed origins
- Session cookie domain settings
- HTTPS vs HTTP security settings

**Format**: `protocol://hostname_or_ip:port`

### Examples

**IP-based deployment (current setup)**:
```bash
APP_URL=http://10.20.10.65:8080
```

**Domain-based deployment (production)**:
```bash
APP_URL=https://tickets.bsmartone.com
```

**Localhost development**:
```bash
APP_URL=http://localhost:8080
```

### TRUST_PROXY

Required for proper session cookie handling when behind reverse proxies (nginx, Apache, load balancers).

**Values**: `true` or `false`

- Set to `true` for production deployments
- Set to `true` if behind nginx or any reverse proxy
- Can be `false` for direct access (not recommended for production)

---

## Deployment Scenarios

### Scenario 1: IP-Based Deployment (Current Setup)

**When to use**: Testing, internal access, or when domain is not yet available

**Configuration in `.env` or `docker-compose.yml`**:
```bash
APP_URL=http://10.20.10.65:8080
TRUST_PROXY=true
NODE_ENV=production
```

**Access**: `http://10.20.10.65:8080`

> [!NOTE]
> Replace `10.20.10.65` with your actual server IP. The application will accept any private IP (10.x.x.x, 192.168.x.x, 172.16-31.x.x) automatically.

---

### Scenario 2: Domain-Based Deployment (Production)

**When to use**: Production deployment with a domain name

**Prerequisites**:
1. Domain DNS configured to point to your server IP
2. SSL/TLS certificate installed (Let's Encrypt recommended)
3. Nginx or Apache configured as reverse proxy

**Configuration in `.env` or `docker-compose.yml`**:
```bash
APP_URL=https://tickets.bsmartone.com
TRUST_PROXY=true
NODE_ENV=production
```

**Access**: `https://tickets.bsmartone.com`

---

### Scenario 3: Changing Server IP

**Steps to change from one IP to another**:

1. **Update APP_URL** in either `.env` or `docker-compose.yml`:
   ```bash
   # Old
   APP_URL=http://10.20.10.65:8080
   
   # New
   APP_URL=http://10.20.20.100:8080
   ```

2. **Rebuild and restart** the application:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

3. **No code changes required** - the application automatically adapts to the new IP

> [!TIP]
> The application's CORS configuration automatically accepts any private IP range, so changing IPs within private networks requires only updating the `APP_URL` variable.

---

## SSL/TLS Setup for HTTPS

### Using Nginx as Reverse Proxy

1. **Install Nginx**:
   ```bash
   sudo apt update
   sudo apt install nginx
   ```

2. **Install Certbot for Let's Encrypt**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

3. **Configure Nginx** (`/etc/nginx/sites-available/ticketflow`):
   ```nginx
   server {
       listen 80;
       server_name tickets.bsmartone.com;
       
       # Redirect HTTP to HTTPS
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name tickets.bsmartone.com;
       
       ssl_certificate /etc/letsencrypt/live/tickets.bsmartone.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/tickets.bsmartone.com/privkey.pem;
       
       location / {
           proxy_pass http://localhost:8080;
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

4. **Obtain SSL Certificate**:
   ```bash
   sudo certbot --nginx -d tickets.bsmartone.com
   ```

5. **Update Application Configuration**:
   ```bash
   APP_URL=https://tickets.bsmartone.com
   TRUST_PROXY=true
   ```

6. **Restart Services**:
   ```bash
   sudo systemctl restart nginx
   docker-compose restart
   ```

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `APP_URL` | Full application URL | `http://10.20.10.65:8080` |
| `TRUST_PROXY` | Trust proxy headers | `true` |
| `NODE_ENV` | Environment mode | `production` |
| `DB_HOST` | Database hostname/IP | `10.20.10.65` |
| `DB_PORT` | Database port | `5434` |
| `DB_USER` | Database username | `user_ticketing_app` |
| `DB_PASSWORD` | Database password | `Ticketing@123` |
| `DB_NAME` | Database name | `db_ticketing` |
| `SESSION_SECRET` | Session encryption key | `your-secret-key` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `PORT` | Application port | `8080` | `8080` |
| `HOST` | Bind address | `0.0.0.0` | `0.0.0.0` |
| `SESSION_TIMEOUT` | Session duration (ms) | `86400000` | `86400000` (24h) |
| `LOG_LEVEL` | Logging level | `info` | `info`, `debug`, `error` |

---

## Troubleshooting Authentication Issues

### Issue: "User not authenticated (401)" on Login

**Possible Causes**:
1. Session cookies not being set
2. CORS blocking requests
3. Proxy configuration incorrect

**Solutions**:

1. **Check browser console** for CORS errors
2. **Verify APP_URL matches** your access URL exactly
3. **Check session cookies** in Browser DevTools → Application → Cookies
4. **Enable logging** and check Docker logs:
   ```bash
   docker-compose logs -f ticketflow
   ```

Look for these log messages:
- `[Server] Trust proxy enabled`
- `[Session] Initializing with: ...`
- `[Auth] Login attempt for: ...`
- `[Auth] Session created for user ...`

---

### Issue: Session Lost on Page Refresh

**Possible Causes**:
1. Cookie domain mismatch
2. Secure cookie setting incorrect
3. Proxy headers not forwarded

**Solutions**:

1. **Verify TRUST_PROXY is true**:
   ```bash
   TRUST_PROXY=true
   ```

2. **Check cookie settings** in logs - should see:
   ```
   [Session] Initializing with: { secure: false, sameSite: 'lax', ... }
   ```

3. **For HTTPS deployments**, ensure `APP_URL` uses `https://`:
   ```bash
   APP_URL=https://tickets.bsmartone.com
   ```

---

### Issue: CORS Errors in Browser Console

**Symptoms**: 
- Console shows: `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Solutions**:

1. **Verify APP_URL** matches your browser's address bar URL
2. **Check logs** for CORS blocked messages:
   ```
   [CORS] Blocked origin: http://something.com
   ```

3. **Ensure credentials are included** in frontend (already configured in `AuthContext.tsx`)

---

## Migration Guide: IP to Domain

When migrating from IP-based to domain-based deployment:

### Step 1: DNS Configuration
Point your domain to the server IP:
```
A Record: tickets.bsmartone.com → 10.20.10.65
```

### Step 2: Install SSL Certificate
```bash
sudo certbot --nginx -d tickets.bsmartone.com
```

### Step 3: Update Environment
Edit `docker-compose.yml` or `.env`:
```bash
# From:
APP_URL=http://10.20.10.65:8080

# To:
APP_URL=https://tickets.bsmartone.com
```

### Step 4: Rebuild Application
```bash
docker-compose down
docker-compose up -d --build
```

### Step 5: Verify
1. Access `https://tickets.bsmartone.com`
2. Login with credentials
3. Check that session persists on page refresh

---

## Security Best Practices

> [!CAUTION]
> **Production Security Checklist**

- [ ] Use HTTPS with valid SSL certificate
- [ ] Change `SESSION_SECRET` to a strong random value
- [ ] Use strong database passwords
- [ ] Enable firewall (ufw) and allow only necessary ports
- [ ] Keep server and Docker updated
- [ ] Implement regular backups
- [ ] Monitor application logs
- [ ] Consider using PostgreSQL role-based access control

---

## Quick Reference Commands

### View Current Configuration
```bash
docker exec ticketflow-app sh -c 'echo $APP_URL'
docker exec ticketflow-app sh -c 'echo $TRUST_PROXY'
```

### Check Application Logs
```bash
docker-compose logs -f ticketflow | grep -E '\[Auth\]|\[Session\]|\[CORS\]'
```

### Restart After Configuration Change
```bash
docker-compose restart ticketflow
```

### Rebuild After Major Changes
```bash
docker-compose down
docker-compose up -d --build
```

### Test API Endpoint
```bash
curl -v http://10.20.10.65:8080/api/ping
```

---

## Support

For issues not covered in this guide:
1. Check application logs: `docker-compose logs -f`
2. Review browser console for JavaScript errors
3. Verify environment variables are set correctly
4. Ensure database is accessible from the application container
