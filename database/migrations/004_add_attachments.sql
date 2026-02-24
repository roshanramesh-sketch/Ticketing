-- ==========================================
-- Migration 004: Add Attachments
-- ==========================================
-- Description: Creates attachments table for ticket file uploads

BEGIN;

-- Create attachments table
CREATE TABLE IF NOT EXISTS schema_ticket.table_attachments (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES schema_ticket.table_tickets(id) ON DELETE CASCADE,
  
  -- File information
  filename VARCHAR(255) NOT NULL, -- Stored filename (unique/hashed)
  original_filename VARCHAR(255) NOT NULL, -- User-friendly filename
  file_path VARCHAR(500) NOT NULL, -- Full path or S3 key
  file_size BIGINT NOT NULL, -- In bytes
  file_type VARCHAR(100), -- MIME type
  
  -- Metadata
  uploaded_by INTEGER REFERENCES schema_auth.table_users(id),
  uploaded_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Optional description
  description TEXT,
  
  -- Soft delete
  is_deleted BOOLEAN DEFAULT false,
  deleted_by INTEGER REFERENCES schema_auth.table_users(id),
  deleted_time TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_attachments_ticket ON schema_ticket.table_attachments(ticket_id);
CREATE INDEX idx_attachments_uploaded_by ON schema_ticket.table_attachments(uploaded_by);
CREATE INDEX idx_attachments_uploaded_time ON schema_ticket.table_attachments(uploaded_time);
CREATE INDEX idx_attachments_deleted ON schema_ticket.table_attachments(is_deleted);

-- Add storage location configuration to accounts
ALTER TABLE schema_system.table_accounts 
ADD COLUMN IF NOT EXISTS attachment_storage_type VARCHAR(50) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS attachment_storage_config JSONB DEFAULT '{}'::jsonb;

-- Comment: attachment_storage_type can be 'local', 's3', 'azure', etc.
-- attachment_storage_config stores provider-specific settings

COMMIT;

-- Verification queries (run separately)
-- SELECT * FROM schema_ticket.table_attachments;
-- SELECT COUNT(*) as total_attachments FROM schema_ticket.table_attachments WHERE is_deleted = false;
