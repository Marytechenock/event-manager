const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Initialize database
async function initializeDatabase() {
  const client = await pool.connect();
  try {
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
        total_chairs INTEGER NOT NULL CHECK (total_chairs > 0),
        chairs_occupied INTEGER DEFAULT 0 CHECK (chairs_occupied >= 0),
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
        registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        lucky_number INTEGER UNIQUE  -- CHANGED FROM VARCHAR TO INTEGER + UNIQUE
      )
    `);

    // Create index for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_guests_lucky_number 
      ON guests(lucky_number)
    `);

    // Create default admin
    const defaultPassword = await bcrypt.hash('admin123', 10);
    await client.query(
      'INSERT INTO admins (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO NOTHING',
      ['admin', defaultPassword]
    );

    // Add sample companies
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

// Test database connection
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

initializeDatabase().catch(console.error);

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  testConnection,
  initializeDatabase
};