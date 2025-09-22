-- Add status history tracking table for inspections
USE pesira_db;

CREATE TABLE IF NOT EXISTS inspection_status_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inspection_id INT NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255) COMMENT 'User who made the change',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reason TEXT COMMENT 'Reason for status change',
    notes TEXT COMMENT 'Additional notes about the change',

    FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
    INDEX idx_inspection_id (inspection_id),
    INDEX idx_changed_at (changed_at),
    INDEX idx_new_status (new_status)
);

-- Add trigger to automatically track status changes
DELIMITER //

CREATE TRIGGER inspection_status_change_trigger
    AFTER UPDATE ON inspections
    FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO inspection_status_history (
            inspection_id,
            old_status,
            new_status,
            changed_by,
            reason
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            COALESCE(NEW.updated_by, 'System'),
            CONCAT('Status changed from ', OLD.status, ' to ', NEW.status)
        );
    END IF;
END//

DELIMITER ;

-- Add updated_by column to inspections table to track who made changes
ALTER TABLE inspections
ADD COLUMN updated_by VARCHAR(255) COMMENT 'User who last updated the inspection';