-- ==========================================
-- MIGRATION 010: Add Timezone Support (CORRECTED)
-- ==========================================

-- CORRECT SCHEMA: Accounts table is in schema_system, not schema_auth!

-- Add timezone column to accounts table
ALTER TABLE schema_system.table_accounts
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Asia/Kolkata';

-- Set BCITS account to IST
UPDATE schema_system.table_accounts
SET timezone = 'Asia/Kolkata'
WHERE account_name = 'BCITS';

-- Set all existing accounts to IST if null
UPDATE schema_system.table_accounts
SET timezone = 'Asia/Kolkata'
WHERE timezone IS NULL;

-- Add comment
COMMENT ON COLUMN schema_system.table_accounts.timezone IS 'Account timezone in IANA format (e.g., Asia/Kolkata for IST)';

-- Verify
SELECT id, account_name, timezone, created_time
FROM schema_system.table_accounts;