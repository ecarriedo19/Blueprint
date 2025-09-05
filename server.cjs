// This file sets up a simple Express server and SQLite database for user registration
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Initialize SQLite DB
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) throw err;
  console.log('Connected to SQLite database.');
});

db.run(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  provider TEXT
)`);

// Endpoint to add/find user
app.post('/api/users', (req, res) => {
  const { id, email, name, provider } = req.body;
  db.run(
    `INSERT OR IGNORE INTO users (id, email, name, provider) VALUES (?, ?, ?, ?)`,
    [id, email, name, provider],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
