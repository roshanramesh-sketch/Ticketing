# Ticketing App - Feature Testing Guide

## Quick Access URLs

- **Application**: http://10.20.10.65:8080
- **Login Page**: http://10.20.10.65:8080/login
- **API Health**: http://10.20.10.65:8080/api/ping
- **Session Debug**: http://10.20.10.65:8080/debug/session

---

## Test User Credentials

From your database (schema_auth.table_users):

| Email | Password | Role | Use For |
|-------|----------|------|---------|
| roshan.ramesh@bcits.in | Ticketing#321! | Admin | Admin features |
| demo@example.com | password123 | User | Basic user features |

**Note**: Verify actual users in your database:
```sql
SELECT id, email, role FROM schema_auth.table_users;
```

---

## Core Features to Test

### 1. Authentication & Sessions

#### Test Login
1. Go to http://10.20.10.65:8080/login
2. Enter credentials
3. Click "Sign In"

**Expected**:
- Redirect to dashboard
- No 401 errors
- Session cookie set

#### Test Session Persistence
1. After login, refresh page (F5)
2. Navigate to different pages

**Expected**:
- Stay logged in
- No redirect to login

#### Debug Session (New!)
Visit: http://10.20.10.65:8080/debug/session

**Shows**:
```json
{
  "sessionID": "xxxxx",
  "session": { "userId": 1 },
  "cookies": "connect.sid=...",
  "isAuthenticated": true
}
```

#### Test Logout
1. Click logout (if available in UI)
2. Visit http://10.20.10.65:8080

**Expected**:
- Redirect to login
- Session cleared

---

### 2. Dashboard

**URL**: http://10.20.10.65:8080/ (after login)

#### Check Statistics Display
- Total tickets count
- Open tickets
- In progress tickets
- Resolved tickets
- Charts/visualizations

#### Check Recent Activity
- Recent tickets list
- Latest updates
- Activity feed

**Expected**:
- All widgets load without errors
- Data displays correctly
- No "loading" stuck states

---

### 3. Ticket Management

**URL**: http://10.20.10.65:8080/tickets (or similar)

#### Create New Ticket
1. Click "New Ticket" or "Create Ticket"
2. Fill in:
   - Subject
   - Description/Content
   - Priority (Low/Medium/High)
   - Category/Bin
3. Submit

**Expected**:
- Ticket created successfully
- Appears in tickets list
- Shows in database: `SELECT * FROM schema_ticket.table_tickets ORDER BY id DESC LIMIT 5;`

#### View Ticket Details
1. Click on a ticket from the list
2. View full details

**Expected**:
- Shows all ticket information
- Subject, content, status, priority
- Created/updated timestamps
- Assigned user (if any)

#### Update Ticket
1. Open a ticket
2. Modify:
   - Status (Open → In Progress → Resolved)
   - Priority
   - Assignee
   - Add comments/messages
3. Save changes

**Expected**:
- Changes saved
- Updated timestamp changes
- Shows in ticket history

#### Filter/Search Tickets
1. Use filters:
   - By status
   - By priority
   - By assignee
   - By bin/category
2. Use search box

**Expected**:
- Results update dynamically
- Correct tickets shown
- No errors in console

#### Archive Ticket
1. Select a resolved ticket
2. Click "Archive"

**Expected**:
- Ticket archived
- `archived_time` set in database
- Removed from active list

---

### 4. Ticket Bins/Categories

**Test Bin Management** (if admin):

1. View available bins:
   - General
   - HES
   - MDM
   - WFM
   - SLA
   - Cloud
   - DB
   - Organization

2. Assign tickets to bins
3. Filter by bin

**Expected**:
- Bins display correctly
- Tickets properly categorized
- Database shows: `SELECT * FROM schema_ticket.table_ticket_bins;`

---

### 5. Knowledge Base

**URL**: http://10.20.10.65:8080/knowledge-base (or /kb)

#### Create KB Article
1. Click "New Article"
2. Fill in:
   - Title
   - Content
   - Category
   - Optional: Link to source ticket
3. Save

**Expected**:
- Article created
- Shows in KB list
- Database: `SELECT * FROM schema_kb.table_kb_items ORDER BY id DESC LIMIT 5;`

#### View KB Article
1. Click on article
2. Read content

**Expected**:
- Content displays correctly
- Author shown
- Created date shown
- Linked ticket shown (if any)

#### Search KB
1. Use search functionality
2. Search by keyword

**Expected**:
- Relevant articles found
- Search highlights keywords

#### Link KB to Ticket
1. When creating/editing ticket
2. Link to relevant KB article

**Expected**:
- Link saved
- Visible from ticket view

---

### 6. Admin Panel

**URL**: http://10.20.10.65:8080/admin

**Note**: Only accessible with admin role

