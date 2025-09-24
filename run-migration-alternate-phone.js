const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  let connection;

  try {
    // Database connection
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || process.env.DB_NAME || 'agtech_certification',
      port: process.env.DB_PORT || 3306
    };

    // Add SSL configuration if DB_SSL is true
    if (process.env.DB_SSL === 'true') {
      dbConfig.ssl = {
        rejectUnauthorized: false
      };
    }

    connection = await mysql.createConnection(dbConfig);

    console.log('Connected to the database');

    // Read and execute the migration
    const migrationPath = path.join(__dirname, 'migrations', 'add_alternate_phone.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: add_alternate_phone.sql');
    await connection.execute(migrationSQL);
    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

runMigration();