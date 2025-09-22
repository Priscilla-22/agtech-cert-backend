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
      database: process.env.DB_NAME || process.env.DB_DATABASE || 'pesira_db'
    });

    console.log('✅ Connected to database');

    // Show current status column structure
    console.log('\n📋 Current status column structure:');
    const [currentColumns] = await connection.execute("SHOW COLUMNS FROM certificates LIKE 'status'");
    console.table(currentColumns);

    // Run the migration
    console.log('\n🔄 Running migration to add renewal_pending status...');
    await connection.execute(`
      ALTER TABLE certificates
      MODIFY COLUMN status ENUM('active', 'expired', 'revoked', 'suspended', 'renewal_pending')
      DEFAULT 'active'
    `);

    console.log('✅ Migration completed successfully!');

    // Show updated status column structure
    console.log('\n📋 Updated status column structure:');
    const [updatedColumns] = await connection.execute("SHOW COLUMNS FROM certificates LIKE 'status'");
    console.table(updatedColumns);

    console.log('\n🎉 Certificate renewal status is now available!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);

    if (error.code === 'ER_DUP_ENTRY' || error.message.includes('Duplicate entry')) {
      console.log('ℹ️  The renewal_pending status may already exist in the database.');
    }

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