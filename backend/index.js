const express = require('express');
const pool = require('./config/db');

const app = express();
app.use(express.json());

// Test Database Connection
app.get('/testdb', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.status(200).json({ message: 'Connected to the database', data: result.rows });
  } catch (err) {
    console.error('Database query failed:', err);
    res.status(500).json({ message: 'Database connection error', error: err.message });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
