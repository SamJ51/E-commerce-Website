const express = require('express');
const pool = require('./config/db');

const app = express();
app.use(express.json());

// Test Database Connection
app.get('/testdb', async (req, res) => {
  try {
    // No database query, only a simple message
    res.status(200).json({ message: 'Database connection is working' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'An error occurred', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

