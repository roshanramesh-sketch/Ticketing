-- ==========================================
-- Migration 003: Add Teams (UPDATED)
-- ==========================================
-- Description: Creates teams table and adds team_id to tickets
-- UPDATED: Correct descriptions + additional teams

BEGIN;

-- Create teams table (if not exists from previous run)
CREATE TABLE IF NOT EXISTS schema_ticket.table_teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  account_id INTEGER NOT NULL REFERENCES schema_system.table_accounts(id) ON DELETE CASCADE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES schema_auth.table_users(id),
  
  -- A team name must be unique within an account
  CONSTRAINT unique_team_name_per_account UNIQUE(name, account_id)
);

-- Create indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_teams_account ON schema_ticket.table_teams(account_id);
CREATE INDEX IF NOT EXISTS idx_teams_active ON schema_ticket.table_teams(is_active);

-- Clear existing teams to re-insert with correct data
DELETE FROM schema_ticket.table_teams WHERE account_id = 1;

-- Insert teams with CORRECT descriptions for BCITS account
INSERT INTO schema_ticket.table_teams (name, account_id, description, is_active) VALUES
-- Original teams with corrected descriptions
('HES', 1, 'Head End System', true),
('MDM', 1, 'Meter Data Management Systems', true),
('WFM', 1, 'Workforce Management', true),
('SLA', 1, 'Service Level Agreement', true),
('Cloud', 1, 'Cloud Infra Management & Services', true),
('DB', 1, 'Database Administration', true),
('System Admin', 1, 'System Administration', true),
('Organization', 1, 'Organizational Support', true),

-- New teams
('IoT', 1, 'Network Monitoring System - IoT Gateways over RF, NMS - Wirepas Services', true),
('QC', 1, 'Testing & Quality Control', true),
('Org Administration', 1, 'Accounts, Billing, Purchase Orders', true),
('RMS', 1, 'Revenue Management System, Bijli Prabhand, Bijli Mitra, vCloud Engine', true)

ON CONFLICT (name, account_id) DO UPDATE
SET description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- Add team_id to tickets table (if not exists)
ALTER TABLE schema_ticket.table_tickets 
ADD COLUMN IF NOT EXISTS team_id INTEGER REFERENCES schema_ticket.table_teams(id);

-- Create index (if not exists)
CREATE INDEX IF NOT EXISTS idx_tickets_team ON schema_ticket.table_tickets(team_id);

COMMIT;

-- Verification queries (run separately)
-- SELECT id, name, description FROM schema_ticket.table_teams WHERE account_id = 1 ORDER BY id;
-- SELECT COUNT(*) FROM schema_ticket.table_teams;
