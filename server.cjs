// This file sets up a simple Express server and SQLite database for user registration
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const { createClient } = require('@supabase/supabase-js');
const { pipeline } = require('@xenova/transformers');
require('dotenv').config();

const app = express();
const PORT = 4000;

// Initialize Supabase client
let supabase = null;
let embedder = null;

if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
  console.log('✅ Supabase client initialized');
  
  // Initialize embedding pipeline for similarity search
  pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
    .then(model => {
      embedder = model;
      console.log('✅ Embedding model loaded for similarity search');
    })
    .catch(err => {
      console.warn('⚠️  Could not load embedding model:', err.message);
    });
} else {
  console.warn('⚠️  Supabase not configured - vector search will be disabled');
}

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

// Enhanced AI context endpoint with RAG capabilities
app.get('/api/ai-context', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  const query = req.query.q || req.query.query || '';
  
  console.log(`🤖 AI Context request from user ${userId}${query ? ` with query: "${query}"` : ''}`);
  
  try {
    // Part 1: Get user's private data from SQLite
    const privateContext = await getUserPrivateContext(userId);
    
    // Part 2: Get general knowledge from Supabase (if query provided and Supabase is available)
    let knowledgeContext = '';
    if (query && supabase && embedder) {
      try {
        knowledgeContext = await getRelevantKnowledge(query);
      } catch (error) {
        console.warn('⚠️  Knowledge search failed:', error.message);
      }
    }
    
    // Part 3: Combine contexts
    const combinedContext = buildCombinedContext(privateContext, knowledgeContext, query);
    
    res.json({
      context: combinedContext,
      sources: {
        privateData: !!privateContext.projects.length || !!privateContext.vendors.length || !!privateContext.quotes.length,
        knowledgeBase: !!knowledgeContext,
        query: query || null
      },
      rawData: privateContext
    });
    
  } catch (error) {
    console.error('❌ AI Context error:', error);
    res.status(500).json({ error: 'Failed to generate AI context' });
  }
});

// Helper function to get user's private data from SQLite
async function getUserPrivateContext(userId) {
  return new Promise((resolve, reject) => {
    const context = {
      projects: [],
      vendors: [],
      quotes: [],
      companyProfile: null
    };

    // Get company profile
    db.get('SELECT company_name FROM company_profile WHERE user_id = ?', [userId], (err, companyRow) => {
      if (err) return reject(err);
      context.companyProfile = companyRow;

      // Get user's projects
      db.all('SELECT * FROM projects WHERE user_id = ?', [userId], (err, projectRows) => {
        if (err) return reject(err);
        context.projects = projectRows || [];

        // Get user's vendors
        db.all('SELECT * FROM vendors WHERE user_id = ?', [userId], (err, vendorRows) => {
          if (err) return reject(err);
          context.vendors = vendorRows || [];

          // Get user's quotes
          db.all('SELECT * FROM quotes WHERE user_id = ?', [userId], (err, quoteRows) => {
            if (err) return reject(err);
            context.quotes = quoteRows || [];
            resolve(context);
          });
        });
      });
    });
  });
}

// Helper function to search general knowledge base
async function getRelevantKnowledge(query) {
  if (!supabase || !embedder) {
    return '';
  }
  
  try {
    console.log('🔍 Searching knowledge base for:', query);
    
    // Generate embedding for the query
    const cleanQuery = query.replace(/\n+/g, ' ').trim();
    const queryOutput = await embedder(cleanQuery, { pooling: 'mean', normalize: true });
    const queryEmbedding = Array.from(queryOutput.data);
    
    // Search for similar documents
    const { data, error } = await supabase.rpc('search_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1,
      match_count: 3
    });
    
    if (error) {
      console.warn('⚠️  Knowledge search RPC failed:', error.message);
      
      // Fallback: get all knowledge documents and do client-side similarity
      const { data: allDocs, error: fetchError } = await supabase
        .from('knowledge')
        .select('title, content, file_path')
        .limit(10);
      
      if (fetchError) {
        throw new Error(`Knowledge fetch failed: ${fetchError.message}`);
      }
      
      console.log(`📚 Retrieved ${allDocs?.length || 0} knowledge documents as fallback`);
      return formatKnowledgeDocuments(allDocs || []);
    }
    
    console.log(`📚 Found ${data?.length || 0} relevant knowledge documents`);
    return formatKnowledgeDocuments(data || []);
    
  } catch (error) {
    console.error('❌ Knowledge search error:', error);
    throw error;
  }
}

// Helper function to format knowledge documents
function formatKnowledgeDocuments(docs) {
  if (!docs || docs.length === 0) {
    return '';
  }
  
  let formatted = '\n\n## 📚 Relevant Knowledge Base Information\n\n';
  
  docs.forEach((doc, index) => {
    formatted += `### ${doc.title}\n`;
    formatted += `${doc.content}\n\n`;
    if (index < docs.length - 1) {
      formatted += '---\n\n';
    }
  });
  
  return formatted;
}

// Helper function to combine all contexts
function buildCombinedContext(privateContext, knowledgeContext, query) {
  let formattedContext = `# ${privateContext.companyProfile?.company_name || 'Company'} Business Data\n\n`;
  
  // Add query context if provided
  if (query) {
    formattedContext += `## 🎯 User Query\n"${query}"\n\n`;
  }
  
  // Projects section
  formattedContext += `## 📋 Projects\n`;
  if (privateContext.projects.length > 0) {
    privateContext.projects.forEach(project => {
      formattedContext += `- **${project.name}**: Budget $${project.budget?.toLocaleString() || 'N/A'}, Status: ${project.status || 'Unknown'}\n`;
      if (project.description) {
        formattedContext += `  Description: ${project.description}\n`;
      }
    });
  } else {
    formattedContext += `- No projects found\n`;
  }
  
  // Vendors section
  formattedContext += `\n## 🏢 Vendors\n`;
  if (privateContext.vendors.length > 0) {
    privateContext.vendors.forEach(vendor => {
      formattedContext += `- **${vendor.name}**: ${vendor.specialty || 'General'}`;
      if (vendor.rating) formattedContext += `, Rating: ${vendor.rating}/5`;
      if (vendor.contact_email) formattedContext += `, Contact: ${vendor.contact_email}`;
      formattedContext += `\n`;
    });
  } else {
    formattedContext += `- No vendors found\n`;
  }
  
  // Quotes section
  formattedContext += `\n## 💰 Quotes\n`;
  if (privateContext.quotes.length > 0) {
    privateContext.quotes.forEach(quote => {
      formattedContext += `- **${quote.project_name || 'Unknown Project'}** by ${quote.vendor_name || 'Unknown Vendor'}: $${quote.amount?.toLocaleString() || 'N/A'}, Status: ${quote.status || 'Unknown'}\n`;
    });
  } else {
    formattedContext += `- No quotes found\n`;
  }
  
  // Add knowledge base context if available
  if (knowledgeContext) {
    formattedContext += knowledgeContext;
  }
  
  // Add guidance for AI
  formattedContext += `\n\n## 🤖 AI Assistant Guidelines\n`;
  formattedContext += `- Use the above data to provide personalized advice for ${privateContext.companyProfile?.company_name || 'this company'}\n`;
  formattedContext += `- Reference specific projects, vendors, or quotes when relevant\n`;
  formattedContext += `- Combine insights from both private business data and general knowledge\n`;
  if (query) {
    formattedContext += `- Focus your response on answering: "${query}"\n`;
  }
  formattedContext += `- Provide actionable, construction-industry-specific guidance\n`;
  
  return formattedContext;
}

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
