-- Add user_id column to farmers table to link farmers to the agronomists who registered them
-- This is critical for data isolation and security

ALTER TABLE farmers
ADD COLUMN user_id INT AFTER id,
ADD INDEX idx_user_id (user_id),
ADD CONSTRAINT fk_farmers_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;