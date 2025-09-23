const mysql = require('mysql2/promise');
require('dotenv').config();

async function addMemberNumberColumn() {
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

    // Check if member_number column already exists
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'farmers'
      AND COLUMN_NAME = 'member_number'
      AND TABLE_SCHEMA = DATABASE()
    `);

    if (columns.length > 0) {
      console.log('ℹ️  member_number column already exists');
      return;
    }

    console.log('\n🔄 Adding member_number column to farmers table...');

    // Add member_number column after name column
    await connection.execute(`
      ALTER TABLE farmers
      ADD COLUMN member_number VARCHAR(20) UNIQUE AFTER name,
      ADD INDEX idx_member_number (member_number)
    `);

    console.log('✅ member_number column added successfully');

    // Generate member numbers for existing farmers
    console.log('\n🔄 Generating member numbers for existing farmers...');

    const [existingFarmers] = await connection.execute(`
      SELECT id FROM farmers WHERE member_number IS NULL ORDER BY id
    `);

    if (existingFarmers.length > 0) {
      console.log(`📊 Found ${existingFarmers.length} farmers without member numbers`);

      for (let i = 0; i < existingFarmers.length; i++) {
        const farmer = existingFarmers[i];
        const memberNumber = `MEMBER-${new Date().getFullYear()}-${String(i + 1).padStart(4, '0')}`;

        await connection.execute(`
          UPDATE farmers SET member_number = ? WHERE id = ?
        `, [memberNumber, farmer.id]);
      }

      console.log(`✅ Generated member numbers for ${existingFarmers.length} farmers`);
    } else {
      console.log('ℹ️  No existing farmers found or all already have member numbers');
    }

    console.log('\n🎉 Member number migration completed successfully!');

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
addMemberNumberColumn();