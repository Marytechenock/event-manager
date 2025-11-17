const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database configuration - Update these with your PostgreSQL credentials
const pool = new Pool({
  user: 'postgres',      // Replace with your PostgreSQL username
  host: 'localhost',
  database: 'event_manager',  // Your database name
  password: 'postgres',  // Replace with your PostgreSQL password
  port: 5433,        // Default PostgreSQL port
});

// Initialize database
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Start transaction
    await client.query('BEGIN');

    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        table_number VARCHAR(50) NOT NULL,
        total_chairs INTEGER NOT NULL,
        chairs_occupied INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS guests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        surname VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50) NOT NULL,
        company_id INTEGER REFERENCES companies(id) ON DELETE SET NULL,
        position VARCHAR(255) NOT NULL,
        table_number VARCHAR(50),
        registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default admin if not exists
    const defaultPassword = await bcrypt.hash('admin123', 10);
    await client.query(
      'INSERT INTO admins (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING',
      ['admin', defaultPassword]
    );

    // Add sample companies for testing
    await client.query(
      `INSERT INTO companies (name, table_number, total_chairs) VALUES
       ($1, $2, $3), ($4, $5, $6), ($7, $8, $9)
       ON CONFLICT (name) DO NOTHING`,
      [
        'ABC Corporation', 'T1', 10,
        'XYZ Ltd', 'T2', 8,
        'Innovate Africa', 'T3', 12
      ]
    );

    await client.query('COMMIT');
    console.log('Database tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Test the database connection
async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Database connected successfully:', res.rows[0].now);
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

// Initialize the database when this module is loaded
initializeDatabase().catch(console.error);

// Export the pool and utility functions
module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  testConnection,
  initializeDatabase
};
