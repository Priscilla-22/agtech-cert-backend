-- Add alternate_phone column to farmers table if it doesn't exist
ALTER TABLE farmers
ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(20) AFTER phone;