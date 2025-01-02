require('dotenv').config();
const { Pool } = require('pg');

// Use DATABASE_URL if defined, else fall back to individual parameters
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'postgres'}:${process.env.DB_PASSWORD || 'Bottleflip!12'}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'ecommerce'}`,
});

pool.on('connect', () => {
  console.log('Connected to the PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Database error:', err.stack);
});

module.exports = pool;

