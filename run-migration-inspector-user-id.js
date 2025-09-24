const mysql = require('mysql2/promise');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('Adding user_id column to inspectors table...');

    // Check if column already exists
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'inspectors' AND COLUMN_NAME = 'user_id'",
      [process.env.DB_DATABASE]
    );

    if (columns.length > 0) {
      console.log('user_id column already exists in inspectors table');
      return;
    }

    // Add user_id column
    await connection.execute(`
      ALTER TABLE inspectors
      ADD COLUMN user_id INT,
      ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `);

    // Add index for better performance
    await connection.execute(`
      CREATE INDEX idx_inspectors_user_id ON inspectors(user_id)
    `);

    console.log('Successfully added user_id column to inspectors table');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigration().catch(console.error);