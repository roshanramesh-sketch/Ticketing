-- Quick commands to check accounts table structure
-- Run these in psql to see actual column names

-- 1. View table structure
\d schema_system.table_accounts

-- 2. See all columns
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'schema_system' 
  AND table_name = 'table_accounts'
ORDER BY ordinal_position;

-- 3. View sample data (all columns)
SELECT * FROM schema_system.table_accounts LIMIT 3;

-- 4. Count accounts
SELECT COUNT(*) FROM schema_system.table_accounts;
