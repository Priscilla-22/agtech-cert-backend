-- Add user_id column to inspectors table for data isolation
ALTER TABLE inspectors
ADD COLUMN user_id INT,
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add index for better performance
CREATE INDEX idx_inspectors_user_id ON inspectors(user_id);