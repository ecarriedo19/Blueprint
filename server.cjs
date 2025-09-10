// This file sets up a simple Express server and SQLite database for user registration
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const app = express();
const PORT = 4000;

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Add security headers to help with OAuth
app.use((req, res, next) => {
  res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

// Session configuration
app.use(session({
  store: new SQLiteStore({
    db: 'sessions.db',
    dir: './'
  }),
  secret: 'blueprint-session-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Initialize SQLite DB
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) throw err;
  console.log('Connected to SQLite database.');
});

// Create tables in sequence
db.serialize(() => {
  // Drop existing tables to recreate with new schema
  db.run(`DROP TABLE IF EXISTS quotes`);
  db.run(`DROP TABLE IF EXISTS projects`);
  db.run(`DROP TABLE IF EXISTS vendors`);
  db.run(`DROP TABLE IF EXISTS company_profile`);
  db.run(`DROP TABLE IF EXISTS users`);

  // Create users table with new schema
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    googleId TEXT UNIQUE,
    email TEXT UNIQUE,
    name TEXT,
    profilePictureUrl TEXT,
    provider TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create company_profile table with user relationship
  db.run(`CREATE TABLE IF NOT EXISTS company_profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    company_name TEXT NOT NULL DEFAULT 'Company Co',
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Sample tables for AI context (you can expand these as needed)
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    budget REAL,
    status TEXT,
    description TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT,
    vendor_name TEXT,
    amount REAL,
    status TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialty TEXT,
    contact_email TEXT,
    phone TEXT,
    rating REAL,
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Insert default company profile if it doesn't exist
  db.run(`INSERT OR IGNORE INTO company_profile (id, company_name) VALUES ('default', 'Company Co')`);

  console.log('Database tables created/updated successfully');
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!', 
    timestamp: new Date().toISOString(),
    session: req.session.userId ? `User ID: ${req.session.userId}` : 'No session'
  });
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Get current user profile
app.get('/api/me', requireAuth, (req, res) => {
  db.get(
    'SELECT id, googleId, email, name, profilePictureUrl, provider FROM users WHERE id = ?',
    [req.session.userId],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    }
  );
});

// Enhanced Google Auth endpoint - handles user creation/update and session
app.post('/api/users', (req, res) => {
  console.log('Received user data:', req.body);
  const { id: googleId, email, name, profilePictureUrl, provider } = req.body;
  
  if (!googleId || !email) {
    console.error('Missing required fields:', { googleId, email });
    return res.status(400).json({ error: 'Google ID and email are required' });
  }

  // Check if user exists by googleId
  db.get(
    'SELECT * FROM users WHERE googleId = ?',
    [googleId],
    (err, existingUser) => {
      if (err) {
        console.error('Database error checking user:', err);
        return res.status(500).json({ error: err.message });
      }
      
      console.log('Existing user found:', existingUser);
      
      if (existingUser) {
        // Update existing user
        db.run(
          'UPDATE users SET name = ?, email = ?, profilePictureUrl = ?, updated_at = CURRENT_TIMESTAMP WHERE googleId = ?',
          [name, email, profilePictureUrl, googleId],
          function(err) {
            if (err) {
              console.error('Database error updating user:', err);
              return res.status(500).json({ error: err.message });
            }
            
            console.log('User updated successfully');
            // Set session
            req.session.userId = existingUser.id;
            res.json({ 
              success: true, 
              user: { 
                id: existingUser.id, 
                googleId, 
                email, 
                name, 
                profilePictureUrl,
                provider 
              } 
            });
          }
        );
      } else {
        // Create new user
        console.log('Creating new user...');
        db.run(
          'INSERT INTO users (googleId, email, name, profilePictureUrl, provider) VALUES (?, ?, ?, ?, ?)',
          [googleId, email, name, profilePictureUrl, provider],
          function(err) {
            if (err) {
              console.error('Database error creating user:', err);
              return res.status(500).json({ error: err.message });
            }
            
            const newUserId = this.lastID;
            console.log('New user created with ID:', newUserId);
            
            // Create default company profile for new user
            db.run(
              'INSERT INTO company_profile (id, company_name, user_id) VALUES (?, ?, ?)',
              [`user_${newUserId}`, 'Company Co', newUserId],
              (err) => {
                if (err) console.error('Error creating company profile:', err);
                else console.log('Company profile created for user:', newUserId);
              }
            );
            
            // Set session
            req.session.userId = newUserId;
            res.json({ 
              success: true, 
              user: { 
                id: newUserId, 
                googleId, 
                email, 
                name, 
                profilePictureUrl,
                provider 
              } 
            });
          }
        );
      }
    }
  );
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Failed to logout' });
    res.json({ success: true });
  });
});

// Get company profile
app.get('/api/company-profile', requireAuth, (req, res) => {
  db.get(
    'SELECT company_name FROM company_profile WHERE user_id = ?', 
    [req.session.userId], 
    (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!row) {
        // Create default profile if none exists
        db.run(
          'INSERT INTO company_profile (id, company_name, user_id) VALUES (?, ?, ?)',
          [`user_${req.session.userId}`, 'Company Co', req.session.userId],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ company_name: 'Company Co' });
          }
        );
      } else {
        res.json({ company_name: row.company_name });
      }
    }
  );
});

// Update company profile
app.post('/api/company-profile', requireAuth, (req, res) => {
  const { company_name } = req.body;
  if (!company_name) return res.status(400).json({ error: 'Company name is required' });
  
  db.run(
    'UPDATE company_profile SET company_name = ? WHERE user_id = ?',
    [company_name, req.session.userId],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) {
        // Create if doesn't exist
        db.run(
          'INSERT INTO company_profile (id, company_name, user_id) VALUES (?, ?, ?)',
          [`user_${req.session.userId}`, company_name, req.session.userId],
          function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, company_name });
          }
        );
      } else {
        res.json({ success: true, company_name });
      }
    }
  );
});

// Get AI context - aggregates all user data for AI consumption
app.get('/api/ai-context', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const context = {
    projects: [],
    vendors: [],
    quotes: [],
    companyProfile: null
  };

  // Get company profile
  db.get('SELECT company_name FROM company_profile WHERE user_id = ?', [userId], (err, companyRow) => {
    if (err) return res.status(500).json({ error: err.message });
    context.companyProfile = companyRow;

    // Get user's projects
    db.all('SELECT * FROM projects WHERE user_id = ?', [userId], (err, projectRows) => {
      if (err) return res.status(500).json({ error: err.message });
      context.projects = projectRows || [];

      // Get user's vendors
      db.all('SELECT * FROM vendors WHERE user_id = ?', [userId], (err, vendorRows) => {
        if (err) return res.status(500).json({ error: err.message });
        context.vendors = vendorRows || [];

        // Get user's quotes
        db.all('SELECT * FROM quotes WHERE user_id = ?', [userId], (err, quoteRows) => {
          if (err) return res.status(500).json({ error: err.message });
          context.quotes = quoteRows || [];

          // Format the context as markdown
          let formattedContext = `# ${context.companyProfile?.company_name || 'Company'} Business Data\n\n`;
          
          // Projects section
          formattedContext += `## Projects\n`;
          if (context.projects.length > 0) {
            context.projects.forEach(project => {
              formattedContext += `- **${project.name}**: Budget $${project.budget?.toLocaleString()}, Status: ${project.status}\n`;
              if (project.description) formattedContext += `  Description: ${project.description}\n`;
            });
          } else {
            formattedContext += `- No projects found\n`;
          }
          
          // Vendors section
          formattedContext += `\n## Vendors\n`;
          if (context.vendors.length > 0) {
            context.vendors.forEach(vendor => {
              formattedContext += `- **${vendor.name}**: ${vendor.specialty}`;
              if (vendor.rating) formattedContext += `, Rating: ${vendor.rating}/5`;
              if (vendor.contact_email) formattedContext += `, Contact: ${vendor.contact_email}`;
              formattedContext += `\n`;
            });
          } else {
            formattedContext += `- No vendors found\n`;
          }
          
          // Quotes section
          formattedContext += `\n## Quotes\n`;
          if (context.quotes.length > 0) {
            context.quotes.forEach(quote => {
              formattedContext += `- **${quote.project_name}** by ${quote.vendor_name}: $${quote.amount?.toLocaleString()}, Status: ${quote.status}\n`;
            });
          } else {
            formattedContext += `- No quotes found\n`;
          }

          res.json({ 
            context: formattedContext,
            rawData: context 
          });
        });
      });
    });
  });
});

// Endpoint to add/find user (legacy endpoint, keeping for compatibility)
app.post('/api/users-legacy', (req, res) => {
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
