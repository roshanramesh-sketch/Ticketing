-- ==========================================
-- Migration 007: Enhance Knowledge Base
-- ==========================================
-- Description: Adds ticket linking and bin categorization to KB

BEGIN;

-- Add ticket linking to KB
ALTER TABLE schema_kb.table_kb_items 
ADD COLUMN IF NOT EXISTS linked_ticket_id INTEGER REFERENCES schema_ticket.table_tickets(id),
ADD COLUMN IF NOT EXISTS bin_category INTEGER REFERENCES schema_ticket.table_ticket_bins(id);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_kb_linked_ticket ON schema_kb.table_kb_items(linked_ticket_id);
CREATE INDEX IF NOT EXISTS idx_kb_bin_category ON schema_kb.table_kb_items(bin_category);

-- Add search enhancement: full-text search
ALTER TABLE schema_kb.table_kb_items 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create trigger to update search_vector on insert/update
CREATE OR REPLACE FUNCTION schema_kb.update_kb_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_kb_search_vector ON schema_kb.table_kb_items;
CREATE TRIGGER trigger_kb_search_vector
  BEFORE INSERT OR UPDATE ON schema_kb.table_kb_items
  FOR EACH ROW
  EXECUTE FUNCTION schema_kb.update_kb_search_vector();

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_kb_search_vector ON schema_kb.table_kb_items USING gin(search_vector);

-- Create view for KB with related ticket info
CREATE OR REPLACE VIEW schema_kb.view_kb_with_ticket AS
SELECT 
  kb.id,
  kb.title,
  kb.content,
  kb.category,
  kb.author_id,
  kb.created_time,
  kb.account_id,
  kb.bin_category,
  kb.linked_ticket_id,
  t.subject as linked_ticket_subject,
  t.status as linked_ticket_status,
  b.name as bin_category_name
FROM schema_kb.table_kb_items kb
LEFT JOIN schema_ticket.table_tickets t ON kb.linked_ticket_id = t.id
LEFT JOIN schema_ticket.table_ticket_bins b ON kb.bin_category = b.id;

COMMIT;

-- Verification queries (run separately)
-- SELECT * FROM schema_kb.view_kb_with_ticket;
-- SELECT id, title FROM schema_kb.table_kb_items 
-- WHERE search_vector @@ to_tsquery('english', 'password');
