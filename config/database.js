const mysql = require('mysql2/promise');
require('dotenv').config();

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || process.env.DB_DATABASE || 'agtech_certification',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    console.log(`📊 Connected to database: ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL Database connection failed:', error.message);
    console.error('📝 Please ensure MySQL is running and check your .env configuration');
    return false;
  }
}

// Execute query with error handling
async function executeQuery(query, params = []) {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
}

// Get a single record by ID
async function findById(table, id) {
  try {
    const query = `SELECT * FROM ${table} WHERE id = ?`;
    const [results] = await pool.execute(query, [id]);
    return results[0] || null;
  } catch (error) {
    console.error(`Error finding record by ID in ${table}:`, error.message);
    return null;
  }
}

// Get all records from a table
async function findAll(table, conditions = '', params = []) {
  try {
    const whereClause = conditions ? ` WHERE ${conditions}` : '';
    const query = `SELECT * FROM ${table}${whereClause}`;
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error(`Error finding all records in ${table}:`, error.message);
    return [];
  }
}

// Insert new record
async function create(table, data) {
  try {
    const fields = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const values = Object.values(data);

    const query = `INSERT INTO ${table} (${fields}) VALUES (${placeholders})`;
    const [result] = await pool.execute(query, values);

    // Return the created record
    return await findById(table, result.insertId);
  } catch (error) {
    console.error(`Error creating record in ${table}:`, error.message);
    throw error;
  }
}

// Update record
async function update(table, id, data) {
  try {
    const fields = Object.keys(data).map(field => `${field} = ?`).join(', ');
    const values = [...Object.values(data), id];

    const query = `UPDATE ${table} SET ${fields} WHERE id = ?`;
    await pool.execute(query, values);

    // Return the updated record
    return await findById(table, id);
  } catch (error) {
    console.error(`Error updating record in ${table}:`, error.message);
    throw error;
  }
}

// Delete record
async function deleteRecord(table, id) {
  try {
    const query = `DELETE FROM ${table} WHERE id = ?`;
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Error deleting record from ${table}:`, error.message);
    return false;
  }
}

// Close connection pool
async function closeConnection() {
  try {
    await pool.end();
    console.log('📊 Database connection pool closed');
  } catch (error) {
    console.error('Error closing database connection:', error.message);
  }
}

module.exports = {
  pool,
  testConnection,
  executeQuery,
  findById,
  findAll,
  create,
  update,
  delete: deleteRecord,
  closeConnection
};