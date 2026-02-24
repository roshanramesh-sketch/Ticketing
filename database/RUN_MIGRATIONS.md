# Database Migrations - Execution Guide

## ⚠️ IMPORTANT: Backup First!

**Before running any migrations, backup your database:**

```bash
# SSH to VM
ssh ticket_os_user@10.20.10.65

# Create backup
pg_dump -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing > /tmp/ticketing_backup_$(date +%Y%m%d_%H%M%S).sql

# Verify backup
ls -lh /tmp/ticketing_backup_*.sql
```

---

## Migration Files

Execute in this exact order:

1. `001_add_accounts.sql` - Multi-tenancy (Accounts)
2. `002_add_rbac.sql` - Role-Based Access Control
3. `003_add_teams.sql` - Teams
4. `004_add_attachments.sql` - Attachments
5. `005_enhance_bins.sql` - Enhanced Bins
6. `006_enhance_tickets.sql` - Enhanced Tickets
7. `007_enhance_kb.sql` - Enhanced Knowledge Base

---

## Execution Steps

### Step 1: Transfer Migration Files to VM

```bash
# From Windows
scp -r database/migrations ticket_os_user@10.20.10.65:/application/ticketing_hub/database/
```

### Step 2: Connect to PostgreSQL

```bash
# SSH to VM
ssh ticket_os_user@10.20.10.65

# Connect to database
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing
# Password: Ticketing@123
```

### Step 3: Run Migrations One by One

```sql
-- Migration 001
\i /application/ticketing_hub/database/migrations/001_add_accounts.sql

-- Verify
SELECT * FROM schema_system.table_accounts;
SELECT id, email, account_id FROM schema_auth.table_users LIMIT 5;

-- Migration 002
\i /application/ticketing_hub/database/migrations/002_add_rbac.sql

-- Verify
SELECT * FROM schema_auth.table_roles;
SELECT COUNT(*) FROM schema_auth.table_user_roles;

-- Migration 003
\i /application/ticketing_hub/database/migrations/003_add_teams.sql

-- Verify
SELECT * FROM schema_ticket.table_teams;

-- Migration 004
\i /application/ticketing_hub/database/migrations/004_add_attachments.sql

-- Verify
\d schema_ticket.table_attachments

-- Migration 005
\i /application/ticketing_hub/database/migrations/005_enhance_bins.sql

-- Verify
SELECT * FROM schema_ticket.table_ticket_bins;
SELECT * FROM schema_ticket.view_bin_stats;

-- Migration 006
\i /application/ticketing_hub/database/migrations/006_enhance_tickets.sql

-- Verify
\d schema_ticket.table_tickets

-- Migration 007
\i /application/ticketing_hub/database/migrations/007_enhance_kb.sql

-- Verify
\d schema_kb.table_kb_items
```

---

## Post-Migration Verification

```sql
-- Check users still exist
SELECT id, email, account_id FROM schema_auth.table_users;

-- Check all users have roles assigned
SELECT 
  u.email, 
  r.display_name as role,
  CASE WHEN ur.bin_id IS NULL THEN 'Global' ELSE b.name END as scope
FROM schema_auth.table_users u
LEFT JOIN schema_auth.table_user_roles ur ON u.id = ur.user_id
LEFT JOIN schema_auth.table_roles r ON ur.role_id = r.id
LEFT JOIN schema_ticket.table_ticket_bins b ON ur.bin_id = b.id
ORDER BY u.email;

-- Check bins are created
SELECT id, name, account_id, is_active FROM schema_ticket.table_ticket_bins;

-- Check teams are created
SELECT id, name, account_id FROM schema_ticket.table_teams;

-- Verify dummy data cleared
SELECT COUNT(*) as tickets_count FROM schema_ticket.table_tickets; -- Should be 0
SELECT COUNT(*) as kb_count FROM schema_kb.table_kb_items; -- Should be 0
```

---

## Rollback (if needed)

If something goes wrong:

```bash
# SSH to VM
ssh ticket_os_user@10.20.10.65

# Restore from backup
psql -h 10.20.10.65 -p 5434 -U user_ticketing_app -d db_ticketing < /tmp/ticketing_backup_XXXXXX.sql
```

---

## What These Migrations Do

### Preserved:
- ✅ All user accounts (`schema_auth.table_users`)
- ✅ User passwords (bcrypt hashed)
- ✅ Bins structure

### Cleared:
- ❌ All tickets and ticket messages (dummy data)
- ❌ All KB articles (dummy data)
- ❌ All activity logs (dummy data)

### Added:
- ✅ Accounts table (BCITS as default)
- ✅ Roles and permissions system
- ✅ Teams table
- ✅ Attachments table
- ✅ Enhanced bins with colors and managers
- ✅ Ticket transfer tracking
- ✅ KB full-text search

---

## Next Steps After Migrations

1. **Verify all migrations succeeded**
2. **Check user data is intact**
3. **Proceed with backend code updates**
4. **Test API endpoints**
5. **Deploy frontend changes**

---

## Support

If you encounter errors:
1. Check PostgreSQL logs: `sudo docker logs ticketflow-app 2>&1 | grep postgres`
2. Verify user has permissions: `\du` in psql
3. Check table exists: `\dt schema_name.*`
4. Restore from backup if needed
