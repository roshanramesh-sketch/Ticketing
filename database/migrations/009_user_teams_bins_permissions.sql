-- Migration 009: User Teams, User Bins, Granular Permissions
-- Run as: postgres superuser on db_ticketing

-- =============================================
-- User-Team assignments
-- =============================================
CREATE TABLE IF NOT EXISTS schema_auth.table_user_teams (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES schema_auth.table_users(id) ON DELETE CASCADE,
  team_id INTEGER NOT NULL REFERENCES schema_ticket.table_teams(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES schema_auth.table_users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, team_id)
);

CREATE INDEX IF NOT EXISTS idx_user_teams_user ON schema_auth.table_user_teams(user_id);
CREATE INDEX IF NOT EXISTS idx_user_teams_team ON schema_auth.table_user_teams(team_id);

-- =============================================
-- User-Bin access control
-- =============================================
CREATE TABLE IF NOT EXISTS schema_auth.table_user_bins (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES schema_auth.table_users(id) ON DELETE CASCADE,
  bin_id INTEGER NOT NULL REFERENCES schema_ticket.table_ticket_bins(id) ON DELETE CASCADE,
  assigned_by INTEGER REFERENCES schema_auth.table_users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, bin_id)
);

CREATE INDEX IF NOT EXISTS idx_user_bins_user ON schema_auth.table_user_bins(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bins_bin ON schema_auth.table_user_bins(bin_id);

-- =============================================
-- Granular permissions per user
-- =============================================
CREATE TABLE IF NOT EXISTS schema_auth.table_user_permissions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES schema_auth.table_users(id) ON DELETE CASCADE,
  permission_key VARCHAR(100) NOT NULL,
  permission_value JSONB DEFAULT 'true'::jsonb,
  granted_by INTEGER REFERENCES schema_auth.table_users(id),
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, permission_key)
);

CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON schema_auth.table_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_key ON schema_auth.table_user_permissions(permission_key);

-- =============================================
-- Permission definitions (drives UI generation)
-- =============================================
CREATE TABLE IF NOT EXISTS schema_auth.table_permission_definitions (
  id SERIAL PRIMARY KEY,
  permission_key VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,
  value_type VARCHAR(20) DEFAULT 'boolean',  -- boolean | array | object
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0
);

INSERT INTO schema_auth.table_permission_definitions
  (permission_key, display_name, description, value_type, display_order)
VALUES
  ('create_user',             'Create User',              'Can create new users',                           'boolean', 1),
  ('change_password',         'Change User Password',     'Can reset other user passwords',                 'boolean', 2),
  ('create_ticket',           'Create Ticket',            'Can create new tickets',                         'boolean', 3),
  ('assign_ticket',           'Assign Ticket',            'Can assign tickets to users',                    'boolean', 4),
  ('bins_assigned',           'Bins Assigned',            'Bins the user can view and manage',              'array',   5),
  ('add_attachment',          'Add Attachment',           'Can attach files to tickets',                    'boolean', 6),
  ('transfer_ticket',         'Transfer Ticket',          'Can transfer tickets between bins/users',        'boolean', 7),
  ('create_account',          'Create Account',           'Can create new accounts (multi-tenant)',         'boolean', 8),
  ('switch_accounts',         'Switch Accounts',          'Can switch between accounts',                    'boolean', 9),
  ('create_kb',               'Create KB',                'Can create knowledge base articles',             'boolean', 10),
  ('link_kb_ticket',          'Link KB to Ticket',        'Can link KB articles to ticket numbers',         'boolean', 11),
  ('view_overall_dashboard',  'View Overall Dashboard',   'Can view system-wide dashboard statistics',      'boolean', 12),
  ('view_bin_dashboard',      'View Bin Dashboard',       'Can view bin-specific dashboard stats',          'boolean', 13)
ON CONFLICT (permission_key) DO NOTHING;

-- =============================================
-- Grant permissions to app user
-- =============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON schema_auth.table_user_teams TO user_ticketing_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON schema_auth.table_user_bins TO user_ticketing_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON schema_auth.table_user_permissions TO user_ticketing_app;
GRANT SELECT ON schema_auth.table_permission_definitions TO user_ticketing_app;
GRANT USAGE, SELECT ON SEQUENCE schema_auth.table_user_teams_id_seq TO user_ticketing_app;
GRANT USAGE, SELECT ON SEQUENCE schema_auth.table_user_bins_id_seq TO user_ticketing_app;
GRANT USAGE, SELECT ON SEQUENCE schema_auth.table_user_permissions_id_seq TO user_ticketing_app;
