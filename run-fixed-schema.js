const mysql = require('mysql2/promise');
require('dotenv').config();

async function runFixedSchema() {
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

    // Create farmers table with BOTH camelCase and snake_case columns
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

        -- Add real snake_case columns that mirror camelCase ones
        sub_county VARCHAR(100) AS (subCounty) STORED,
        farming_type ENUM('subsistence', 'commercial', 'mixed') AS (farmingType) STORED,
        organic_experience ENUM('0-1', '2-3', '4-5', '6-10', '10+') AS (organicExperience) STORED,
        education_level ENUM('primary', 'secondary', 'certificate', 'diploma', 'degree', 'postgraduate') AS (educationLevel) STORED,
        total_land_size DECIMAL(10, 2) AS (totalLandSize) STORED,
        certification_status ENUM('pending', 'certified', 'expired', 'rejected') AS (certificationStatus) STORED,
        registration_date DATE AS (registrationDate) STORED,

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
        INDEX idx_certification_status_snake (certification_status),
        INDEX idx_registration_date_snake (registration_date)
      )
    `);
    console.log('✅ Farmers table created with both naming conventions');

    // Create farms table
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

        -- Add snake_case stored columns
        farmer_id INT AS (farmerId) STORED,
        farm_name VARCHAR(255) AS (farmName) STORED,
        total_area DECIMAL(10, 2) AS (totalArea) STORED,
        organic_area DECIMAL(10, 2) AS (organicArea) STORED,
        crop_types JSON AS (cropTypes) STORED,
        organic_since DATE AS (organicSince) STORED,
        certification_status ENUM('pending', 'certified', 'expired', 'rejected') AS (certificationStatus) STORED,
        created_at TIMESTAMP AS (createdAt) STORED,
        updated_at TIMESTAMP AS (updatedAt) STORED,

        FOREIGN KEY (farmerId) REFERENCES farmers(id) ON DELETE CASCADE,
        INDEX idx_farmerId (farmerId),
        INDEX idx_certificationStatus (certificationStatus),
        INDEX idx_farmer_id (farmer_id)
      )
    `);
    console.log('✅ Farms table created');

    console.log('\n🎉 Fixed database schema created successfully!');
    console.log('\n📊 Features:');
    console.log('  - Primary fields use camelCase (for INSERT statements)');
    console.log('  - STORED snake_case fields (for SELECT queries)');
    console.log('  - registration_date column available for ORDER BY');
    console.log('  - farmer_id column available for farm queries');

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
runFixedSchema();