#### User Management
1. View all users
2. Check user list from database:
   ```sql
   SELECT * FROM schema_auth.table_users;
   ```

**Expected**:
- All users displayed
- Shows email, role

#### Update User Role
1. Select a user
2. Change role (User → Support → Manager → Admin)
3. Save

**Expected**:
- Role updated
- Database reflects change

#### View Activity Logs
1. Check activity logs section
2. View recent actions

**Expected**:
- Shows user activities
- Database: `SELECT * FROM schema_system.table_activity_logs ORDER BY id DESC LIMIT 10;`

#### User Statistics
1. View user stats dashboard
2. Check metrics per user

**Expected**:
- Shows tickets per user
- Activity counts
- Performance metrics

---

### 7. Settings

**URL**: http://10.20.10.65:8080/settings

#### View Profile
1. Check current user profile
2. View user details

**Expected**:
- Shows firstname, lastname, email, role
- Profile data correct

#### Change Password
1. Enter current password
2. Enter new password
3. Confirm new password
4. Submit

**Expected**:
- Password changed
- Success message
- Can login with new password

#### Theme Settings
1. Switch themes:
   - Light
   - Dark
   - Corporate
   - Ghibli
2. Apply theme

**Expected**:
- Theme changes immediately
- Preference saved
- Persists on refresh

---

### 8. Email Integration (Optional)

**If configured** in `schema_system.table_email_configs`:

#### Check Email Config
```sql
SELECT * FROM schema_system.table_email_configs;
```

#### Test Email Polling
- Check if emails create tickets automatically
- Verify auto-replies sent

**Expected** (if working):
- Emails converted to tickets
- Shows in `schema_ticket.table_ticket_messages`

---

## Database Verification Commands

SSH to VM and run:

```bash
sudo su - postgres
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing
```

### Check Data:

```sql
-- Users
SELECT id, email, role FROM schema_auth.table_users;

-- Recent tickets
SELECT id, subject, status, priority, created_time 
FROM schema_ticket.table_tickets 
ORDER BY id DESC LIMIT 10;

-- Ticket messages
SELECT id, ticket_id, sender_email, LEFT(message_body, 50) as message
FROM schema_ticket.table_ticket_messages
ORDER BY id DESC LIMIT 10;

-- KB items
SELECT id, title, category, author_id, created_time
FROM schema_kb.table_kb_items
ORDER BY id DESC LIMIT 10;

-- Bins
SELECT * FROM schema_ticket.table_ticket_bins;

-- Activity logs
SELECT id, user_id, action, timestamp
FROM schema_system.table_activity_logs
ORDER BY id DESC LIMIT 20;

-- Sessions (if PostgreSQL sessions implemented)
SELECT sid, expire FROM schema_system.session;
```

---

## Common Issues & Solutions

### Issue: Features Not Loading

**Check**:
1. Browser console for errors (F12)
2. Network tab for failed API calls
3. Docker logs: `sudo docker-compose logs -f ticketflow`

### Issue: Database Connection Errors

**Test connection**:
```bash
sudo docker exec -it ticketflow-app sh -c "PGPASSWORD=Ticketing@123 psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing -c 'SELECT 1;'"
```

### Issue: CORS Errors

**Check** APP_URL matches browser URL:
```bash
grep APP_URL /application/ticketing_hub/.env
```

---

## Success Criteria Checklist

- [ ] Login works for all users
- [ ] Dashboard displays statistics
- [ ] Can create tickets
- [ ] Can view ticket details
- [ ] Can update ticket status
- [ ] Can filter/search tickets
- [ ] Can archive tickets
- [ ] Bins/categories work
- [ ] Can create KB articles
- [ ] Can view KB articles
- [ ] Can search KB
- [ ] Admin can view users (admin only)
- [ ] Admin can change user roles (admin only)
- [ ] Activity logs display (admin only)
- [ ] Can view profile
- [ ] Can change password
- [ ] Theme switching works
- [ ] No console errors
- [ ] All data persists in database

---

## Next Steps After Testing

1. **Document Issues**: Note any bugs or missing features
2. **Performance**: Check page load times
3. **Mobile**: Test on mobile devices (if needed)
4. **Security**: Review user permissions
5. **Production**: Plan for domain migration (see PRODUCTION_CONFIGURATION.md)
6. **Backup**: Set up database backups
7. **Monitoring**: Set up log monitoring

---

## Quick Commands

### Restart Application
```bash
sudo docker-compose restart ticketflow
```

### View Logs
```bash
sudo docker-compose logs -f ticketflow
```

### Check Application Status
```bash
sudo docker-compose ps
curl http://localhost:8080/api/ping
```

---

Happy Testing! 🚀

For production deployment with domains, see: `PRODUCTION_CONFIGURATION.md`
