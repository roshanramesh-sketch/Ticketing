-- ==========================================
-- Migration 001: Add Multi-Tenancy (Accounts)
-- ==========================================
-- Description: Creates accounts table and adds account_id to existing tables
-- Preserves: User data
-- Clears: Tickets, KB, Activity logs (dummy data)

BEGIN;

-- Create accounts table
CREATE TABLE IF NOT EXISTS schema_system.table_accounts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}'::jsonb,
  
  -- Metadata
  created_by INTEGER,
  
  -- Constraints
  CONSTRAINT chk_name_format CHECK (name ~ '^[a-z0-9_]+$')
);

-- Create index on name for faster lookups
CREATE INDEX idx_accounts_name ON schema_system.table_accounts(name);
CREATE INDEX idx_accounts_active ON schema_system.table_accounts(is_active);

-- Insert default BCITS account (id=1)
INSERT INTO schema_system.table_accounts (id, name, display_name, is_active) 
VALUES (1, 'bcits', 'BCITS', true)
ON CONFLICT (id) DO NOTHING;

-- Reset sequence to start from 2 for new accounts
SELECT setval('schema_system.table_accounts_id_seq', 1, true);

-- Add account_id to users table
ALTER TABLE schema_auth.table_users 
ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES schema_system.table_accounts(id) DEFAULT 1 NOT NULL;

-- Update all existing users to belong to BCITS account
UPDATE schema_auth.table_users SET account_id = 1 WHERE account_id IS NULL;

-- Create index on account_id for users
CREATE INDEX IF NOT EXISTS idx_users_account ON schema_auth.table_users(account_id);

-- Add account_id to tickets table and CLEAR dummy data
TRUNCATE TABLE schema_ticket.table_ticket_messages CASCADE;
TRUNCATE TABLE schema_ticket.table_tickets CASCADE;

ALTER TABLE schema_ticket.table_tickets 
ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES schema_system.table_accounts(id) DEFAULT 1 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_account ON schema_ticket.table_tickets(account_id);

-- Add account_id to bins table
ALTER TABLE schema_ticket.table_ticket_bins 
ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES schema_system.table_accounts(id) DEFAULT 1 NOT NULL;

-- Update existing bins to BCITS account
UPDATE schema_ticket.table_ticket_bins SET account_id = 1 WHERE account_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_bins_account ON schema_ticket.table_ticket_bins(account_id);

-- Add account_id to KB items and CLEAR dummy data
TRUNCATE TABLE schema_kb.table_kb_items CASCADE;

ALTER TABLE schema_kb.table_kb_items 
ADD COLUMN IF NOT EXISTS account_id INTEGER REFERENCES schema_system.table_accounts(id) DEFAULT 1 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kb_account ON schema_kb.table_kb_items(account_id);

-- Clear activity logs (dummy data)
TRUNCATE TABLE schema_system.table_activity_logs CASCADE;

COMMIT;

-- Verification queries (run separately)
-- SELECT * FROM schema_system.table_accounts;
-- SELECT id, email, account_id FROM schema_auth.table_users;
-- SELECT COUNT(*) FROM schema_ticket.table_tickets; -- should be 0
-- SELECT COUNT(*) FROM schema_kb.table_kb_items; -- should be 0
