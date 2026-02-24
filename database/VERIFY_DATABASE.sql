-- ==========================================
-- DATABASE STRUCTURE VERIFICATION COMMANDS
-- ==========================================

-- 1. Check users table structure
\d schema_auth.table_users

-- 2. Check if created_time or creation_time exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'schema_auth' 
  AND table_name = 'table_users'
  AND column_name LIKE '%time%'
ORDER BY ordinal_position;

-- 3. View sample user data
SELECT id, email, firstname, lastname, 
       creation_time, last_login, account_id, role
FROM schema_auth.table_users
LIMIT 5;

-- 4. Check all tables in auth schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'schema_auth'
ORDER BY table_name;

-- 5. Check all tables in ticket schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'schema_ticket'
ORDER BY table_name;

-- 6. View complete accounts table structure
\d schema_auth.table_accounts

-- 7. Check current timezone settings
SHOW timezone;

-- 8. Check BCITS account details
SELECT id, account_name, timezone, created_time
FROM schema_auth.table_accounts
WHERE account_name = 'BCITS';

-- 9. View bins table structure
\d schema_ticket.table_ticket_bins

-- 10. View roles table structure
\d schema_auth.table_roles

-- 11. View user_roles junction table
\d schema_auth.table_user_roles

-- 12. View teams table
\d schema_ticket.table_teams

-- 13. View tickets table structure
\d schema_ticket.table_tickets

-- 14. View knowledge base table structure
\d schema_ticket.table_knowledge_base

-- 15. Count records in each main table
SELECT 
  'Users' as table_name, COUNT(*) as record_count FROM schema_auth.table_users
UNION ALL
SELECT 'Accounts', COUNT(*) FROM schema_auth.table_accounts
UNION ALL
SELECT 'Bins', COUNT(*) FROM schema_ticket.table_ticket_bins
UNION ALL
SELECT 'Teams', COUNT(*) FROM schema_ticket.table_teams
UNION ALL
SELECT 'Roles', COUNT(*) FROM schema_auth.table_roles
UNION ALL
SELECT 'Tickets', COUNT(*) FROM schema_ticket.table_tickets
UNION ALL
SELECT 'Knowledge Base', COUNT(*) FROM schema_ticket.table_knowledge_base;

-- ==========================================
-- TIMEZONE FIXES
-- ==========================================

-- 16. Add timezone column to accounts table (if not exists)
ALTER TABLE schema_auth.table_accounts 
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata';

-- 17. Update BCITS account to use IST
UPDATE schema_auth.table_accounts 
SET timezone = 'Asia/Kolkata'
WHERE account_name = 'BCITS';

-- 18. Set all existing accounts to IST (if timezone is null)
UPDATE schema_auth.table_accounts 
SET timezone = 'Asia/Kolkata'
WHERE timezone IS NULL;

-- 19. Check all accounts with their timezones
SELECT id, account_name, timezone, created_time
FROM schema_auth.table_accounts
ORDER BY id;

-- ==========================================
-- VERIFY TIMESTAMP COLUMNS ACROSS ALL TABLES
-- ==========================================

-- 20. List all timestamp columns across all schemas
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema IN ('schema_auth', 'schema_ticket')
  AND data_type IN ('timestamp without time zone', 'timestamp with time zone', 'timestamptz')
ORDER BY table_schema, table_name, ordinal_position;
