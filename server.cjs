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

// Create tables in sequence (only if they don't exist - preserve existing data)
db.serialize(() => {
  // Create users table with schema
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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Migration: Add updated_at column to existing projects table if it doesn't exist
  db.get("PRAGMA table_info(projects)", (err, result) => {
    if (err) {
      console.error('Error checking table schema:', err);
      return;
    }
    
    // Check if updated_at column exists by querying all columns
    db.all("PRAGMA table_info(projects)", (err, columns) => {
      if (err) {
        console.error('Error getting table columns:', err);
        return;
      }
      
      const hasUpdatedAt = columns.some(col => col.name === 'updated_at');
      
      if (!hasUpdatedAt) {
        console.log('Adding updated_at column to projects table...');
        // SQLite doesn't allow CURRENT_TIMESTAMP as default when adding to existing table
        // So we add the column with NULL default, then update existing rows
        db.run(`ALTER TABLE projects ADD COLUMN updated_at DATETIME`, (err) => {
          if (err) {
            console.error('Error adding updated_at column:', err);
          } else {
            // Update existing rows to have created_at as updated_at initial value
            db.run(`UPDATE projects SET updated_at = created_at WHERE updated_at IS NULL`, (updateErr) => {
              if (updateErr) {
                console.error('Error updating existing updated_at values:', updateErr);
              } else {
                console.log('✅ updated_at column added and initialized successfully');
              }
            });
          }
        });
      } else {
        console.log('✅ updated_at column already exists');
      }
    });
  });

  db.run(`CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quoteName TEXT NOT NULL,
    status TEXT DEFAULT 'Draft',
    timeToDevelop TEXT,
    variancePercentage REAL DEFAULT 0,
    quoteTotal REAL DEFAULT 0,
    budget REAL DEFAULT 0,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Migration: Update quotes table schema for new columns
  db.all("PRAGMA table_info(quotes)", (err, columns) => {
    if (err) {
      console.error('Error checking quotes table schema:', err);
      return;
    }
    
    const columnNames = columns.map(col => col.name);
    const requiredColumns = [
      { name: 'quoteName', type: 'TEXT' },
      { name: 'timeToDevelop', type: 'TEXT' },
      { name: 'variancePercentage', type: 'REAL DEFAULT 0' },
      { name: 'quoteTotal', type: 'REAL DEFAULT 0' },
      { name: 'budget', type: 'REAL DEFAULT 0' },
      { name: 'updated_at', type: 'DATETIME' }
    ];
    
    requiredColumns.forEach(col => {
      if (!columnNames.includes(col.name)) {
        console.log(`Adding ${col.name} column to quotes table...`);
        db.run(`ALTER TABLE quotes ADD COLUMN ${col.name} ${col.type}`, (alterErr) => {
          if (alterErr) {
            console.error(`Error adding ${col.name} column:`, alterErr);
          } else {
            console.log(`✅ ${col.name} column added successfully`);
          }
        });
      }
    });
  });

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

// Projects API Endpoints

// Get all projects for the authenticated user
app.get('/api/projects', requireAuth, (req, res) => {
  const userId = req.session.userId;
  
  db.all(
    'SELECT id, name, budget, status, description, created_at, created_at as updated_at FROM projects WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, projects) => {
      if (err) {
        console.error('Database error fetching projects:', err);
        return res.status(500).json({ error: 'Failed to fetch projects' });
      }
      
      // Format dates and extract priority from description for frontend
      const formattedProjects = projects.map(project => {
        let description = project.description || '';
        let priority = 'medium'; // default
        
        // Extract priority from description if it exists
        const priorityMatch = description.match(/\[Priority: (low|medium|high|urgent)\]/);
        if (priorityMatch) {
          priority = priorityMatch[1];
          description = description.replace(/\s*\[Priority: (low|medium|high|urgent)\]/, '').trim();
        }
        
        return {
          id: project.id,
          name: project.name,
          budget: project.budget,
          status: project.status,
          priority: priority,
          description: description,
          created_at: new Date(project.created_at).toISOString(),
          updated_at: new Date(project.updated_at).toISOString()
        };
      });
      
      console.log(`📋 Fetched ${formattedProjects.length} projects for user ${userId}`);
      res.json({ success: true, projects: formattedProjects });
    }
  );
});

// Create a new project for the authenticated user
app.post('/api/projects', requireAuth, (req, res) => {
  console.log('🔍 POST /api/projects - Request received');
  console.log('🔍 Request body:', req.body);
  console.log('🔍 User ID from session:', req.session.userId);
  
  const userId = req.session.userId;
  // Support both old (projectName) and new (name) field names
  const { projectName, name, budget, description, status, priority } = req.body;
  
  // Use whichever field is provided (prioritizing the new 'name' field)
  const finalProjectName = name || projectName;
  
  console.log('🔍 Final project name:', finalProjectName);
  
  // Validation
  if (!finalProjectName || !finalProjectName.trim()) {
    console.log('❌ Validation failed: Project name is required');
    return res.status(400).json({ error: 'Project name is required' });
  }
  
  if (budget !== undefined && (isNaN(budget) || budget < 0)) {
    return res.status(400).json({ error: 'Budget must be a valid positive number' });
  }
  
  const projectData = {
    name: finalProjectName.trim(),
    budget: budget || null,
    status: status || 'planning', // Use provided status or default
    description: description?.trim() || null,
    priority: priority || 'medium', // New field support
    user_id: userId
  };
  
  // Note: We'll store priority in description for now since the schema doesn't have a priority column
  const finalDescription = projectData.description ? 
    `${projectData.description} [Priority: ${projectData.priority}]` : 
    `[Priority: ${projectData.priority}]`;
  
  db.run(
    'INSERT INTO projects (name, budget, status, description, user_id) VALUES (?, ?, ?, ?, ?)',
    [projectData.name, projectData.budget, projectData.status, finalDescription, projectData.user_id],
    function(err) {
      if (err) {
        console.error('Database error creating project:', err);
        return res.status(500).json({ error: 'Failed to create project' });
      }
      
      const newProject = {
        id: this.lastID,
        name: projectData.name, // Use 'name' to match frontend expectations
        budget: projectData.budget,
        status: projectData.status,
        priority: projectData.priority,
        description: projectData.description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log(`✅ Created project "${projectData.name}" for user ${userId} with ID ${this.lastID}`);
      res.status(201).json({ 
        success: true, 
        message: 'Project created successfully',
        project: newProject 
      });
    }
  );
});

// Update project status (useful for AI actions)
app.patch('/api/projects/:projectId', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { projectId } = req.params;
  const { status, budget, description, priority, name } = req.body;
  
  // Build dynamic query
  const updates = [];
  const values = [];
  
  if (name) {
    updates.push('name = ?');
    values.push(name.trim());
  }
  if (status) {
    updates.push('status = ?');
    values.push(status);
  }
  if (budget !== undefined) {
    updates.push('budget = ?');
    values.push(budget);
  }
  if (description !== undefined || priority !== undefined) {
    // Handle priority embedded in description
    let finalDescription = description || '';
    const currentPriority = priority || 'medium';
    
    // Remove existing priority tag if any
    finalDescription = finalDescription.replace(/\s*\[Priority: (low|medium|high|urgent)\]/, '').trim();
    
    // Add new priority tag
    if (finalDescription) {
      finalDescription = `${finalDescription} [Priority: ${currentPriority}]`;
    } else {
      finalDescription = `[Priority: ${currentPriority}]`;
    }
    
    updates.push('description = ?');
    values.push(finalDescription);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }
  
  values.push(projectId, userId);
  
  db.run(
    `UPDATE projects SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
    values,
    function(err) {
      if (err) {
        console.error('Database error updating project:', err);
        return res.status(500).json({ error: 'Failed to update project' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Project not found or access denied' });
      }
      
      // Fetch the updated project to return it
      db.get(
        'SELECT id, name, budget, status, description, created_at, updated_at FROM projects WHERE id = ? AND user_id = ?',
        [projectId, userId],
        (err, project) => {
          if (err) {
            console.error('Error fetching updated project:', err);
            return res.json({ success: true, message: 'Project updated successfully' });
          }
          
          // Extract priority from description for response
          let responseDescription = project.description || '';
          let responsePriority = 'medium';
          
          const priorityMatch = responseDescription.match(/\[Priority: (low|medium|high|urgent)\]/);
          if (priorityMatch) {
            responsePriority = priorityMatch[1];
            responseDescription = responseDescription.replace(/\s*\[Priority: (low|medium|high|urgent)\]/, '').trim();
          }
          
          const updatedProject = {
            id: project.id,
            name: project.name,
            budget: project.budget,
            status: project.status,
            priority: responsePriority,
            description: responseDescription,
            created_at: new Date(project.created_at).toISOString(),
            updated_at: new Date(project.updated_at).toISOString()
          };
          
          console.log(`📝 Updated project ${projectId} for user ${userId}`);
          res.json({ 
            success: true, 
            message: 'Project updated successfully',
            project: updatedProject
          });
        }
      );
    }
  );
});

// Quotes API Endpoints

// Get all quotes for the authenticated user
app.get('/api/quotes', requireAuth, (req, res) => {
  console.log('🔍 GET /api/quotes - Fetching quotes for user:', req.session.userId);
  
  db.all(
    `SELECT 
      id, 
      quoteName, 
      status, 
      timeToDevelop, 
      variancePercentage, 
      quoteTotal, 
      budget, 
      created_at, 
      updated_at 
    FROM quotes 
    WHERE user_id = ? 
    ORDER BY created_at DESC`,
    [req.session.userId],
    (err, quotes) => {
      if (err) {
        console.error('❌ Database error fetching quotes:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch quotes',
          details: err.message 
        });
      }

      console.log(`✅ Found ${quotes.length} quotes for user ${req.session.userId}`);
      res.json({
        success: true,
        quotes: quotes || [],
        count: quotes ? quotes.length : 0
      });
    }
  );
});

// Create a new quote for the authenticated user
app.post('/api/quotes', requireAuth, (req, res) => {
  console.log('🔍 POST /api/quotes - Request received for user:', req.session.userId);
  console.log('Request body:', req.body);
  
  const { 
    quoteName, 
    status = 'Draft', 
    timeToDevelop = '', 
    variancePercentage = 0, 
    quoteTotal = 0, 
    budget = 0 
  } = req.body;

  // Validation
  if (!quoteName || quoteName.trim() === '') {
    console.log('❌ Validation failed: Quote name is required');
    return res.status(400).json({ 
      success: false, 
      error: 'Quote name is required' 
    });
  }

  const userId = req.session.userId;
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO quotes (
      quoteName, 
      status, 
      timeToDevelop, 
      variancePercentage, 
      quoteTotal, 
      budget, 
      user_id, 
      created_at, 
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      quoteName.trim(), 
      status, 
      timeToDevelop, 
      variancePercentage, 
      quoteTotal, 
      budget, 
      userId, 
      now, 
      now
    ],
    function (err) {
      if (err) {
        console.error('❌ Database error creating quote:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to create quote',
          details: err.message 
        });
      }

      // Fetch the newly created quote to return it
      db.get(
        `SELECT 
          id, 
          quoteName, 
          status, 
          timeToDevelop, 
          variancePercentage, 
          quoteTotal, 
          budget, 
          created_at, 
          updated_at 
        FROM quotes 
        WHERE id = ?`,
        [this.lastID],
        (selectErr, quote) => {
          if (selectErr) {
            console.error('❌ Error fetching created quote:', selectErr);
            return res.status(500).json({ 
              success: false, 
              error: 'Quote created but failed to retrieve',
              details: selectErr.message 
            });
          }

          console.log('✅ Quote created successfully:', quote);
          res.status(201).json({
            success: true,
            message: 'Quote created successfully',
            quote: quote
          });
        }
      );
    }
  );
});

