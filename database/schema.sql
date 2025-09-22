-- AgTech Certification System Database Schema
-- MySQL Database Schema for organic farm certification management

-- Create database
CREATE DATABASE IF NOT EXISTS pesira_db;
USE pesira_db;

-- Users table (for agronomists/inspectors)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    uid VARCHAR(255) UNIQUE NOT NULL COMMENT 'Firebase UID',
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role ENUM('agronomist', 'inspector', 'admin') DEFAULT 'agronomist',
    status ENUM('active', 'inactive') DEFAULT 'active',
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_uid (uid),
    INDEX idx_email (email),
    INDEX idx_status (status)
);

-- Farmers table
CREATE TABLE IF NOT EXISTS farmers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    alternate_phone VARCHAR(20),
    id_number VARCHAR(50) UNIQUE NOT NULL,
    date_of_birth DATE,

    -- Location details
    county VARCHAR(100) NOT NULL,
    sub_county VARCHAR(100),
    ward VARCHAR(100),
    village VARCHAR(100),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),

    -- Farming background
    farming_experience ENUM('0-2', '3-5', '6-10', '11-20', '20+') NOT NULL,
    education_level ENUM('primary', 'secondary', 'certificate', 'diploma', 'degree', 'postgraduate') NOT NULL,
    agricultural_training TEXT,
    primary_crops JSON COMMENT 'Array of crops grown',
    farming_type ENUM('subsistence', 'commercial', 'mixed') NOT NULL,

    -- Farm details
    total_land_size DECIMAL(10, 2) COMMENT 'Total land in hectares',
    cultivated_size DECIMAL(10, 2) COMMENT 'Cultivated land in hectares',
    land_tenure ENUM('owned', 'leased', 'family', 'communal') NOT NULL,
    soil_type ENUM('clay', 'sandy', 'loam', 'volcanic', 'black cotton') NOT NULL,
    water_sources JSON COMMENT 'Array of water sources',
    irrigation_system ENUM('none', 'drip', 'sprinkler', 'furrow', 'flood') DEFAULT 'none',

    -- Certification status
    previous_certification ENUM('yes', 'no', 'transitioning') NOT NULL,
    certifying_body VARCHAR(255),
    certification_expiry DATE,
    organic_experience ENUM('0-1', '2-3', '4-5', '6-10', '10+') NOT NULL,
    motivation TEXT,
    challenges TEXT,
    expectations TEXT,

    -- System fields
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    notes TEXT,
    registration_date DATE NOT NULL,
    total_farms INT DEFAULT 0,
    certification_status ENUM('pending', 'certified', 'expired', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_id_number (id_number),
    INDEX idx_county (county),
    INDEX idx_status (status),
    INDEX idx_certification_status (certification_status),
    FULLTEXT idx_search (name, email, county, sub_county, village)
);

-- Farms table
CREATE TABLE IF NOT EXISTS farms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farmer_id INT NOT NULL,
    farm_name VARCHAR(255) NOT NULL,
    location TEXT NOT NULL,
    total_area DECIMAL(10, 2) COMMENT 'Total farm area in hectares',
    organic_area DECIMAL(10, 2) COMMENT 'Organic farming area in hectares',
    crop_types JSON COMMENT 'Array of crops grown',
    organic_since DATE COMMENT 'Date when organic farming started',
    certification_status ENUM('pending', 'certified', 'expired', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE,
    INDEX idx_farmer_id (farmer_id),
    INDEX idx_certification_status (certification_status),
    FULLTEXT idx_search (farm_name, location)
);

-- Fields table
CREATE TABLE IF NOT EXISTS fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    crop_type VARCHAR(100) NOT NULL,
    area DECIMAL(8, 2) COMMENT 'Field area in hectares',
    soil_type VARCHAR(100),
    planting_date DATE,
    organic_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    INDEX idx_farm_id (farm_id),
    INDEX idx_crop_type (crop_type),
    INDEX idx_organic_status (organic_status)
);

-- Inspections table
CREATE TABLE IF NOT EXISTS inspections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    farm_id INT NOT NULL,
    inspector_id INT,
    inspector_name VARCHAR(255),
    scheduled_date DATE NOT NULL,
    inspection_date DATE,
    status ENUM('scheduled', 'in_progress', 'completed', 'failed', 'cancelled') DEFAULT 'scheduled',
    checklist JSON COMMENT 'Inspection checklist responses',
    score INT COMMENT 'Inspection score out of 100',
    notes TEXT,
    violations JSON COMMENT 'Array of violations found during inspection',
    recommendations TEXT,
    is_eligible_for_certification BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (inspector_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_farm_id (farm_id),
    INDEX idx_inspector_id (inspector_id),
    INDEX idx_status (status),
    INDEX idx_scheduled_date (scheduled_date),
    INDEX idx_inspection_date (inspection_date)
);

-- Inspectors table (dedicated table for certified inspectors)
CREATE TABLE IF NOT EXISTS inspectors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    specialization ENUM('organic-crops', 'livestock', 'processing', 'general', 'soil-management', 'pest-control') NOT NULL,
    qualifications TEXT COMMENT 'Certifications, degrees, and training',
    experience ENUM('1-2', '3-5', '6-10', '10+') DEFAULT '1-2',
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_specialization (specialization)
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    certificate_number VARCHAR(100) UNIQUE NOT NULL,
    farm_id INT NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status ENUM('active', 'expired', 'revoked', 'suspended') DEFAULT 'active',
    certification_body VARCHAR(255) DEFAULT 'Kenya Organic Agriculture Network',
    scope TEXT DEFAULT 'Organic crop production',
    crop_types JSON COMMENT 'Array of certified crop types',
    pdf_url VARCHAR(500) COMMENT 'URL to PDF certificate',
    issued_by INT COMMENT 'User ID who issued the certificate',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE,
    FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_farm_id (farm_id),
    INDEX idx_certificate_number (certificate_number),
    INDEX idx_status (status),
    INDEX idx_issue_date (issue_date),
    INDEX idx_expiry_date (expiry_date)
);

-- Audit log table (optional, for tracking changes)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    record_id INT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON,
    new_values JSON,
    user_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_user_id (user_id)
);

-- Insert sample data for testing
-- Sample user (Agronomist)
INSERT INTO users (uid, email, name, phone, address, role) VALUES
('sample-uid-123', 'agronomist@example.com', 'John Agronomist', '+254712345678', 'P.O Box 123, Nairobi', 'agronomist')
ON DUPLICATE KEY UPDATE email = email;

-- Sample farmer
INSERT INTO farmers (
    name, email, phone, id_number, date_of_birth, county, sub_county, ward, village, address,
    farming_experience, education_level, farming_type, total_land_size, cultivated_size,
    land_tenure, soil_type, previous_certification, organic_experience, registration_date,
    primary_crops, water_sources
) VALUES (
    'Jane Farm Owner', 'jane.farmer@example.com', '+254723456789', '12345678', '1985-03-15',
    'Kiambu', 'Thika', 'Thika Town', 'Kamenu', 'P.O Box 456, Thika',
    '6-10', 'secondary', 'mixed', 5.5, 4.0,
    'owned', 'volcanic', 'no', '2-3', CURDATE(),
    '["Coffee", "Maize", "Beans"]', '["River", "Borehole"]'
) ON DUPLICATE KEY UPDATE email = email;

-- Show table structure
SHOW TABLES;