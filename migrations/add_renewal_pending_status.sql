-- Migration: Add renewal_pending status to certificates table
-- Date: 2025-09-21
-- Description: Adds renewal_pending to the status ENUM to support certificate renewal workflow

USE pesira_db;

-- Show current table structure before migration
DESCRIBE certificates;

-- Add renewal_pending to the status ENUM
ALTER TABLE certificates
MODIFY COLUMN status ENUM('active', 'expired', 'revoked', 'suspended', 'renewal_pending')
DEFAULT 'active';

-- Show updated table structure after migration
DESCRIBE certificates;

-- Verify the change
SHOW COLUMNS FROM certificates LIKE 'status';