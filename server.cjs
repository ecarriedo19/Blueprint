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

// Create tables in sequence
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    provider TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS company_profile (
    id TEXT PRIMARY KEY DEFAULT 'default',
    company_name TEXT NOT NULL DEFAULT 'Company Co'
  )`);

  // Sample tables for AI context (you can expand these as needed)
  db.run(`CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    budget REAL,
    status TEXT,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT,
    vendor_name TEXT,
    amount REAL,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    specialty TEXT,
    contact_email TEXT,
    phone TEXT,
    rating REAL
  )`);

  // Insert default company profile if it doesn't exist
  db.run(`INSERT OR IGNORE INTO company_profile (id, company_name) VALUES ('default', 'Company Co')`);

  // Insert sample data for demonstration
  db.run(`INSERT OR IGNORE INTO projects (id, name, budget, status, description) VALUES 
    (1, 'Downtown Tower', 2400000, 'In Progress', 'Commercial high-rise construction project'),
    (2, 'Residential Complex', 1800000, 'Planning', 'Multi-family residential development'),
    (3, 'Shopping Center Renovation', 950000, 'Completed', 'Complete renovation of existing retail space')`);

  db.run(`INSERT OR IGNORE INTO vendors (id, name, specialty, contact_email, phone, rating) VALUES 
    (1, 'Concrete Corp', 'Concrete Supplies', 'info@concretecorp.com', '555-0123', 4.5),
    (2, 'Steel Solutions', 'Structural Steel', 'contact@steelsolutions.com', '555-0456', 4.8),
    (3, 'Electric Pro', 'Electrical Work', 'hello@electricpro.com', '555-0789', 4.2)`);

  db.run(`INSERT OR IGNORE INTO quotes (id, project_name, vendor_name, amount, status) VALUES 
    (1, 'Downtown Tower', 'Concrete Corp', 450000, 'Approved'),
    (2, 'Downtown Tower', 'Steel Solutions', 680000, 'Pending'),
    (3, 'Residential Complex', 'Electric Pro', 125000, 'Under Review')`);
});

// Get company profile
app.get('/api/company-profile', (req, res) => {
  db.get('SELECT company_name FROM company_profile WHERE id = ?', ['default'], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ company_name: row ? row.company_name : 'Company Co' });
  });
});

// Update company profile
app.post('/api/company-profile', (req, res) => {
  const { company_name } = req.body;
  if (!company_name) return res.status(400).json({ error: 'Company name is required' });
  
  db.run(
    'UPDATE company_profile SET company_name = ? WHERE id = ?',
    [company_name, 'default'],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, company_name });
    }
  );
});

// Get AI context - aggregates all user data for AI consumption
app.get('/api/ai-context', (req, res) => {
  const context = {
    projects: [],
    vendors: [],
    quotes: [],
    companyProfile: null
  };

  // Get company profile
  db.get('SELECT company_name FROM company_profile WHERE id = ?', ['default'], (err, companyRow) => {
    if (err) return res.status(500).json({ error: err.message });
    context.companyProfile = companyRow;

    // Get all projects
    db.all('SELECT * FROM projects', (err, projectRows) => {
      if (err) return res.status(500).json({ error: err.message });
      context.projects = projectRows || [];

      // Get all vendors
      db.all('SELECT * FROM vendors', (err, vendorRows) => {
        if (err) return res.status(500).json({ error: err.message });
        context.vendors = vendorRows || [];

        // Get all quotes
        db.all('SELECT * FROM quotes', (err, quoteRows) => {
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

// AI Context endpoint - aggregates all user data for RAG
app.get('/api/ai-context', (req, res) => {
  const contextData = {
    company: null,
    projects: [],
    vendors: [],
    quotes: []
  };

  // Get company profile
  db.get('SELECT company_name FROM company_profile WHERE id = ?', ['default'], (err, companyRow) => {
    if (err) return res.status(500).json({ error: err.message });
    contextData.company = companyRow;

    // Get all projects
    db.all('SELECT * FROM projects ORDER BY created_at DESC', (err, projectRows) => {
      if (err) return res.status(500).json({ error: err.message });
      contextData.projects = projectRows || [];

      // Get all vendors
      db.all('SELECT * FROM vendors ORDER BY rating DESC', (err, vendorRows) => {
        if (err) return res.status(500).json({ error: err.message });
        contextData.vendors = vendorRows || [];

        // Get all quotes
        db.all('SELECT * FROM quotes ORDER BY created_at DESC', (err, quoteRows) => {
          if (err) return res.status(500).json({ error: err.message });
          contextData.quotes = quoteRows || [];

          // Format the context as a readable string
          let formattedContext = `# ${contextData.company?.company_name || 'Company'} - Business Context\n\n`;

          // Projects section
          formattedContext += `## Current Projects\n`;
          if (contextData.projects.length > 0) {
            contextData.projects.forEach(project => {
              formattedContext += `### ${project.name}\n`;
              formattedContext += `- Budget: $${project.budget?.toLocaleString() || 'N/A'}\n`;
              formattedContext += `- Status: ${project.status}\n`;
              formattedContext += `- Description: ${project.description || 'No description'}\n\n`;
            });
          } else {
            formattedContext += `No projects currently in the system.\n\n`;
          }

          // Vendors section
          formattedContext += `## Vendor Network\n`;
          if (contextData.vendors.length > 0) {
            contextData.vendors.forEach(vendor => {
              formattedContext += `### ${vendor.name}\n`;
              formattedContext += `- Specialty: ${vendor.specialty}\n`;
              formattedContext += `- Contact: ${vendor.contact_email}\n`;
              formattedContext += `- Phone: ${vendor.phone}\n`;
              formattedContext += `- Rating: ${vendor.rating}/5.0\n\n`;
            });
          } else {
            formattedContext += `No vendors currently in the system.\n\n`;
          }

          // Quotes section
          formattedContext += `## Recent Quotes\n`;
          if (contextData.quotes.length > 0) {
            contextData.quotes.forEach(quote => {
              formattedContext += `### ${quote.project_name} - ${quote.vendor_name}\n`;
              formattedContext += `- Amount: $${quote.amount?.toLocaleString() || 'N/A'}\n`;
              formattedContext += `- Status: ${quote.status}\n\n`;
            });
          } else {
            formattedContext += `No quotes currently in the system.\n\n`;
          }

          res.json({ 
            context: formattedContext,
            raw_data: contextData
          });
        });
      });
    });
  });
});

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
