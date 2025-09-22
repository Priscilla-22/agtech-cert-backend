const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
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

    // Create tables from schema
    console.log('\n🔄 Creating database tables...');

    // Create farmers table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS farmers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        alternate_phone VARCHAR(20),
        id_number VARCHAR(50) UNIQUE NOT NULL,
        date_of_birth DATE,
        county VARCHAR(100) NOT NULL,
        sub_county VARCHAR(100),
        ward VARCHAR(100),
        village VARCHAR(100),
        address TEXT,
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        farming_experience ENUM('0-2', '3-5', '6-10', '11-20', '20+') NOT NULL,
        education_level ENUM('primary', 'secondary', 'certificate', 'diploma', 'degree', 'postgraduate') NOT NULL,
        agricultural_training TEXT,
        primary_crops JSON COMMENT 'Array of crops grown',
        farming_type ENUM('subsistence', 'commercial', 'mixed') NOT NULL,
        total_land_size DECIMAL(10, 2) COMMENT 'Total land in hectares',
        cultivated_size DECIMAL(10, 2) COMMENT 'Cultivated land in hectares',
        land_tenure ENUM('owned', 'leased', 'family', 'communal') NOT NULL,
        soil_type ENUM('clay', 'sandy', 'loam', 'volcanic', 'black cotton') NOT NULL,
        water_sources JSON COMMENT 'Array of water sources',
        irrigation_system ENUM('none', 'drip', 'sprinkler', 'furrow', 'flood') DEFAULT 'none',
        previous_certification ENUM('yes', 'no', 'transitioning') NOT NULL,
        certifying_body VARCHAR(255),
        certification_expiry DATE,
        organic_experience ENUM('0-1', '2-3', '4-5', '6-10', '10+') NOT NULL,
        motivation TEXT,
        challenges TEXT,
        expectations TEXT,
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
        INDEX idx_certification_status (certification_status)
      )
    `);
    console.log('✅ Farmers table created');

    // Create farms table
    await connection.execute(`
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
        FOREIGN KEY (farmer_id) REFERENCES farmers(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Farms table created');

    // Create certificates table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS certificates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        certificate_number VARCHAR(100) UNIQUE NOT NULL,
        farm_id INT NOT NULL,
        issue_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        status ENUM('active', 'expired', 'revoked', 'suspended', 'renewal_pending') DEFAULT 'active',
        certification_body VARCHAR(255) NOT NULL,
        scope TEXT,
        pdf_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (farm_id) REFERENCES farms(id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Certificates table created');

    console.log('\n🎉 All database tables created successfully!');

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
runMigration();