-- ==========================================
-- Migration 005: Enhance Bins (UPDATED)
-- ==========================================
-- Description: Adds management fields to bins and creates default bins
-- UPDATED: Added bins for new teams (IoT, QC, Org Administration, RMS)

BEGIN;

-- Add management columns to bins (if not exists)
ALTER TABLE schema_ticket.table_ticket_bins 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES schema_auth.table_users(id),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS created_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES schema_auth.table_users(id),
ADD COLUMN IF NOT EXISTS color VARCHAR(7); -- Hex color for UI (e.g., #FF5733)

-- Create indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_bins_manager ON schema_ticket.table_ticket_bins(manager_id);
CREATE INDEX IF NOT EXISTS idx_bins_active ON schema_ticket.table_ticket_bins(is_active);

-- Clear existing bins and insert all bins (original + new)
DELETE FROM schema_ticket.table_ticket_bins WHERE account_id = 1;

INSERT INTO schema_ticket.table_ticket_bins (name, account_id, description, is_active, color) VALUES
-- Original bins
('General', 1, 'Default bin for new tickets from email', true, '#6B7280'),
('HES', 1, 'Head End System tickets', true, '#10B981'),
('MDM', 1, 'Meter Data Management Systems tickets', true, '#3B82F6'),
('WFM', 1, 'Workforce Management tickets', true, '#8B5CF6'),
('SLA', 1, 'Service Level Agreement tickets', true, '#F59E0B'),
('Cloud', 1, 'Cloud Infra Management & Services tickets', true, '#06B6D4'),
('DB', 1, 'Database Administration tickets', true, '#EF4444'),
('System Admin', 1, 'System Administration tickets', true, '#EC4899'),
('Organization', 1, 'Organizational Support tickets', true, '#F97316'),

-- New bins matching new teams
('IoT', 1, 'Network Monitoring System - IoT Gateways tickets', true, '#14B8A6'),
('QC', 1, 'Testing & Quality Control tickets', true, '#A855F7'),
('Org Administration', 1, 'Accounts, Billing, Purchase Orders tickets', true, '#84CC16'),
('RMS', 1, 'Revenue Management System tickets', true, '#F43F5E')

ON CONFLICT DO NOTHING;

-- Create view for bin statistics
CREATE OR REPLACE VIEW schema_ticket.view_bin_stats AS
SELECT 
  b.id as bin_id,
  b.name as bin_name,
  b.account_id,
  COUNT(t.id) as total_tickets,
  COUNT(CASE WHEN t.status = 'Open' THEN 1 END) as open_tickets,
  COUNT(CASE WHEN t.status = 'In Progress' THEN 1 END) as in_progress_tickets,
  COUNT(CASE WHEN t.status = 'Resolved' THEN 1 END) as resolved_tickets,
  COUNT(CASE WHEN t.status = 'Closed' THEN 1 END) as closed_tickets,
  COUNT(CASE WHEN t.archived_time IS NOT NULL THEN 1 END) as archived_tickets
FROM schema_ticket.table_ticket_bins b
LEFT JOIN schema_ticket.table_tickets t ON b.id = t.bin_id AND t.archived_time IS NULL
WHERE b.is_active = true
GROUP BY b.id, b.name, b.account_id;

COMMIT;

-- Verification queries (run separately)
-- SELECT id, name, description, color FROM schema_ticket.table_ticket_bins WHERE account_id = 1 ORDER BY id;
-- SELECT * FROM schema_ticket.view_bin_stats;
