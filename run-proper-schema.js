const mysql = require('mysql2/promise');
const fs = require('fs');
require('dotenv').config();

async function runProperSchema() {
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

    // Read and execute the schema with modifications
    let schemaContent = fs.readFileSync('database/schema.sql', 'utf8');

    // Remove database creation and use statements
    schemaContent = schemaContent.replace(/CREATE DATABASE.*?;/gi, '');
    schemaContent = schemaContent.replace(/USE.*?;/gi, '');

    // Fix the problematic scope column - remove DEFAULT
    schemaContent = schemaContent.replace(/scope TEXT DEFAULT 'Organic crop production',/gi, 'scope TEXT,');

    // Split by semicolons and execute each statement
    const statements = schemaContent.split(';').filter(stmt => stmt.trim().length > 0);

    for (const statement of statements) {
      const trimmedStatement = statement.trim();
      if (trimmedStatement.length > 0 && !trimmedStatement.startsWith('--')) {
        try {
          await connection.execute(trimmedStatement);

          // Log table creation
          if (trimmedStatement.includes('CREATE TABLE')) {
            const tableName = trimmedStatement.match(/CREATE TABLE.*?(\w+)/i)?.[1];
            if (tableName) {
              console.log(`✅ ${tableName} table created`);
            }
          }
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.warn(`⚠️  Statement failed: ${error.message}`);
            console.warn(`Statement: ${trimmedStatement.substring(0, 100)}...`);
          }
        }
      }
    }

    // Now run additional migrations
    console.log('\n🔄 Running additional migrations...');

    // Add violations column if not exists
    try {
      await connection.execute(`
        ALTER TABLE inspections
        ADD COLUMN violations JSON COMMENT 'Array of violations found during inspection'
      `);
      console.log('✅ Added violations column to inspections');
    } catch (error) {
      if (!error.message.includes('Duplicate column name')) {
        console.warn('⚠️  Could not add violations column:', error.message);
      }
    }

    // Add renewal_pending status if not exists
    try {
      await connection.execute(`
        ALTER TABLE certificates
        MODIFY COLUMN status ENUM('active', 'expired', 'revoked', 'suspended', 'renewal_pending') DEFAULT 'active'
      `);
      console.log('✅ Added renewal_pending status to certificates');
    } catch (error) {
      console.warn('⚠️  Could not modify certificate status:', error.message);
    }

    console.log('\n🎉 Database schema migration completed successfully!');

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
runProperSchema();