// Update an existing quote for the authenticated user
app.put('/api/quotes/:id', requireAuth, (req, res) => {
  console.log('🔍 PUT /api/quotes/:id - Request received for user:', req.session.userId);
  console.log('Quote ID:', req.params.id);
  console.log('Request body:', req.body);
  
  const quoteId = parseInt(req.params.id);
  const { 
    quoteName, 
    status, 
    timeToDevelop, 
    variancePercentage, 
    quoteTotal, 
    budget 
  } = req.body;

  // Validation
  if (!quoteName || quoteName.trim() === '') {
    console.log('❌ Validation failed: Quote name is required');
    return res.status(400).json({ 
      success: false, 
      error: 'Quote name is required' 
    });
  }

  if (!quoteId || isNaN(quoteId)) {
    console.log('❌ Validation failed: Invalid quote ID');
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid quote ID' 
    });
  }

  const userId = req.session.userId;
  const now = new Date().toISOString();

  // First check if the quote exists and belongs to the user
  db.get(
    'SELECT id FROM quotes WHERE id = ? AND user_id = ?',
    [quoteId, userId],
    (err, existingQuote) => {
      if (err) {
        console.error('❌ Database error checking quote ownership:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to verify quote ownership',
          details: err.message 
        });
      }

      if (!existingQuote) {
        console.log('❌ Quote not found or access denied');
        return res.status(404).json({ 
          success: false, 
          error: 'Quote not found or access denied' 
        });
      }

      // Update the quote
      db.run(
        `UPDATE quotes SET 
          quoteName = ?, 
          status = ?, 
          timeToDevelop = ?, 
          variancePercentage = ?, 
          quoteTotal = ?, 
          budget = ?, 
          updated_at = ?
        WHERE id = ? AND user_id = ?`,
        [
          quoteName.trim(), 
          status || 'Draft', 
          timeToDevelop || '', 
          variancePercentage || 0, 
          quoteTotal || 0, 
          budget || 0, 
          now,
          quoteId, 
          userId
        ],
        function (err) {
          if (err) {
            console.error('❌ Database error updating quote:', err);
            return res.status(500).json({ 
              success: false, 
              error: 'Failed to update quote',
              details: err.message 
            });
          }

          if (this.changes === 0) {
            console.log('❌ No rows were updated');
            return res.status(404).json({ 
              success: false, 
              error: 'Quote not found or no changes made' 
            });
          }

          // Fetch the updated quote to return it
          db.get(
            `SELECT 
              id, 
              quoteName, 
              status, 
              timeToDevelop, 
              variancePercentage, 
              quoteTotal, 
              budget, 
              created_at, 
              updated_at 
            FROM quotes 
            WHERE id = ?`,
            [quoteId],
            (selectErr, updatedQuote) => {
              if (selectErr) {
                console.error('❌ Error fetching updated quote:', selectErr);
                return res.status(500).json({ 
                  success: false, 
                  error: 'Quote updated but failed to retrieve',
                  details: selectErr.message 
                });
              }

              console.log('✅ Quote updated successfully:', updatedQuote);
              res.json({
                success: true,
                message: 'Quote updated successfully',
                quote: updatedQuote
              });
            }
          );
        }
      );
    }
  );
});

