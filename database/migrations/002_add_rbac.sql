-- ==========================================
-- Migration 002: Add Role-Based Access Control (RBAC)
-- ==========================================
-- Description: Creates roles and user_roles tables for flexible permission management

BEGIN;

-- Create roles table
CREATE TABLE IF NOT EXISTS schema_auth.table_roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_system_role BOOLEAN DEFAULT false, -- Cannot be deleted if true
  
  -- Constraints
  CONSTRAINT chk_role_name_format CHECK (name ~ '^[a-z0-9_]+$')
);

-- Create index
CREATE INDEX idx_roles_name ON schema_auth.table_roles(name);

-- Insert predefined roles
INSERT INTO schema_auth.table_roles (name, display_name, description, permissions, is_system_role) VALUES
(
  'superadmin', 
  'Super Admin', 
  'Full access to all accounts and system settings',
  '["all"]'::jsonb,
  true
),
(
  'admin', 
  'Admin', 
  'Full access to account: manage users, bins, tickets',
  '["all_users", "all_bins", "all_tickets", "view_reports"]'::jsonb,
  true
),
(
  'bin_manager', 
  'Bin Manager', 
  'Manage specific bin: assign users, manage tickets within bin',
  '["all_tickets", "manage_bin_users", "transfer_tickets", "view_bin_reports"]'::jsonb,
  true
),
(
  'bin_lead', 
  'Bin Lead', 
  'Lead specific bin: assign tickets, respond to tickets',
  '["all_tickets", "assign_tickets", "respond_tickets", "create_ticket"]'::jsonb,
  true
),
(
  'pm_ba', 
  'PM/BA', 
  'Project Manager/Business Analyst: create, transfer, and view tickets',
  '["all_tickets", "create_ticket", "transfer_tickets", "view_tickets", "add_attachments"]'::jsonb,
  true
),
(
  'support', 
  'Support', 
  'Support user: respond to assigned tickets',
  '["respond_tickets", "view_tickets", "add_attachments"]'::jsonb,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS schema_auth.table_user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES schema_auth.table_users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES schema_auth.table_roles(id) ON DELETE CASCADE,
  bin_id INTEGER REFERENCES schema_ticket.table_ticket_bins(id) ON DELETE CASCADE,
  granted_by INTEGER REFERENCES schema_auth.table_users(id),
  granted_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- A user can have the same role only once per bin (or globally if bin_id is NULL)
  CONSTRAINT unique_user_role_bin UNIQUE(user_id, role_id, bin_id)
);

-- Create indexes
CREATE INDEX idx_user_roles_user ON schema_auth.table_user_roles(user_id);
CREATE INDEX idx_user_roles_role ON schema_auth.table_user_roles(role_id);
CREATE INDEX idx_user_roles_bin ON schema_auth.table_user_roles(bin_id);

-- Migrate existing user roles from old 'role' column to new system
-- Map old roles: 'Admin' -> admin, 'Support' -> support, etc.
INSERT INTO schema_auth.table_user_roles (user_id, role_id, bin_id)
SELECT 
  u.id as user_id,
  CASE 
    WHEN LOWER(u.role) = 'admin' THEN (SELECT id FROM schema_auth.table_roles WHERE name = 'admin')
    WHEN LOWER(u.role) = 'support' THEN (SELECT id FROM schema_auth.table_roles WHERE name = 'support')
    WHEN LOWER(u.role) = 'manager' THEN (SELECT id FROM schema_auth.table_roles WHERE name = 'bin_manager')
    ELSE (SELECT id FROM schema_auth.table_roles WHERE name = 'support') -- default
  END as role_id,
  NULL as bin_id -- Global role (not bin-specific)
FROM schema_auth.table_users u
WHERE u.role IS NOT NULL
ON CONFLICT (user_id, role_id, bin_id) DO NOTHING;

-- Keep the old 'role' column for backward compatibility (will remove in future migration)
-- ALTER TABLE schema_auth.table_users DROP COLUMN IF EXISTS role;

-- Add helper function to check if user has permission
CREATE OR REPLACE FUNCTION schema_auth.user_has_permission(
  p_user_id INTEGER,
  p_permission TEXT,
  p_bin_id INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  has_perm BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM schema_auth.table_user_roles ur
    JOIN schema_auth.table_roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND (ur.bin_id = p_bin_id OR ur.bin_id IS NULL) -- Global or bin-specific
      AND (
        r.permissions @> '["all"]'::jsonb OR -- Superadmin
        r.permissions @> to_jsonb(ARRAY[p_permission]) -- Specific permission
      )
  ) INTO has_perm;
  
  RETURN has_perm;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Verification queries (run separately)
-- SELECT * FROM schema_auth.table_roles;
-- SELECT u.email, r.display_name, ur.bin_id 
-- FROM schema_auth.table_user_roles ur
-- JOIN schema_auth.table_users u ON ur.user_id = u.id
-- JOIN schema_auth.table_roles r ON ur.role_id = r.id;
-- SELECT schema_auth.user_has_permission(1, 'all_users'); -- Test permission function
