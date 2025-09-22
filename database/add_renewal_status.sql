-- Add renewal pending status to certificates table
-- This allows tracking of certificates awaiting renewal approval

USE pesira_db;

-- Modify the status ENUM to include renewal_pending
ALTER TABLE certificates
MODIFY COLUMN status ENUM('active', 'expired', 'revoked', 'suspended', 'renewal_pending') DEFAULT 'active';

-- Show updated table structure
DESCRIBE certificates;