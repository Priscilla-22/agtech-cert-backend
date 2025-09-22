-- Add violations column to inspections table
USE pesira_db;

ALTER TABLE inspections
ADD COLUMN violations JSON COMMENT 'Array of violations found during inspection'
AFTER notes;