// Delete a quote for the authenticated user
app.delete('/api/quotes/:id', requireAuth, (req, res) => {
  console.log('🔍 DELETE /api/quotes/:id - Request received for user:', req.session.userId);
  console.log('Quote ID:', req.params.id);
  
  const quoteId = parseInt(req.params.id);
  const userId = req.session.userId;

  if (!quoteId || isNaN(quoteId)) {
    console.log('❌ Validation failed: Invalid quote ID');
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid quote ID' 
    });
  }

  // First check if the quote exists and belongs to the user
  db.get(
    'SELECT id, quoteName FROM quotes WHERE id = ? AND user_id = ?',
    [quoteId, userId],
    (err, existingQuote) => {
      if (err) {
        console.error('❌ Database error checking quote ownership:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to verify quote ownership',
          details: err.message 
        });
      }

      if (!existingQuote) {
        console.log('❌ Quote not found or access denied');
        return res.status(404).json({ 
          success: false, 
          error: 'Quote not found or access denied' 
        });
      }

      // Delete the quote
      db.run(
        'DELETE FROM quotes WHERE id = ? AND user_id = ?',
        [quoteId, userId],
        function (err) {
          if (err) {
            console.error('❌ Database error deleting quote:', err);
            return res.status(500).json({ 
              success: false, 
              error: 'Failed to delete quote',
              details: err.message 
            });
          }

          if (this.changes === 0) {
            console.log('❌ No rows were deleted');
            return res.status(404).json({ 
              success: false, 
              error: 'Quote not found' 
            });
          }

          console.log(`✅ Quote "${existingQuote.quoteName}" deleted successfully`);
          res.json({
            success: true,
            message: 'Quote deleted successfully',
            deletedQuote: existingQuote
          });
        }
      );
    }
  );
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

// Graceful shutdown mechanism to ensure data persistence
process.on('SIGINT', () => {
  console.log('\n🔄 Received SIGINT signal. Initiating graceful shutdown...');
  
  // Close the SQLite database connection to ensure all pending writes are flushed to disk
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database connection:', err.message);
      process.exit(1);
    } else {
      console.log('✅ Database connection closed. Server shutting down.');
      process.exit(0);
    }
  });
});

// Handle other termination signals for completeness
process.on('SIGTERM', () => {
  console.log('\n🔄 Received SIGTERM signal. Initiating graceful shutdown...');
  
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database connection:', err.message);
      process.exit(1);
    } else {
      console.log('✅ Database connection closed. Server shutting down.');
      process.exit(0);
    }
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
