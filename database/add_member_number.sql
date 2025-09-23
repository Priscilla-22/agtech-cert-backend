-- Add member_number column to farmers table
-- This column will store the unique member identification number for each farmer

ALTER TABLE farmers
ADD COLUMN member_number VARCHAR(20) UNIQUE AFTER name,
ADD INDEX idx_member_number (member_number);

-- Generate member numbers for existing farmers (format: MEMBER-YYYY-XXXX)
-- This will create sequential member numbers for existing records
SET @counter = 0;
UPDATE farmers
SET member_number = CONCAT('MEMBER-', YEAR(CURDATE()), '-', LPAD((@counter := @counter + 1), 4, '0'))
WHERE member_number IS NULL;