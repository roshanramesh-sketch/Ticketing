-- ==========================================
-- Grant Permissions to user_ticketing_app
-- ==========================================
-- Run this after all migrations complete

BEGIN;

-- Grant usage on schemas
GRANT USAGE ON SCHEMA schema_system TO user_ticketing_app;
GRANT USAGE ON SCHEMA schema_auth TO user_ticketing_app;
GRANT USAGE ON SCHEMA schema_ticket TO user_ticketing_app;
GRANT USAGE ON SCHEMA schema_kb TO user_ticketing_app;

-- Grant permissions on ALL tables (existing + new)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA schema_system TO user_ticketing_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA schema_auth TO user_ticketing_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA schema_ticket TO user_ticketing_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA schema_kb TO user_ticketing_app;

-- Grant usage on ALL sequences (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA schema_system TO user_ticketing_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA schema_auth TO user_ticketing_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA schema_ticket TO user_ticketing_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA schema_kb TO user_ticketing_app;

-- Grant execute on ALL functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA schema_auth TO user_ticketing_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA schema_ticket TO user_ticketing_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA schema_kb TO user_ticketing_app;

-- Grant select on views
GRANT SELECT ON schema_ticket.view_bin_stats TO user_ticketing_app;
GRANT SELECT ON schema_ticket.view_priority_stats TO user_ticketing_app;
GRANT SELECT ON schema_kb.view_kb_with_ticket TO user_ticketing_app;

COMMIT;

-- Verification
SELECT 
  grantee, 
  table_schema, 
  table_name, 
  string_agg(privilege_type, ', ') as privileges
FROM information_schema.table_privileges
WHERE grantee = 'user_ticketing_app'
  AND table_schema IN ('schema_system', 'schema_auth', 'schema_ticket', 'schema_kb')
GROUP BY grantee, table_schema, table_name
ORDER BY table_schema, table_name;

-- Should show multiple tables with SELECT, INSERT, UPDATE, DELETE permissions
