-- ==========================================
-- Migration 006: Enhance Tickets
-- ==========================================
-- Description: Updates ticket priority system and adds bin assignment

BEGIN;

-- Update priority column to support new P0-P4 system
ALTER TABLE schema_ticket.table_tickets 
ALTER COLUMN priority TYPE VARCHAR(20);

-- Ensure bin_id column exists (should be from earlier migration)
ALTER TABLE schema_ticket.table_tickets 
ADD COLUMN IF NOT EXISTS bin_id INTEGER REFERENCES schema_ticket.table_ticket_bins(id);

-- Add index on bin_id if not exists
CREATE INDEX IF NOT EXISTS idx_tickets_bin ON schema_ticket.table_tickets(bin_id);

-- Add transfer history tracking
CREATE TABLE IF NOT EXISTS schema_ticket.table_ticket_transfers (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES schema_ticket.table_tickets(id) ON DELETE CASCADE,
  from_bin_id INTEGER REFERENCES schema_ticket.table_ticket_bins(id),
  to_bin_id INTEGER NOT NULL REFERENCES schema_ticket.table_ticket_bins(id),
  transferred_by INTEGER NOT NULL REFERENCES schema_auth.table_users(id),
  transferred_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT
);

-- Create indexes
CREATE INDEX idx_ticket_transfers_ticket ON schema_ticket.table_ticket_transfers(ticket_id);
CREATE INDEX idx_ticket_transfers_time ON schema_ticket.table_ticket_transfers(transferred_time);

-- Add function to transfer ticket and log it
CREATE OR REPLACE FUNCTION schema_ticket.transfer_ticket(
  p_ticket_id INTEGER,
  p_to_bin_id INTEGER,
  p_user_id INTEGER,
  p_reason TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_from_bin_id INTEGER;
  v_account_id INTEGER;
BEGIN
  -- Get current bin_id and account_id
  SELECT bin_id, account_id INTO v_from_bin_id, v_account_id
  FROM schema_ticket.table_tickets
  WHERE id = p_ticket_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket % not found', p_ticket_id;
  END IF;
  
  -- Verify target bin belongs to same account
  IF NOT EXISTS (
    SELECT 1 FROM schema_ticket.table_ticket_bins 
    WHERE id = p_to_bin_id AND account_id = v_account_id
  ) THEN
    RAISE EXCEPTION 'Invalid target bin or account mismatch';
  END IF;
  
  -- Update ticket bin
  UPDATE schema_ticket.table_tickets
  SET bin_id = p_to_bin_id,
      updated_time = CURRENT_TIMESTAMP
  WHERE id = p_ticket_id;
  
  -- Log transfer
  INSERT INTO schema_ticket.table_ticket_transfers 
    (ticket_id, from_bin_id, to_bin_id, transferred_by, reason)
  VALUES 
    (p_ticket_id, v_from_bin_id, p_to_bin_id, p_user_id, p_reason);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create view for ticket statistics by priority
CREATE OR REPLACE VIEW schema_ticket.view_priority_stats AS
SELECT 
  account_id,
  priority,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'Open' THEN 1 END) as open,
  COUNT(CASE WHEN status = 'In Progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN status = 'Resolved' THEN 1 END) as resolved
FROM schema_ticket.table_tickets
WHERE archived_time IS NULL
GROUP BY account_id, priority;

COMMIT;

-- Verification queries (run separately)
-- SELECT * FROM schema_ticket.view_priority_stats;
-- SELECT * FROM schema_ticket.table_ticket_transfers ORDER BY transferred_time DESC LIMIT 10;
