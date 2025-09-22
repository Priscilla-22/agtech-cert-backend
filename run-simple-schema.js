const mysql = require('mysql2/promise');
require('dotenv').config();

async function runSimpleSchema() {
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

    // Create farmers table with camelCase field names to match INSERT statements
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
        sub_county VARCHAR(100),
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
        registration_date DATE NOT NULL,
        totalFarms INT DEFAULT 0,
        certification_status ENUM('pending', 'certified', 'expired', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_phone (phone),
        INDEX idx_idNumber (idNumber),
        INDEX idx_county (county),
        INDEX idx_status (status),
        INDEX idx_certification_status (certification_status),
        INDEX idx_memberNumber (memberNumber),
        INDEX idx_registration_date (registration_date)
      )
    `);
    console.log('✅ Farmers table created with camelCase fields');

    // Create farms table with camelCase names
    console.log('\n🔄 Creating farms table...');
    await connection.execute(`
      CREATE TABLE farms (
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
        INDEX idx_certification_status (certification_status)
      )
    `);
    console.log('✅ Farms table created');

    console.log('\n🎉 Corrected snake_case database schema created successfully!');
    console.log('\n✅ Schema now matches backend query expectations:');
    console.log('  - registration_date column for ORDER BY clauses');
    console.log('  - farmer_id column for farm relationships');

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
runSimpleSchema();