const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;

  try {
    // Database configuration - update these values according to your setup
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'pesira_db',
      multipleStatements: true
    };

    console.log('Connecting to database...');
    connection = await mysql.createConnection(dbConfig);

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'add_user_id_to_farmers.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: add_user_id_to_farmers.sql');
    console.log('Migration SQL:');
    console.log(migrationSQL);

    // Execute the migration
    await connection.execute(migrationSQL);

    console.log('✅ Migration completed successfully!');
    console.log('The user_id column has been added to the farmers table.');
    console.log('This will enable proper data isolation between agronomists.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the migration
runMigration();