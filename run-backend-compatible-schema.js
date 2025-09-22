const mysql = require('mysql2/promise');
require('dotenv').config();

async function runBackendCompatibleSchema() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || process.env.DB_DATABASE || 'defaultdb',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    });

    console.log('✅ Connected to database');

    // Drop existing tables
    console.log('\n🔄 Dropping existing tables...');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    await connection.execute('DROP TABLE IF EXISTS inspection_status_history');
    await connection.execute('DROP TABLE IF EXISTS inspections');
    await connection.execute('DROP TABLE IF EXISTS certificates');
    await connection.execute('DROP TABLE IF EXISTS farms');
    await connection.execute('DROP TABLE IF EXISTS farmers');
    await connection.execute('DROP TABLE IF EXISTS users');
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Existing tables dropped');

    // Create users table
    console.log('\n🔄 Creating users table...');
    await connection.execute(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(255) UNIQUE NOT NULL COMMENT 'Firebase UID',
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        role ENUM('agronomist', 'inspector', 'admin') DEFAULT 'agronomist',
        status ENUM('active', 'inactive') DEFAULT 'active',
        specialization VARCHAR(255),
        years_experience INT,
        qualification TEXT,
        bio TEXT,
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_uid (uid),
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_specialization (specialization)
      )
    `);
    console.log('✅ Users table created');

    // Create farmers table to match EXACTLY what the backend expects
    console.log('\n🔄 Creating farmers table...');
    await connection.execute(`
      CREATE TABLE farmers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        memberNumber VARCHAR(50) UNIQUE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        alternatePhone VARCHAR(20),
        idNumber VARCHAR(50) UNIQUE NOT NULL,
        dateOfBirth DATE,
        county VARCHAR(100) NOT NULL,
        subCounty VARCHAR(100),
        ward VARCHAR(100),
        village VARCHAR(100),
        address TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        farmingExperience ENUM('0-2', '3-5', '6-10', '11-20', '20+') NOT NULL,
        educationLevel ENUM('primary', 'secondary', 'certificate', 'diploma', 'degree', 'postgraduate') NOT NULL,
        agriculturalTraining TEXT,
        primaryCrops JSON COMMENT 'Array of crops grown',
        farmingType ENUM('subsistence', 'commercial', 'mixed') NOT NULL,
        totalLandSize DECIMAL(10, 2) COMMENT 'Total land in hectares',
        cultivatedSize DECIMAL(10, 2) COMMENT 'Cultivated land in hectares',
        landTenure ENUM('owned', 'leased', 'family', 'communal') NOT NULL,
        soilType ENUM('clay', 'sandy', 'loam', 'volcanic', 'black cotton') NOT NULL,
        waterSources JSON COMMENT 'Array of water sources',
        irrigationSystem ENUM('none', 'drip', 'sprinkler', 'furrow', 'flood') DEFAULT 'none',
        previousCertification ENUM('yes', 'no', 'transitioning') NOT NULL,
        certifyingBody VARCHAR(255),
        certificationExpiry DATE,
        organicExperience ENUM('0-1', '2-3', '4-5', '6-10', '10+') NOT NULL,
        motivation TEXT,
        challenges TEXT,
        expectations TEXT,
        status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
        notes TEXT,
        registrationDate DATE NOT NULL,
        totalFarms INT DEFAULT 0,
        certificationStatus ENUM('pending', 'certified', 'expired', 'rejected') DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- Add snake_case fields for queries that expect them
        sub_county VARCHAR(100) GENERATED ALWAYS AS (subCounty) VIRTUAL,
        farming_type ENUM('subsistence', 'commercial', 'mixed') GENERATED ALWAYS AS (farmingType) VIRTUAL,
        organic_experience ENUM('0-1', '2-3', '4-5', '6-10', '10+') GENERATED ALWAYS AS (organicExperience) VIRTUAL,
        education_level ENUM('primary', 'secondary', 'certificate', 'diploma', 'degree', 'postgraduate') GENERATED ALWAYS AS (educationLevel) VIRTUAL,
        total_land_size DECIMAL(10, 2) GENERATED ALWAYS AS (totalLandSize) VIRTUAL,
        certification_status ENUM('pending', 'certified', 'expired', 'rejected') GENERATED ALWAYS AS (certificationStatus) VIRTUAL,

        INDEX idx_email (email),
        INDEX idx_phone (phone),
        INDEX idx_idNumber (idNumber),
        INDEX idx_county (county),
        INDEX idx_status (status),
        INDEX idx_certificationStatus (certificationStatus),
        INDEX idx_memberNumber (memberNumber),
        INDEX idx_registrationDate (registrationDate),
        INDEX idx_sub_county (sub_county),
        INDEX idx_farming_type (farming_type),
        INDEX idx_organic_experience (organic_experience),
        INDEX idx_education_level (education_level),
        INDEX idx_total_land_size (total_land_size),
        INDEX idx_certification_status_snake (certification_status)
      )
    `);
    console.log('✅ Farmers table created with both camelCase and snake_case support');

    // Create farms table to match backend expectations
    console.log('\n🔄 Creating farms table...');
    await connection.execute(`
      CREATE TABLE farms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        farmerId INT NOT NULL,
        farmName VARCHAR(255) NOT NULL,
        location TEXT NOT NULL,
        totalArea DECIMAL(10, 2) COMMENT 'Total farm area in hectares',
        organicArea DECIMAL(10, 2) COMMENT 'Organic farming area in hectares',
        cropTypes JSON COMMENT 'Array of crops grown',
        organicSince DATE COMMENT 'Date when organic farming started',
        certificationStatus ENUM('pending', 'certified', 'expired', 'rejected') DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- Add snake_case virtual columns for queries that expect them
        farmer_id INT GENERATED ALWAYS AS (farmerId) VIRTUAL,
        farm_name VARCHAR(255) GENERATED ALWAYS AS (farmName) VIRTUAL,
        total_area DECIMAL(10, 2) GENERATED ALWAYS AS (totalArea) VIRTUAL,
        organic_area DECIMAL(10, 2) GENERATED ALWAYS AS (organicArea) VIRTUAL,
        crop_types JSON GENERATED ALWAYS AS (cropTypes) VIRTUAL,
        organic_since DATE GENERATED ALWAYS AS (organicSince) VIRTUAL,
        certification_status ENUM('pending', 'certified', 'expired', 'rejected') GENERATED ALWAYS AS (certificationStatus) VIRTUAL,
        created_at TIMESTAMP GENERATED ALWAYS AS (createdAt) VIRTUAL,
        updated_at TIMESTAMP GENERATED ALWAYS AS (updatedAt) VIRTUAL,

        FOREIGN KEY (farmerId) REFERENCES farmers(id) ON DELETE CASCADE,
        INDEX idx_farmerId (farmerId),
        INDEX idx_certificationStatus (certificationStatus),
        INDEX idx_farmer_id (farmer_id)
      )
    `);
    console.log('✅ Farms table created');

    // Create inspections table
    console.log('\n🔄 Creating inspections table...');
    await connection.execute(`
      CREATE TABLE inspections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        farmId INT NOT NULL,
        inspectorId INT,
        inspectionDate DATE NOT NULL,
        status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'approved', 'rejected') DEFAULT 'scheduled',
        type ENUM('initial', 'annual', 'spot_check', 'follow_up') NOT NULL,
        checklist JSON COMMENT 'Inspection checklist items and results',
        findings TEXT,
        recommendations TEXT,
        notes TEXT,
        violations JSON COMMENT 'Array of violations found during inspection',
        score DECIMAL(5, 2) COMMENT 'Overall inspection score',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updatedBy VARCHAR(255) COMMENT 'User who last updated the inspection',

        -- Add snake_case virtual columns
        farm_id INT GENERATED ALWAYS AS (farmId) VIRTUAL,
        inspector_id INT GENERATED ALWAYS AS (inspectorId) VIRTUAL,
        inspection_date DATE GENERATED ALWAYS AS (inspectionDate) VIRTUAL,
        created_at TIMESTAMP GENERATED ALWAYS AS (createdAt) VIRTUAL,
        updated_at TIMESTAMP GENERATED ALWAYS AS (updatedAt) VIRTUAL,
        updated_by VARCHAR(255) GENERATED ALWAYS AS (updatedBy) VIRTUAL,

        FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE,
        FOREIGN KEY (inspectorId) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_farmId (farmId),
        INDEX idx_inspectorId (inspectorId),
        INDEX idx_inspectionDate (inspectionDate),
        INDEX idx_status (status),
        INDEX idx_farm_id (farm_id),
        INDEX idx_inspector_id (inspector_id),
        INDEX idx_inspection_date (inspection_date)
      )
    `);
    console.log('✅ Inspections table created');

    // Create certificates table
    console.log('\n🔄 Creating certificates table...');
    await connection.execute(`
      CREATE TABLE certificates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        certificateNumber VARCHAR(100) UNIQUE NOT NULL,
        farmId INT NOT NULL,
        issueDate DATE NOT NULL,
        expiryDate DATE NOT NULL,
        status ENUM('active', 'expired', 'revoked', 'suspended', 'renewal_pending') DEFAULT 'active',
        certificationBody VARCHAR(255) NOT NULL,
        scope TEXT,
        pdfUrl VARCHAR(500),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

        -- Add snake_case virtual columns
        certificate_number VARCHAR(100) GENERATED ALWAYS AS (certificateNumber) VIRTUAL,
        farm_id INT GENERATED ALWAYS AS (farmId) VIRTUAL,
        issue_date DATE GENERATED ALWAYS AS (issueDate) VIRTUAL,
        expiry_date DATE GENERATED ALWAYS AS (expiryDate) VIRTUAL,
        certification_body VARCHAR(255) GENERATED ALWAYS AS (certificationBody) VIRTUAL,
        pdf_url VARCHAR(500) GENERATED ALWAYS AS (pdfUrl) VIRTUAL,
        created_at TIMESTAMP GENERATED ALWAYS AS (createdAt) VIRTUAL,
        updated_at TIMESTAMP GENERATED ALWAYS AS (updatedAt) VIRTUAL,

        FOREIGN KEY (farmId) REFERENCES farms(id) ON DELETE CASCADE,
        INDEX idx_farmId (farmId),
        INDEX idx_certificateNumber (certificateNumber),
        INDEX idx_status (status),
        INDEX idx_expiryDate (expiryDate),
        INDEX idx_farm_id (farm_id),
        INDEX idx_certificate_number (certificate_number),
        INDEX idx_expiry_date (expiry_date)
      )
    `);
    console.log('✅ Certificates table created');

    console.log('\n🎉 Backend-compatible database schema created successfully!');
    console.log('\n📊 Features:');
    console.log('  - Primary fields use camelCase (for INSERT statements)');
    console.log('  - Virtual snake_case fields (for SELECT queries)');
    console.log('  - Works with existing backend code without changes');
    console.log('  - Both naming conventions supported simultaneously');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔐 Database connection closed');
    }
  }
}

// Run the migration
runBackendCompatibleSchema();