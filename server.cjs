// This file sets up a simple Express server and SQLite database for user registration
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const { createClient } = require('@supabase/supabase-js');
const { pipeline } = require('@xenova/transformers');
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');
const { Resend } = require('resend');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const WebSocket = require('ws');
const http = require('http');
const Stripe = require('stripe');
const juice = require('juice');
require('dotenv').config();

const app = express();
const PORT = 4000;

// Server start time for detecting restarts
const SERVER_START_TIME = Date.now();

// Create HTTP server for WebSocket integration
const server = http.createServer(app);

// WebSocket server setup
const wss = new WebSocket.Server({ server });

// Map to store active WebSocket connections by user ID
const activeConnections = new Map();

// Helper function to download and save user avatar
async function downloadAndSaveAvatar(avatarUrl, userId) {
  if (!avatarUrl || !avatarUrl.startsWith('http')) {
    console.log('No valid avatar URL provided for user:', userId);
    return null;
  }

  try {
    const extension = '.jpg'; // Default to jpg for Google avatars
    const filename = `user_${userId}${extension}`;
    const localPath = path.join(__dirname, 'uploads', 'avatars', filename);
    const publicUrl = `/uploads/avatars/${filename}`;

    console.log('📥 Downloading avatar for user', userId, 'from:', avatarUrl);

    return new Promise((resolve, reject) => {
      const file = fsSync.createWriteStream(localPath);
      
      https.get(avatarUrl, (response) => {
        if (response.statusCode !== 200) {
          console.error('Failed to download avatar, status:', response.statusCode);
          resolve(null);
          return;
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          console.log('✅ Avatar saved successfully:', publicUrl);
          resolve(publicUrl);
        });

        file.on('error', (err) => {
          console.error('Error saving avatar file:', err);
          fsSync.unlink(localPath, () => {}); // Delete the file on error
          resolve(null);
        });

      }).on('error', (err) => {
        console.error('Error downloading avatar:', err);
        resolve(null);
      });
    });

  } catch (error) {
    console.error('Error in downloadAndSaveAvatar:', error);
    return null;
  }
}

// Initialize Resend client for email sending
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✅ Resend email client initialized');
} else {
  console.warn('⚠️  RESEND_API_KEY not configured - email invitations will be disabled');
}

// Configure multer for file uploads (memory storage for temporary processing)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept text-based files and PDFs
    const allowedTypes = [
      'text/plain',
      'text/markdown',
      'text/csv',
      'application/json',
      'application/pdf'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(txt|md|csv|json|pdf)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only text files (.txt, .md, .csv, .json) and PDF files (.pdf) are supported for AI analysis'));
    }
  }
});

// Configure multer for logo uploads (disk storage)
const logoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/logos');
    },
    filename: (req, file, cb) => {
      // Generate unique filename: userId_timestamp.extension
      const userId = req.session.userId;
      const timestamp = Date.now();
      const extension = path.extname(file.originalname);
      cb(null, `${userId}_${timestamp}${extension}`);
    }
  }),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are supported'));
    }
  }
});

// Initialize Gemini API configuration
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY;
if (GEMINI_API_KEY) {
  console.log('✅ Gemini API key configured for AI analysis');
} else {
  console.warn('⚠️  VITE_GEMINI_API_KEY not configured - AI quote analysis will be disabled');
}

// Initialize Stripe
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  console.log('✅ Stripe configured for payment processing');
} else {
  console.warn('⚠️  STRIPE_SECRET_KEY not configured - subscription features will be disabled');
}

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
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true
}));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Add security headers that work with Firebase auth and Stripe
app.use((req, res, next) => {
  res.header('Cross-Origin-Opener-Policy', 'unsafe-none');
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
    role TEXT DEFAULT 'Member',
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

  // Migration: Add role column to existing users table if it doesn't exist
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error('Error checking users table schema:', err);
      return;
    }
    
    const hasRole = columns.some(col => col.name === 'role');
    if (!hasRole) {
      console.log('Adding role column to users table...');
      db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'Member'`, (err) => {
        if (err) {
          console.error('Error adding role column to users:', err);
        } else {
          console.log('✅ Added role column to users table');
          // Update existing users to have Member role
          db.run(`UPDATE users SET role = 'Member' WHERE role IS NULL`, (err) => {
            if (err) {
              console.error('Error updating existing users with default role:', err);
            } else {
              console.log('✅ Updated existing users with default Member role');
            }
          });
        }
      });
    } else {
      console.log('✅ role column already exists in users table');
    }
  });

  // Migration: Add Stripe subscription columns to existing users table if they don't exist
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error('Error checking users table schema:', err);
      return;
    }

    const hasStripeCustomerId = columns.some(col => col.name === 'stripeCustomerId');
    const hasSubscriptionStatus = columns.some(col => col.name === 'subscriptionStatus');

    if (!hasStripeCustomerId) {
      db.run('ALTER TABLE users ADD COLUMN stripeCustomerId TEXT', (err) => {
        if (err) {
          console.error('Error adding stripeCustomerId column:', err);
        } else {
          console.log('✅ Added stripeCustomerId column to users table');
        }
      });
    } else {
      console.log('✅ stripeCustomerId column already exists in users table');
    }

    if (!hasSubscriptionStatus) {
      db.run('ALTER TABLE users ADD COLUMN subscriptionStatus TEXT DEFAULT "free"', (err) => {
        if (err) {
          console.error('Error adding subscriptionStatus column:', err);
        } else {
          console.log('✅ Added subscriptionStatus column to users table');
          // Update existing users with default subscription status
          db.run('UPDATE users SET subscriptionStatus = "free" WHERE subscriptionStatus IS NULL', (err) => {
            if (err) {
              console.error('Error updating existing users with default subscription status:', err);
            } else {
              console.log('✅ Updated existing users with free subscription status');
            }
          });
        }
      });
    } else {
      console.log('✅ subscriptionStatus column already exists in users table');
    }
  });

  // Migration: Add hasCompletedOnboarding column to existing users table if it doesn't exist
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error('Error checking users table schema:', err);
      return;
    }

    const hasOnboardingFlag = columns.some(col => col.name === 'hasCompletedOnboarding');

    if (!hasOnboardingFlag) {
      db.run('ALTER TABLE users ADD COLUMN hasCompletedOnboarding BOOLEAN DEFAULT 0', (err) => {
        if (err) {
          console.error('Error adding hasCompletedOnboarding column:', err);
        } else {
          console.log('✅ Added hasCompletedOnboarding column to users table');
          // Update existing users with default onboarding status (false)
          db.run('UPDATE users SET hasCompletedOnboarding = 0 WHERE hasCompletedOnboarding IS NULL', (err) => {
            if (err) {
              console.error('Error updating existing users with default onboarding status:', err);
            } else {
              console.log('✅ Updated existing users with default onboarding status');
            }
          });
        }
      });
    } else {
      console.log('✅ hasCompletedOnboarding column already exists in users table');
    }
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
      { name: 'clientName', type: 'TEXT' },
      { name: 'clientEmail', type: 'TEXT' },
      { name: 'timeToDevelop', type: 'TEXT' }, // Keep for backward compatibility
      { name: 'timeToDevelopValue', type: 'INTEGER DEFAULT 0' },
      { name: 'timeToDevelopUnit', type: 'TEXT DEFAULT "Weeks"' },
      { name: 'variancePercentage', type: 'REAL DEFAULT 0' },
      { name: 'quoteTotal', type: 'REAL DEFAULT 0' },
      { name: 'budget', type: 'REAL DEFAULT 0' },
      { name: 'project_id', type: 'INTEGER REFERENCES projects(id)' },
      { name: 'description', type: 'TEXT' },
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS line_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    estimatedCost REAL DEFAULT 0,
    actualCost REAL DEFAULT 0,
    quoteId INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quoteId) REFERENCES quotes (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Create invitations table for team member invitations
  db.run(`CREATE TABLE IF NOT EXISTS invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'Member',
    inviterId INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    email_attempts INTEGER DEFAULT 0,
    last_attempt_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    used_at DATETIME,
    FOREIGN KEY (inviterId) REFERENCES users (id)
  )`);

  // Create notifications table for real-time notifications
  db.run(`CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipientUserId INTEGER NOT NULL,
    message TEXT NOT NULL,
    isRead BOOLEAN DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipientUserId) REFERENCES users (id)
  )`, function() {
    // Add some sample notifications if the table is empty
    db.get('SELECT COUNT(*) as count FROM notifications', (err, result) => {
      if (!err && result.count === 0) {
        console.log('📬 Creating sample notifications...');
        const sampleNotifications = [
          'Welcome to Blueprint! Your notification system is now active.',
          'Your dashboard has been customized for construction project management.',
          'Tip: Create your first project to start tracking budgets and timelines.'
        ];
        
        sampleNotifications.forEach((message, index) => {
          setTimeout(() => {
            db.run('INSERT INTO notifications (recipientUserId, message) VALUES (?, ?)', [1, message]);
          }, index * 1000); // Stagger notifications by 1 second
        });
      }
    });
  });

  // Create change_orders table for tracking change orders on quotes
  db.run(`CREATE TABLE IF NOT EXISTS change_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'Pending',
    quoteId INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quoteId) REFERENCES quotes (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Create cost_codes table for standardized cost categorization (CSI MasterFormat)
  db.run(`CREATE TABLE IF NOT EXISTS cost_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    description TEXT NOT NULL,
    division TEXT,
    is_template BOOLEAN DEFAULT 0,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Create indexes for cost_codes table
  db.run(`CREATE INDEX IF NOT EXISTS idx_cost_codes_user ON cost_codes(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_cost_codes_template ON cost_codes(is_template)`);

  // Create actual_costs table for tracking real expenses against budget
  db.run(`CREATE TABLE IF NOT EXISTS actual_costs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    cost_code_id INTEGER NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    description TEXT,
    vendor_id INTEGER,
    receipt_url TEXT,
    created_by INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    deleted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (cost_code_id) REFERENCES cost_codes (id),
    FOREIGN KEY (vendor_id) REFERENCES vendors (id),
    FOREIGN KEY (created_by) REFERENCES users (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Create indexes for actual_costs table
  db.run(`CREATE INDEX IF NOT EXISTS idx_actual_costs_project ON actual_costs(project_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_actual_costs_code ON actual_costs(cost_code_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_actual_costs_user ON actual_costs(user_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_actual_costs_date ON actual_costs(date)`);

  // Create budget_baselines table for baseline budget freezing
  db.run(`CREATE TABLE IF NOT EXISTS budget_baselines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL UNIQUE,
    baseline_data TEXT NOT NULL,
    frozen_at DATETIME NOT NULL,
    frozen_by INTEGER NOT NULL,
    notes TEXT,
    user_id INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (frozen_by) REFERENCES users (id),
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Insert default company profile if it doesn't exist
  db.run(`INSERT OR IGNORE INTO company_profile (id, company_name) VALUES ('default', 'Company Co')`);

  // Migration: Add email_attempts and last_attempt_at columns to invitations table
  db.all("PRAGMA table_info(invitations)", (err, columns) => {
    if (err) {
      console.error('Error checking invitations table schema:', err);
      return;
    }
    
    const hasEmailAttempts = columns.some(col => col.name === 'email_attempts');
    const hasLastAttempt = columns.some(col => col.name === 'last_attempt_at');
    
    if (!hasEmailAttempts) {
      db.run(`ALTER TABLE invitations ADD COLUMN email_attempts INTEGER DEFAULT 0`, (err) => {
        if (err) {
          console.error('Error adding email_attempts column:', err);
        } else {
          console.log('✅ Added email_attempts column to invitations table');
        }
      });
    }
    
    if (!hasLastAttempt) {
      db.run(`ALTER TABLE invitations ADD COLUMN last_attempt_at DATETIME`, (err) => {
        if (err) {
          console.error('Error adding last_attempt_at column:', err);
        } else {
          console.log('✅ Added last_attempt_at column to invitations table');
        }
      });
    }
    
    if (hasEmailAttempts && hasLastAttempt) {
      console.log('✅ invitations table columns already exist');
    }
  });

  // Check and add missing timestamp columns to vendors table
  db.all("PRAGMA table_info(vendors)", (err, columns) => {
    if (err) {
      console.error('Error checking vendors table columns:', err);
      return;
    }

    const hasCreatedAt = columns.some(col => col.name === 'created_at');
    const hasUpdatedAt = columns.some(col => col.name === 'updated_at');

    if (!hasCreatedAt) {
      db.run(`ALTER TABLE vendors ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
        if (err) {
          console.error('Error adding created_at column to vendors:', err);
        } else {
          console.log('✅ Added created_at column to vendors table');
        }
      });
    }

    if (!hasUpdatedAt) {
      db.run(`ALTER TABLE vendors ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`, (err) => {
        if (err) {
          console.error('Error adding updated_at column to vendors:', err);
        } else {
          console.log('✅ Added updated_at column to vendors table');
        }
      });
    }

    if (hasCreatedAt && hasUpdatedAt) {
      console.log('✅ vendors table timestamp columns already exist');
    }
  });

  // Migration: Add logo_url column to company_profile table if it doesn't exist
  db.all("PRAGMA table_info(company_profile)", (err, columns) => {
    if (err) {
      console.error('Error checking company_profile table info:', err);
      return;
    }
    
    const hasLogoUrl = columns.some(col => col.name === 'logo_url');
    if (!hasLogoUrl) {
      db.run(`ALTER TABLE company_profile ADD COLUMN logo_url TEXT`, (err) => {
        if (err) {
          console.error('Error adding logo_url column to company_profile:', err);
        } else {
          console.log('✅ Added logo_url column to company_profile table');
        }
      });
    } else {
      console.log('✅ logo_url column already exists in company_profile table');
    }
  });

  // Create project_members join table for granular project access control
  db.run(`CREATE TABLE IF NOT EXISTS project_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(projectId, userId),
    FOREIGN KEY (projectId) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
  )`);

  // Create quickbooks_tokens table for secure OAuth token storage
  db.run(`CREATE TABLE IF NOT EXISTS quickbooks_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    realm_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )`);

  // === CORE DATA RELATIONSHIPS SCHEMA MODIFICATIONS ===
  
  // Add total_budget column to projects table
  db.all("PRAGMA table_info(projects)", (err, columns) => {
    if (err) {
      console.error('Error checking projects table schema:', err);
      return;
    }
    
    const hasTotalBudget = columns.some(col => col.name === 'total_budget');
    if (!hasTotalBudget) {
      db.run(`ALTER TABLE projects ADD COLUMN total_budget REAL DEFAULT 0`, (err) => {
        if (err) {
          console.error('Error adding total_budget column:', err);
        } else {
          console.log('✅ total_budget column added to projects table');
        }
      });
    } else {
      console.log('✅ total_budget column already exists in projects table');
    }
  });

  // Add project_id foreign key to quotes table
  db.all("PRAGMA table_info(quotes)", (err, columns) => {
    if (err) {
      console.error('Error checking quotes table schema:', err);
      return;
    }
    
    const hasProjectId = columns.some(col => col.name === 'project_id');
    if (!hasProjectId) {
      db.run(`ALTER TABLE quotes ADD COLUMN project_id INTEGER REFERENCES projects(id)`, (err) => {
        if (err) {
          console.error('Error adding project_id column to quotes:', err);
        } else {
          console.log('✅ project_id foreign key added to quotes table');
        }
      });
    } else {
      console.log('✅ project_id foreign key already exists in quotes table');
    }
  });

  // Add project_id foreign key to line_items table
  db.all("PRAGMA table_info(line_items)", (err, columns) => {
    if (err) {
      console.error('Error checking line_items table schema:', err);
      return;
    }
    
    const hasProjectId = columns.some(col => col.name === 'project_id');
    if (!hasProjectId) {
      db.run(`ALTER TABLE line_items ADD COLUMN project_id INTEGER REFERENCES projects(id)`, (err) => {
        if (err) {
          console.error('Error adding project_id column to line_items:', err);
        } else {
          console.log('✅ project_id foreign key added to line_items table');
        }
      });
    } else {
      console.log('✅ project_id foreign key already exists in line_items table');
    }
  });

  // Add project_id foreign key to change_orders table
  db.all("PRAGMA table_info(change_orders)", (err, columns) => {
    if (err) {
      console.error('Error checking change_orders table schema:', err);
      return;
    }
    
    const hasProjectId = columns.some(col => col.name === 'project_id');
    if (!hasProjectId) {
      db.run(`ALTER TABLE change_orders ADD COLUMN project_id INTEGER REFERENCES projects(id)`, (err) => {
        if (err) {
          console.error('Error adding project_id column to change_orders:', err);
        } else {
          console.log('✅ project_id foreign key added to change_orders table');
        }
      });
    } else {
      console.log('✅ project_id foreign key already exists in change_orders table');
    }
  });

  // Add consistent quote_id column to change_orders table (for API consistency)
  db.all("PRAGMA table_info(change_orders)", (err, columns) => {
    if (err) {
      console.error('Error checking change_orders table schema for quote_id:', err);
      return;
    }
    
    const hasQuoteId = columns.some(col => col.name === 'quote_id');
    if (!hasQuoteId) {
      db.run(`ALTER TABLE change_orders ADD COLUMN quote_id INTEGER REFERENCES quotes(id)`, (err) => {
        if (err) {
          console.error('Error adding quote_id column to change_orders:', err);
        } else {
          console.log('✅ quote_id foreign key added to change_orders table');
          // Copy data from quoteId to quote_id for consistency
          db.run(`UPDATE change_orders SET quote_id = quoteId WHERE quote_id IS NULL`, (err) => {
            if (err) {
              console.error('Error migrating quoteId to quote_id:', err);
            } else {
              console.log('✅ Migrated existing quoteId data to quote_id column');
            }
          });
        }
      });
    } else {
      console.log('✅ quote_id foreign key already exists in change_orders table');
    }
  });

  // Ensure project_members table exists with proper structure
  db.run(`CREATE TABLE IF NOT EXISTS project_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'Member',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(project_id, user_id)
  )`, (err) => {
    if (err) {
      console.error('Error creating project_members table:', err);
    } else {
      console.log('✅ project_members table created/verified');
    }
  });

  // ===== BUDGET VS ACTUALS MIGRATIONS =====

  // Migration: Add cost_code_id to line_items table
  db.all("PRAGMA table_info(line_items)", (err, columns) => {
    if (err) {
      console.error('Error checking line_items table schema:', err);
      return;
    }
    
    const hasCostCodeId = columns.some(col => col.name === 'cost_code_id');
    if (!hasCostCodeId) {
      console.log('🔄 Adding cost_code_id column to line_items table...');
      db.run(`ALTER TABLE line_items ADD COLUMN cost_code_id INTEGER`, (err) => {
        if (err) {
          console.error('Error adding cost_code_id column to line_items:', err);
        } else {
          console.log('✅ Added cost_code_id column to line_items table');
          // Create index for cost_code_id
          db.run(`CREATE INDEX IF NOT EXISTS idx_line_items_cost_code ON line_items(cost_code_id)`, (err) => {
            if (err) {
              console.error('Error creating index on line_items.cost_code_id:', err);
            } else {
              console.log('✅ Created index on line_items.cost_code_id');
            }
          });
        }
      });
    } else {
      console.log('✅ cost_code_id column already exists in line_items table');
    }
  });

  // Migration: Add cost_code_id to change_orders table
  db.all("PRAGMA table_info(change_orders)", (err, columns) => {
    if (err) {
      console.error('Error checking change_orders table schema:', err);
      return;
    }
    
    const hasCostCodeId = columns.some(col => col.name === 'cost_code_id');
    if (!hasCostCodeId) {
      console.log('🔄 Adding cost_code_id column to change_orders table...');
      db.run(`ALTER TABLE change_orders ADD COLUMN cost_code_id INTEGER`, (err) => {
        if (err) {
          console.error('Error adding cost_code_id column to change_orders:', err);
        } else {
          console.log('✅ Added cost_code_id column to change_orders table');
          // Create index for cost_code_id
          db.run(`CREATE INDEX IF NOT EXISTS idx_change_orders_cost_code ON change_orders(cost_code_id)`, (err) => {
            if (err) {
              console.error('Error creating index on change_orders.cost_code_id:', err);
            } else {
              console.log('✅ Created index on change_orders.cost_code_id');
            }
          });
        }
      });
    } else {
      console.log('✅ cost_code_id column already exists in change_orders table');
    }
  });

  // Migration: Seed CSI MasterFormat templates (only once)
  db.get("SELECT COUNT(*) as count FROM cost_codes WHERE is_template = 1", (err, result) => {
    if (err) {
      console.error('Error checking for CSI templates:', err);
      return;
    }

    if (result.count === 0) {
      console.log('🔄 Seeding CSI MasterFormat templates...');
      
      // Load CSI MasterFormat data from file
      const fs = require('fs');
      const path = require('path');
      const csiDataPath = path.join(__dirname, 'scripts', 'csi-masterformat-templates.json');
      
      try {
        const csiData = JSON.parse(fs.readFileSync(csiDataPath, 'utf8'));
        let insertedCount = 0;
        let totalCodes = 0;
        
        csiData.forEach(division => {
          totalCodes += division.codes.length;
          division.codes.forEach(codeItem => {
            db.run(
              `INSERT INTO cost_codes (code, description, division, is_template, user_id) 
               VALUES (?, ?, ?, 1, NULL)`,
              [codeItem.code, codeItem.description, division.division],
              (err) => {
                if (err) {
                  console.error(`Error inserting CSI code ${codeItem.code}:`, err);
                } else {
                  insertedCount++;
                  if (insertedCount === totalCodes) {
                    console.log(`✅ Successfully seeded ${insertedCount} CSI MasterFormat templates`);
                  }
                }
              }
            );
          });
        });
      } catch (error) {
        console.error('Error loading CSI MasterFormat templates:', error);
      }
    } else {
      console.log(`✅ CSI MasterFormat templates already seeded (${result.count} templates found)`);
    }
  });

  // Migration: Create default "Uncategorized" cost code for each user
  db.all("SELECT id FROM users", (err, users) => {
    if (err) {
      console.error('Error fetching users for cost code migration:', err);
      return;
    }

    if (users && users.length > 0) {
      users.forEach(user => {
        // Check if user already has an Uncategorized code
        db.get(
          "SELECT id FROM cost_codes WHERE user_id = ? AND code = '00-00-00'",
          [user.id],
          (err, existingCode) => {
            if (err) {
              console.error(`Error checking for Uncategorized code for user ${user.id}:`, err);
              return;
            }

            if (!existingCode) {
              db.run(
                `INSERT INTO cost_codes (code, description, division, is_template, user_id) 
                 VALUES ('00-00-00', 'Uncategorized', '00 - Uncategorized', 0, ?)`,
                [user.id],
                function(err) {
                  if (err) {
                    console.error(`Error creating Uncategorized code for user ${user.id}:`, err);
                  } else {
                    const uncategorizedCodeId = this.lastID;
                    console.log(`✅ Created Uncategorized cost code for user ${user.id}`);
                    
                    // Assign all existing line items without cost_code_id to Uncategorized
                    db.run(
                      `UPDATE line_items SET cost_code_id = ? WHERE user_id = ? AND cost_code_id IS NULL`,
                      [uncategorizedCodeId, user.id],
                      function(err) {
                        if (err) {
                          console.error(`Error updating line items for user ${user.id}:`, err);
                        } else if (this.changes > 0) {
                          console.log(`✅ Assigned ${this.changes} existing line items to Uncategorized for user ${user.id}`);
                        }
                      }
                    );

                    // Assign all existing change orders without cost_code_id to Uncategorized
                    db.run(
                      `UPDATE change_orders SET cost_code_id = ? WHERE user_id = ? AND cost_code_id IS NULL`,
                      [uncategorizedCodeId, user.id],
                      function(err) {
                        if (err) {
                          console.error(`Error updating change orders for user ${user.id}:`, err);
                        } else if (this.changes > 0) {
                          console.log(`✅ Assigned ${this.changes} existing change orders to Uncategorized for user ${user.id}`);
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      });
    }
  });

  console.log('Database tables created/updated successfully');
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      // Handle user authentication for WebSocket
      if (data.type === 'auth' && data.userId) {
        ws.userId = data.userId;
        activeConnections.set(data.userId, ws);
        console.log(`User ${data.userId} connected via WebSocket`);
        
        // Send confirmation
        ws.send(JSON.stringify({
          type: 'auth_success',
          message: 'WebSocket authenticated successfully'
        }));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  ws.on('close', () => {
    if (ws.userId) {
      activeConnections.delete(ws.userId);
      console.log(`User ${ws.userId} disconnected from WebSocket`);
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Health check endpoint for backend restart detection
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    startTime: SERVER_START_TIME,
    uptime: Date.now() - SERVER_START_TIME,
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!', 
    timestamp: new Date().toISOString(),
    session: req.session.userId ? `User ID: ${req.session.userId}` : 'No session'
  });
});

// DEVELOPMENT ONLY - Test session endpoint to create a session for user 1
app.get('/api/test-session', (req, res) => {
  req.session.userId = 1; // Set session for user ID 1
  req.session.save((err) => {
    if (err) {
      console.error('❌ Error saving test session:', err);
      return res.status(500).json({ error: 'Failed to create test session' });
    }
    console.log('✅ Test session created for user ID 1');
    res.json({ 
      message: 'Test session created successfully!', 
      userId: req.session.userId,
      timestamp: new Date().toISOString()
    });
  });
});

// DEVELOPMENT ONLY - Test login endpoint for Cypress E2E testing
app.post('/api/test/login', async (req, res) => {
  try {
    // Create or get test user for E2E testing
    const testUser = {
      email: 'test@blueprint.com',
      name: 'Test User',
      googleId: 'test-user-cypress',
      provider: 'test',
      profilePictureUrl: null,
      role: 'Admin',
      subscriptionStatus: 'active',
      hasCompletedOnboarding: true
    };

    // Check if test user exists, create if not
    db.get('SELECT * FROM users WHERE email = ?', [testUser.email], (err, existingUser) => {
      if (err) {
        console.error('❌ Error checking for test user:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (existingUser) {
        // User exists, create session
        req.session.userId = existingUser.id;
        req.session.save((err) => {
          if (err) {
            console.error('❌ Error saving test session:', err);
            return res.status(500).json({ error: 'Failed to create test session' });
          }
          console.log('✅ Test login session created for existing user:', existingUser.id);
          res.json({ 
            success: true,
            user: existingUser,
            message: 'Test login successful'
          });
        });
      } else {
        // Create new test user
        db.run(
          `INSERT INTO users (googleId, email, name, profilePictureUrl, provider, role, subscriptionStatus, hasCompletedOnboarding) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [testUser.googleId, testUser.email, testUser.name, testUser.profilePictureUrl, 
           testUser.provider, testUser.role, testUser.subscriptionStatus, testUser.hasCompletedOnboarding],
          function(err) {
            if (err) {
              console.error('❌ Error creating test user:', err);
              return res.status(500).json({ error: 'Failed to create test user' });
            }

            // Create session for new user
            req.session.userId = this.lastID;
            req.session.save((err) => {
              if (err) {
                console.error('❌ Error saving test session:', err);
                return res.status(500).json({ error: 'Failed to create test session' });
              }
              console.log('✅ Test user created and logged in with ID:', this.lastID);
              res.json({ 
                success: true,
                user: { ...testUser, id: this.lastID },
                message: 'Test user created and logged in successfully'
              });
            });
          }
        );
      }
    });
  } catch (error) {
    console.error('❌ Error in test login endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Notification helper functions
const createNotification = (userId, message) => {
  // Save notification to database
  db.run(
    'INSERT INTO notifications (recipientUserId, message) VALUES (?, ?)',
    [userId, message],
    function(err) {
      if (err) {
        console.error('Error creating notification:', err);
        return;
      }
      
      const notificationId = this.lastID;
      console.log(`Notification created: ID ${notificationId} for user ${userId}`);
      
      // Check if user is connected via WebSocket and send real-time notification
      const userConnection = activeConnections.get(userId);
      if (userConnection && userConnection.readyState === WebSocket.OPEN) {
        userConnection.send(JSON.stringify({
          type: 'notification',
          data: {
            id: notificationId,
            message: message,
            isRead: false,
            createdAt: new Date().toISOString()
          }
        }));
        console.log(`Real-time notification sent to user ${userId}`);
      }
    }
  );
};

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Role-based access control middleware
const checkPermission = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get the user's role from the database
    db.get(
      'SELECT role FROM users WHERE id = ?',
      [req.session.userId],
      (err, user) => {
        if (err) {
          console.error('Error checking user role:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        const userRole = user.role || 'Member'; // Default to Member if role is null

        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ 
            error: 'Insufficient permissions', 
            required: allowedRoles,
            current: userRole 
          });
        }

        // Add user role to request object for further use
        req.userRole = userRole;
        next();
      }
    );
  };
};

// Enhanced permission middleware with granular project access control
const checkProjectAccess = (allowedRoles = ['Admin', 'Member']) => {
  return (req, res, next) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get the user's role from the database
    db.get(
      'SELECT role FROM users WHERE id = ?',
      [req.session.userId],
      (err, user) => {
        if (err) {
          console.error('Error checking user role:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }

        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        const userRole = user.role || 'Member';

        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(userRole)) {
          return res.status(403).json({ 
            error: 'Insufficient permissions', 
            required: allowedRoles,
            current: userRole 
          });
        }

        // Add user role to request object
        req.userRole = userRole;

        // If user is Admin, they have access to all projects
        if (userRole === 'Admin') {
          return next();
        }

        // For non-Admin users, check project-specific access
        const projectId = req.params.projectId || req.params.id;
        const quoteId = req.params.id || req.params.quoteId;
        const itemId = req.params.itemId;
        const changeOrderId = req.params.changeOrderId;

        // Helper function to check project access
        const checkAccess = (projectIdToCheck) => {
          if (!projectIdToCheck) {
            // If no project ID found, allow access (for endpoints that don't relate to specific projects)
            return next();
          }

          db.get(
            'SELECT 1 FROM project_members WHERE projectId = ? AND userId = ?',
            [projectIdToCheck, req.session.userId],
            (err, member) => {
              if (err) {
                console.error('Error checking project access:', err);
                return res.status(500).json({ error: 'Internal server error' });
              }

              if (!member) {
                return res.status(403).json({ 
                  error: 'Access denied: You are not assigned to this project',
                  projectId: projectIdToCheck
                });
              }

              next();
            }
          );
        };

        // Direct project access (e.g., /api/projects/:projectId)
        if (projectId) {
          return checkAccess(parseInt(projectId));
        }

        // Quote-based access - need to find the project through quotes
        if (quoteId) {
          db.get(
            'SELECT p.id as projectId FROM quotes q JOIN projects p ON q.user_id = p.user_id WHERE q.id = ?',
            [quoteId],
            (err, result) => {
              if (err) {
                console.error('Error finding project for quote:', err);
                return res.status(500).json({ error: 'Internal server error' });
              }

              if (!result) {
                return res.status(404).json({ error: 'Quote not found' });
              }

              checkAccess(result.projectId);
            }
          );
          return;
        }

        // Line item access - need to find project through quote
        if (itemId) {
          db.get(
            `SELECT p.id as projectId 
             FROM line_items li 
             JOIN quotes q ON li.quoteId = q.id 
             JOIN projects p ON q.user_id = p.user_id 
             WHERE li.id = ?`,
            [itemId],
            (err, result) => {
              if (err) {
                console.error('Error finding project for line item:', err);
                return res.status(500).json({ error: 'Internal server error' });
              }

              if (!result) {
                return res.status(404).json({ error: 'Line item not found' });
              }

              checkAccess(result.projectId);
            }
          );
          return;
        }

        // Change order access - need to find project through quote
        if (changeOrderId) {
          db.get(
            `SELECT p.id as projectId 
             FROM change_orders co 
             JOIN quotes q ON co.quoteId = q.id 
             JOIN projects p ON q.user_id = p.user_id 
             WHERE co.id = ?`,
            [changeOrderId],
            (err, result) => {
              if (err) {
                console.error('Error finding project for change order:', err);
                return res.status(500).json({ error: 'Internal server error' });
              }

              if (!result) {
                return res.status(404).json({ error: 'Change order not found' });
              }

              checkAccess(result.projectId);
            }
          );
          return;
        }

        // If no specific project context found, allow access
        next();
      }
    );
  };
};

// Get current user profile
app.get('/api/me', requireAuth, (req, res) => {
  db.get(
    `SELECT 
      u.id, u.googleId, u.email, u.name, u.profilePictureUrl, u.provider, 
      u.role, u.hasCompletedOnboarding, u.subscriptionStatus, u.stripeCustomerId,
      cp.company_name as companyName
     FROM users u 
     LEFT JOIN company_profile cp ON u.id = cp.user_id 
     WHERE u.id = ?`,
    [req.session.userId],
    (err, user) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!user) return res.status(404).json({ error: 'User not found' });
      // Ensure role has a default value
      if (!user.role) {
        user.role = 'Member';
      }
      // Ensure hasCompletedOnboarding has a default value
      if (user.hasCompletedOnboarding === null || user.hasCompletedOnboarding === undefined) {
        user.hasCompletedOnboarding = 0;
      }
      // Ensure subscriptionStatus has a default value
      if (!user.subscriptionStatus) {
        user.subscriptionStatus = 'free';
      }
      res.json(user);
    }
  );
});

// Get all users (Admin only - for team member assignment)
app.get('/api/users', checkPermission(['Admin']), (req, res) => {
  console.log('👥 GET /api/users - Fetching all users for user:', req.session.userId);
  
  db.all(
    'SELECT id, name, email, role, profilePictureUrl FROM users ORDER BY name ASC',
    [],
    (err, users) => {
      if (err) {
        console.error('❌ Database error fetching users:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to fetch users' 
        });
      }

      console.log(`✅ Retrieved ${users.length} users`);
      res.json({
        success: true,
        users: users || []
      });
    }
  );
});

// Complete user onboarding
app.post('/api/users/complete-onboarding', requireAuth, (req, res) => {
  db.run(
    'UPDATE users SET hasCompletedOnboarding = 1 WHERE id = ?',
    [req.session.userId],
    function(err) {
      if (err) {
        console.error('Error completing onboarding:', err);
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ success: true, message: 'Onboarding completed successfully' });
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
        // Update existing user - download and save avatar if it's a Google URL
        downloadAndSaveAvatar(profilePictureUrl, existingUser.id).then((localAvatarUrl) => {
          const finalAvatarUrl = localAvatarUrl || profilePictureUrl;
          
          db.run(
            'UPDATE users SET name = ?, email = ?, profilePictureUrl = ?, updated_at = CURRENT_TIMESTAMP WHERE googleId = ?',
            [name, email, finalAvatarUrl, googleId],
            function(err) {
              if (err) {
                console.error('Database error updating user:', err);
                return res.status(500).json({ error: err.message });
              }
              
              console.log('User updated successfully with avatar URL:', finalAvatarUrl);
              // Set session
              req.session.userId = existingUser.id;
              res.json({ 
                success: true, 
                user: { 
                  id: existingUser.id, 
                  googleId, 
                  email, 
                  name, 
                  profilePictureUrl: finalAvatarUrl,
                  provider 
                } 
              });
            }
          );
        });
      } else {
        // Create new user
        console.log('Creating new user...');
        
        // First create the user to get the ID, then download avatar
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
            
            // Download and save avatar for new user
            downloadAndSaveAvatar(profilePictureUrl, newUserId).then((localAvatarUrl) => {
              const finalAvatarUrl = localAvatarUrl || profilePictureUrl;
              
              // Update user with local avatar URL if download was successful
              if (localAvatarUrl) {
                db.run(
                  'UPDATE users SET profilePictureUrl = ? WHERE id = ?',
                  [finalAvatarUrl, newUserId],
                  (err) => {
                    if (err) console.error('Error updating user avatar URL:', err);
                    else console.log('Avatar URL updated for new user:', newUserId);
                  }
                );
              }
              
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
                  profilePictureUrl: finalAvatarUrl,
                  provider 
                } 
              });
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
    'SELECT company_name, logo_url FROM company_profile WHERE user_id = ?', 
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
            res.json({ company_name: 'Company Co', logo_url: null });
          }
        );
      } else {
        res.json({ 
          company_name: row.company_name,
          logo_url: row.logo_url 
        });
      }
    }
  );
});

// Update company profile
app.post('/api/company-profile', checkPermission(['Admin']), (req, res) => {
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

// Upload company logo (Admin only)
app.post('/api/company-profile/logo', checkPermission(['Admin']), logoUpload.single('logo'), (req, res) => {
  console.log('📤 POST /api/company-profile/logo - Logo upload request from user:', req.session.userId);
  
  if (!req.file) {
    console.error('❌ No file uploaded');
    return res.status(400).json({ error: 'No logo file provided' });
  }

  const userId = req.session.userId;
  const logoUrl = `/uploads/logos/${req.file.filename}`;
  
  console.log('📸 Logo uploaded:', req.file.filename, 'Size:', req.file.size, 'bytes');

  // Update the company profile with the new logo URL
  db.run(
    'UPDATE company_profile SET logo_url = ? WHERE user_id = ?',
    [logoUrl, userId],
    function(err) {
      if (err) {
        console.error('❌ Error updating logo_url in database:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (this.changes === 0) {
        // Create company profile if it doesn't exist
        db.run(
          'INSERT INTO company_profile (id, company_name, logo_url, user_id) VALUES (?, ?, ?, ?)',
          [`user_${userId}`, 'Company Co', logoUrl, userId],
          function(err) {
            if (err) {
              console.error('❌ Error creating company profile with logo:', err);
              return res.status(500).json({ error: err.message });
            }
            console.log('✅ Company profile created with logo for user:', userId);
            res.json({ success: true, logo_url: logoUrl });
          }
        );
      } else {
        console.log('✅ Logo updated successfully for user:', userId);
        res.json({ success: true, logo_url: logoUrl });
      }
    }
  );
});

// Manual avatar download endpoint (for testing/fixing existing users)
app.post('/api/user/download-avatar', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  
  console.log('🔄 Manual avatar download request for user:', userId);
  
  // Get current user data
  db.get(
    'SELECT profilePictureUrl FROM users WHERE id = ?',
    [userId],
    async (err, user) => {
      if (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ error: err.message });
      }
      
      if (!user || !user.profilePictureUrl) {
        return res.status(400).json({ error: 'No profile picture URL found' });
      }
      
      // Download and save avatar
      try {
        const localAvatarUrl = await downloadAndSaveAvatar(user.profilePictureUrl, userId);
        
        if (localAvatarUrl) {
          // Update database with local URL
          db.run(
            'UPDATE users SET profilePictureUrl = ? WHERE id = ?',
            [localAvatarUrl, userId],
            function(err) {
              if (err) {
                console.error('Error updating avatar URL:', err);
                return res.status(500).json({ error: err.message });
              }
              
              console.log('✅ Avatar downloaded and updated for user:', userId);
              res.json({ 
                success: true, 
                message: 'Avatar downloaded successfully',
                avatar_url: localAvatarUrl
              });
            }
          );
        } else {
          res.status(500).json({ error: 'Failed to download avatar' });
        }
      } catch (error) {
        console.error('Error in manual avatar download:', error);
        res.status(500).json({ error: 'Avatar download failed' });
      }
    }
  );
});

// Remove company logo (Admin only)
app.delete('/api/company-profile/logo', checkPermission(['Admin']), (req, res) => {
  console.log('🗑️ DELETE /api/company-profile/logo - Logo removal request from user:', req.session.userId);
  
  const userId = req.session.userId;

  // Get current logo URL first to delete the file
  db.get(
    'SELECT logo_url FROM company_profile WHERE user_id = ?',
    [userId],
    (err, row) => {
      if (err) {
        console.error('❌ Error fetching current logo:', err);
        return res.status(500).json({ error: err.message });
      }

      // Update database to remove logo URL
      db.run(
        'UPDATE company_profile SET logo_url = NULL WHERE user_id = ?',
        [userId],
        function(err) {
          if (err) {
            console.error('❌ Error removing logo_url from database:', err);
            return res.status(500).json({ error: err.message });
          }

          // Delete the physical file if it exists
          if (row && row.logo_url) {
            const fs = require('fs');
            const logoPath = path.join(__dirname, row.logo_url.replace(/^\//, ''));
            
            fs.unlink(logoPath, (unlinkErr) => {
              if (unlinkErr) {
                console.warn('⚠️ Warning: Could not delete logo file:', unlinkErr.message);
                // Don't fail the request if file deletion fails
              } else {
                console.log('🗑️ Logo file deleted:', logoPath);
              }
            });
          }

          console.log('✅ Logo removed successfully for user:', userId);
          res.json({ success: true, message: 'Logo removed successfully' });
        }
      );
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

// Helper function to build enhanced Gemini prompt with few-shot examples
function buildGeminiPrompt(fileContent, fileName) {
  return `You are an expert construction finance analyst. Analyze the following text from a document and extract a quoteName and a list of lineItems. Return ONLY a valid JSON object.

**Example 1:**
Input Text: "Ok, for the main house build, we're looking at framing labor for ten thousand five hundred dollars, and the concrete foundation is gonna be about $15,000."
Output JSON:
{
  "quoteName": "Main House Build",
  "lineItems": [
    { "description": "Framing Labor", "estimatedCost": 10500 },
    { "description": "Concrete Foundation", "estimatedCost": 15000 }
  ]
}

**Example 2:**
Input Text: "Client: John Smith. Project: kitchen remodel. costs roughtly as follows countertop installation 4k... plumbing fixtures 2.5k"
Output JSON:
{
  "quoteName": "John Smith Kitchen Remodel",
  "lineItems": [
    { "description": "Countertop Installation", "estimatedCost": 4000 },
    { "description": "Plumbing Fixtures", "estimatedCost": 2500 }
  ]
}

**Example 3:**
Input Text: "BATHROOM RENOVATION - Materials: tiles $800, vanity cabinet $1200, labor costs: demo 2 days @ $400/day, plumbing $600"
Output JSON:
{
  "quoteName": "Bathroom Renovation",
  "lineItems": [
    { "description": "Tiles", "estimatedCost": 800 },
    { "description": "Vanity Cabinet", "estimatedCost": 1200 },
    { "description": "Demolition (2 days)", "estimatedCost": 800 },
    { "description": "Plumbing", "estimatedCost": 600 }
  ]
}

**Example 4:**
Input Text: "Roofing job estimate. shingles about 3500 bucks. gutters roughly $1800. Installation labor approx 2800"
Output JSON:
{
  "quoteName": "Roofing Job Estimate",
  "lineItems": [
    { "description": "Shingles", "estimatedCost": 3500 },
    { "description": "Gutters", "estimatedCost": 1800 },
    { "description": "Installation Labor", "estimatedCost": 2800 }
  ]
}

**IMPORTANT RULES:**
- Extract costs from text like "5k", "$5,000", "five thousand", "5 grand" as numeric values
- Generate descriptive quoteName based on project type mentioned
- Include ALL work items, materials, and labor mentioned
- If no costs given, provide realistic construction industry estimates
- Handle messy formatting, typos, and informal language
- Return ONLY valid JSON, no other text

**Task:**
Now, analyze the following text and provide the JSON output in the same format.

DOCUMENT NAME: ${fileName}

Input Text: ${fileContent}

Output JSON:`;
}

// Helper function to call Gemini API for structured data extraction
async function callGeminiAPI(prompt) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', response.status, errorData);
      throw new Error(`Gemini API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Invalid Gemini API response structure:', data);
      throw new Error('Invalid response from Gemini API');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    console.log('🤖 Raw Gemini response:', generatedText);

    // Enhanced JSON parsing with multiple strategies
    let jsonResult = null;
    
    try {
      // Strategy 1: Try to parse the entire response as JSON
      jsonResult = JSON.parse(generatedText);
    } catch (e) {
      // Strategy 2: Extract JSON from text using regex
      let jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Strategy 3: Try to find JSON in code blocks
        jsonMatch = generatedText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1];
        }
      }
      
      if (!jsonMatch) {
        console.error('❌ No JSON found in AI response:', generatedText);
        throw new Error('The AI could not understand the document. Please try with a clearer document or different format.');
      }

      try {
        jsonResult = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        console.error('❌ JSON parsing failed:', parseError);
        console.error('❌ Attempted to parse:', jsonMatch[0]);
        throw new Error('The AI response was malformed. Please try again.');
      }
    }
    
    // Enhanced validation with detailed error messages
    if (!jsonResult || typeof jsonResult !== 'object') {
      throw new Error('The AI could not understand the document structure.');
    }

    if (!jsonResult.quoteName || typeof jsonResult.quoteName !== 'string' || jsonResult.quoteName.trim() === '') {
      throw new Error('The AI could not identify a project name from the document.');
    }

    if (!jsonResult.lineItems || !Array.isArray(jsonResult.lineItems)) {
      throw new Error('The AI could not identify line items from the document.');
    }

    if (jsonResult.lineItems.length === 0) {
      throw new Error('No cost items could be extracted from the document. Please ensure the document contains pricing information.');
    }

    // Validate and clean line items
    const validLineItems = [];
    for (let i = 0; i < jsonResult.lineItems.length; i++) {
      const item = jsonResult.lineItems[i];
      
      if (!item.description || typeof item.description !== 'string' || item.description.trim() === '') {
        console.warn(`⚠️ Skipping line item ${i + 1}: missing or invalid description`);
        continue;
      }

      let cost = item.estimatedCost;
      if (typeof cost !== 'number' || isNaN(cost) || cost < 0) {
        console.warn(`⚠️ Line item "${item.description}": invalid cost (${cost}), setting to 0`);
        cost = 0;
      }

      validLineItems.push({
        description: item.description.trim(),
        estimatedCost: Math.round(cost * 100) / 100 // Round to 2 decimal places
      });
    }

    if (validLineItems.length === 0) {
      throw new Error('No valid cost items could be extracted from the document.');
    }

    const result = {
      quoteName: jsonResult.quoteName.trim(),
      lineItems: validLineItems
    };

    console.log('✅ Successfully parsed and validated AI response:', {
      quoteName: result.quoteName,
      lineItemCount: result.lineItems.length,
      totalCost: result.lineItems.reduce((sum, item) => sum + item.estimatedCost, 0)
    });

    return result;

  } catch (error) {
    console.error('❌ Gemini API call failed:', error);
    throw error;
  }
}

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
app.post('/api/projects', checkPermission(['Admin', 'Member']), (req, res) => {
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
      
      // Create notification for new project
      createNotification(userId, `New project "${projectData.name}" has been created`);
      
      res.status(201).json({ 
        success: true, 
        message: 'Project created successfully',
        project: newProject 
      });
    }
  );
});

// Get single project with related data for the authenticated user (PROJECT COMMAND CENTER)
app.get('/api/projects/:projectId', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { projectId } = req.params;
  
  // First, get the project details including total_budget
  db.get(
    'SELECT id, name, budget, status, description, total_budget, created_at, updated_at FROM projects WHERE id = ? AND user_id = ?',
    [projectId, userId],
    (err, project) => {
      if (err) {
        console.error('Database error fetching project:', err);
        return res.status(500).json({ error: 'Failed to fetch project' });
      }
      
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }
      
      // Extract priority from description
      let description = project.description || '';
      let priority = 'medium';
      const priorityMatch = description.match(/\[Priority: (low|medium|high|urgent)\]/);
      if (priorityMatch) {
        priority = priorityMatch[1];
        description = description.replace(/\s*\[Priority: (low|medium|high|urgent)\]/, '').trim();
      }
      
      // Format the project data
      const projectData = {
        id: project.id,
        name: project.name,
        budget: project.budget,
        total_budget: project.total_budget || 0,
        status: project.status,
        priority: priority,
        description: description,
        created_at: new Date(project.created_at).toISOString(),
        updated_at: new Date(project.updated_at || project.created_at).toISOString()
      };
      
      // Get PROJECT-SPECIFIC quotes (only quotes linked to this project)
      console.log(`🔍 Fetching quotes for project ${projectId}, user ${userId}`);
      db.all(
        'SELECT id, quoteName, status, quoteTotal, project_id, created_at FROM quotes WHERE project_id = ? AND user_id = ? ORDER BY created_at DESC',
        [projectId, userId],
        (err, quotes) => {
          if (err) {
            console.error('Database error fetching project quotes:', err);
            quotes = [];
          } else {
            console.log(`📊 Found ${quotes.length} quotes for project ${projectId}:`, quotes.map(q => ({ id: q.id, name: q.quoteName, project_id: q.project_id, total: q.quoteTotal })));
          }
          
          // Calculate project-specific KPIs
          const totalQuotes = quotes.length;
          const quoteValue = quotes.reduce((sum, quote) => sum + (quote.quoteTotal || 0), 0);
          const completedQuotes = quotes.filter(quote => quote.status === 'Completed').length;
          const committedBudget = quotes
            .filter(quote => quote.status && quote.status.toLowerCase() === 'approved')
            .reduce((sum, quote) => sum + (quote.quoteTotal || 0), 0);
          
          // Get project members (using correct column names)
          db.all(
            'SELECT u.id, u.name, u.email, u.role FROM users u INNER JOIN project_members pm ON u.id = pm.userId WHERE pm.projectId = ?',
            [projectId],
            (err, members) => {
              if (err) {
                console.error('Database error fetching project members:', err);
                members = [];
              } else {
                console.log(`👥 Found ${members.length} members for project ${projectId}:`, members.map(m => ({ id: m.id, name: m.name, email: m.email })));
              }
              
              // Get PROJECT-SPECIFIC change orders (via quotes linked to this project)
              db.all(
                'SELECT co.id, co.description, co.amount, co.status, co.created_at, q.quoteName, q.id as quoteId FROM change_orders co INNER JOIN quotes q ON (co.quote_id = q.id OR co.quoteId = q.id) WHERE q.project_id = ? AND q.user_id = ? ORDER BY co.created_at DESC LIMIT 10',
                [projectId, userId],
                (err, changeOrders) => {
                  if (err) {
                    console.error('Database error fetching project change orders:', err);
                    changeOrders = [];
                  }
                  
                  const pendingChangeOrders = changeOrders.filter(co => co.status === 'pending').length;
                  
                  // ===== BUDGET VS ACTUALS AGGREGATION (Phase 3) =====
                  
                  // Step 1: Get budgeted amounts by cost code (from approved quotes + change orders)
                  const budgetQuery = `
                    SELECT 
                      cc.id as cost_code_id,
                      cc.code,
                      cc.description,
                      cc.division,
                      COALESCE(SUM(li.estimatedCost), 0) as line_items_budget,
                      COUNT(DISTINCT li.id) as line_item_count
                    FROM cost_codes cc
                    LEFT JOIN line_items li ON li.cost_code_id = cc.id
                    LEFT JOIN quotes q ON li.quoteId = q.id
                    WHERE (q.project_id = ? AND q.status = 'Approved' AND q.user_id = ?)
                       OR cc.id IN (
                         SELECT DISTINCT cost_code_id FROM line_items 
                         WHERE quoteId IN (SELECT id FROM quotes WHERE project_id = ? AND status = 'Approved')
                       )
                    GROUP BY cc.id
                  `;

                  db.all(budgetQuery, [projectId, userId, projectId], (err, budgetByCode) => {
                    if (err) {
                      console.error('Error calculating budget by code:', err);
                      budgetByCode = [];
                    }

                    // Step 2: Get change orders by cost code
                    const changeOrdersBudgetQuery = `
                      SELECT 
                        co.cost_code_id,
                        COALESCE(SUM(co.amount), 0) as change_orders_total
                      FROM change_orders co
                      INNER JOIN quotes q ON co.quoteId = q.id
                      WHERE q.project_id = ? AND co.status = 'Approved' AND q.user_id = ?
                      GROUP BY co.cost_code_id
                    `;

                    db.all(changeOrdersBudgetQuery, [projectId, userId], (err, changeOrdersByCode) => {
                      if (err) {
                        console.error('Error calculating change orders by code:', err);
                        changeOrdersByCode = [];
                      }

                      // Step 3: Get actual costs by cost code
                      const actualsQuery = `
                        SELECT 
                          cost_code_id,
                          COALESCE(SUM(amount), 0) as actual_amount,
                          COUNT(id) as expense_count
                        FROM actual_costs
                        WHERE project_id = ? AND user_id = ? AND deleted_at IS NULL
                        GROUP BY cost_code_id
                      `;

                      db.all(actualsQuery, [projectId, userId], (err, actualsByCode) => {
                        if (err) {
                          console.error('Error calculating actuals by code:', err);
                          actualsByCode = [];
                        }

                        // Step 4: Combine and calculate variance
                        const budgetMap = new Map();
                        const changeOrderMap = new Map();
                        const actualsMap = new Map();

                        budgetByCode.forEach(item => {
                          budgetMap.set(item.cost_code_id, item);
                        });

                        changeOrdersByCode.forEach(item => {
                          changeOrderMap.set(item.cost_code_id, item.change_orders_total);
                        });

                        actualsByCode.forEach(item => {
                          actualsMap.set(item.cost_code_id, item);
                        });

                        // Get all unique cost code IDs
                        const allCostCodeIds = new Set([
                          ...budgetMap.keys(),
                          ...actualsMap.keys()
                        ]);

                        const budgetVsActuals = [];
                        let totalBudgeted = 0;
                        let totalActual = 0;

                        allCostCodeIds.forEach(costCodeId => {
                          const budgetItem = budgetMap.get(costCodeId) || { 
                            code: 'Unknown', 
                            description: 'Unknown Code', 
                            division: null,
                            line_items_budget: 0 
                          };
                          const changeOrderAmount = changeOrderMap.get(costCodeId) || 0;
                          const actualItem = actualsMap.get(costCodeId) || { actual_amount: 0, expense_count: 0 };

                          const budgetedAmount = budgetItem.line_items_budget + changeOrderAmount;
                          const actualAmount = actualItem.actual_amount;
                          const variance = budgetedAmount - actualAmount;
                          const variancePercent = budgetedAmount > 0 ? (variance / budgetedAmount) * 100 : 0;

                          // Determine status
                          let status = 'on_budget';
                          if (variancePercent < -5) {
                            status = 'over_budget';
                          } else if (variancePercent > 5) {
                            status = 'under_budget';
                          }

                          if (budgetedAmount > 0 || actualAmount > 0) {
                            budgetVsActuals.push({
                              costCodeId: costCodeId,
                              code: budgetItem.code,
                              description: budgetItem.description,
                              division: budgetItem.division,
                              budgetedAmount: budgetedAmount,
                              actualAmount: actualAmount,
                              variance: variance,
                              variancePercent: variancePercent,
                              status: status,
                              lineItemCount: budgetItem.line_item_count || 0,
                              expenseCount: actualItem.expense_count || 0
                            });

                            totalBudgeted += budgetedAmount;
                            totalActual += actualAmount;
                          }
                        });

                        // Sort by division and code
                        budgetVsActuals.sort((a, b) => {
                          if (a.division !== b.division) {
                            return (a.division || '').localeCompare(b.division || '');
                          }
                          return a.code.localeCompare(b.code);
                        });

                        // Calculate overall budget health
                        const totalVariance = totalBudgeted - totalActual;
                        const totalVariancePercent = totalBudgeted > 0 ? (totalVariance / totalBudgeted) * 100 : 0;
                        
                        let budgetHealth = 'healthy';
                        if (totalVariancePercent < -10) {
                          budgetHealth = 'critical';
                        } else if (totalVariancePercent < -5) {
                          budgetHealth = 'warning';
                        }

                        // Check if baseline is frozen
                        db.get(
                          'SELECT id, frozen_at, frozen_by, notes FROM budget_baselines WHERE project_id = ? AND user_id = ?',
                          [projectId, userId],
                          (err, baseline) => {
                            console.log(`📋 PROJECT COMMAND CENTER: Fetched project ${projectId} with ${totalQuotes} quotes (${quoteValue}), ${members.length} members, ${changeOrders.length} change orders, BvA: ${budgetVsActuals.length} codes`);
                            
                            res.json({
                              success: true,
                              project: projectData,
                              quotes: quotes || [],
                              members: members || [],
                              changeOrders: changeOrders || [],
                              // Project-specific KPIs for the Command Center
                              kpis: {
                                total_quotes: totalQuotes,
                                quote_value: quoteValue,
                                completed_quotes: completedQuotes,
                                pending_change_orders: pendingChangeOrders,
                                total_budget: projectData.total_budget,
                                committed_budget: committedBudget
                              },
                              // Budget vs Actuals Data (Phase 3)
                              budgetVsActuals: budgetVsActuals,
                              budgetSummary: {
                                totalBudget: totalBudgeted,
                                totalActual: totalActual,
                                totalVariance: totalVariance,
                                variancePercent: totalVariancePercent,
                                baselineFrozen: !!baseline,
                                budgetHealth: budgetHealth,
                                baseline: baseline || null
                              }
                            });
                          }
                        );
                      });
                    });
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// Bulk operations on projects (MUST come before /:projectId routes)
app.patch('/api/projects/bulk', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { projectIds, action, updates } = req.body;
  
  console.log(`🔄 PATCH /api/projects/bulk - User ${userId} performing action: ${action} on ${projectIds?.length} projects`);
  
  if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
    return res.status(400).json({ success: false, error: 'Invalid project IDs' });
  }
  
  if (action === 'delete') {
    const placeholders = projectIds.map(() => '?').join(',');
    db.run(
      `DELETE FROM projects WHERE id IN (${placeholders}) AND user_id = ?`,
      [...projectIds, userId],
      function (err) {
        if (err) {
          console.error('❌ Failed to bulk delete projects:', err);
          return res.status(500).json({ success: false, error: 'Failed to delete projects' });
        }
        console.log(`✅ Bulk deleted ${this.changes} projects`);
        res.json({ success: true, deletedCount: this.changes, message: `${this.changes} project(s) deleted successfully` });
      }
    );
  } else if (action === 'updateStatus') {
    const placeholders = projectIds.map(() => '?').join(',');
    db.run(
      `UPDATE projects SET status = ?, updated_at = datetime('now') WHERE id IN (${placeholders}) AND user_id = ?`,
      [updates.status, ...projectIds, userId],
      function (err) {
        if (err) {
          console.error('❌ Failed to bulk update status:', err);
          return res.status(500).json({ success: false, error: 'Failed to update project status' });
        }
        console.log(`✅ Bulk updated status for ${this.changes} projects`);
        res.json({ success: true, updatedCount: this.changes, message: `${this.changes} project(s) updated successfully` });
      }
    );
  } else if (action === 'updatePriority') {
    const placeholders = projectIds.map(() => '?').join(',');
    db.run(
      `UPDATE projects SET description = CASE 
        WHEN description LIKE '%[Priority:%' THEN 
          REPLACE(SUBSTR(description, 1, INSTR(description, '[Priority:') - 1) || SUBSTR(description, INSTR(description, ']') + 1), '  ', ' ')
        ELSE description
      END || ' [Priority: ' || ? || ']',
      updated_at = datetime('now')
      WHERE id IN (${placeholders}) AND user_id = ?`,
      [updates.priority, ...projectIds, userId],
      function (err) {
        if (err) {
          console.error('❌ Failed to bulk update priority:', err);
          return res.status(500).json({ success: false, error: 'Failed to update project priority' });
        }
        console.log(`✅ Bulk updated priority for ${this.changes} projects`);
        res.json({ success: true, updatedCount: this.changes, message: `${this.changes} project(s) updated successfully` });
      }
    );
  } else {
    return res.status(400).json({ success: false, error: 'Invalid action' });
  }
});

// DELETE a project (only owner can delete)
app.delete('/api/projects/:projectId', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { projectId } = req.params;
  
  console.log(`🗑️ DELETE /api/projects/${projectId} - User ${userId} attempting to delete project`);
  
  // Get project to check ownership
  db.get(
    'SELECT id, name, user_id FROM projects WHERE id = ? AND user_id = ?',
    [projectId, userId],
    (err, project) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ success: false, error: 'Database error' });
      }
      
      if (!project) {
        console.log('❌ Project not found or access denied');
        return res.status(404).json({ success: false, error: 'Project not found or access denied' });
      }
      
      // Delete project (CASCADE will handle related data)
      db.run(
        'DELETE FROM projects WHERE id = ? AND user_id = ?',
        [projectId, userId],
        function (err) {
          if (err) {
            console.error('❌ Failed to delete project:', err);
            return res.status(500).json({ success: false, error: 'Failed to delete project' });
          }
          
          console.log(`✅ Project "${project.name}" (ID: ${projectId}) deleted successfully`);
          res.json({ success: true, message: `Project "${project.name}" deleted successfully` });
        }
      );
    }
  );
});

// Update project status (useful for AI actions)
app.patch('/api/projects/:projectId', checkProjectAccess(['Admin', 'Member']), (req, res) => {
  const userId = req.session.userId;
  const { projectId } = req.params;
  const { status, budget, description, priority, name, total_budget } = req.body;
  
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
  if (total_budget !== undefined) {
    updates.push('total_budget = ?');
    values.push(total_budget);
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
        'SELECT id, name, budget, status, description, total_budget, created_at, updated_at FROM projects WHERE id = ? AND user_id = ?',
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
            total_budget: project.total_budget || 0,
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

// Project Members API Endpoints (Granular Access Control)

// Assign a user to a project (Admin only)
app.post('/api/projects/:projectId/members', checkPermission(['Admin']), (req, res) => {
  const projectId = parseInt(req.params.projectId);
  const { userId } = req.body;
  const adminUserId = req.session.userId;

  console.log(`🔍 POST /api/projects/${projectId}/members - Assigning user ${userId} to project`);

  // Validate input
  if (!userId || !Number.isInteger(parseInt(userId))) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }

  if (!Number.isInteger(projectId)) {
    return res.status(400).json({ error: 'Valid projectId is required' });
  }

  // First, verify the project exists and belongs to the admin's organization
  db.get(
    'SELECT id, name FROM projects WHERE id = ? AND user_id = ?',
    [projectId, adminUserId],
    (err, project) => {
      if (err) {
        console.error('Error checking project:', err);
        return res.status(500).json({ error: err.message });
      }

      if (!project) {
        return res.status(404).json({ error: 'Project not found or access denied' });
      }

      // Then verify the user exists and belongs to the same organization (admin's team)
      db.get(
        'SELECT id, name, email FROM users WHERE id = ?',
        [userId],
        (err, user) => {
          if (err) {
            console.error('Error checking user:', err);
            return res.status(500).json({ error: err.message });
          }

          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }

          // Insert the project member relationship (ignore if already exists due to UNIQUE constraint)
          db.run(
            'INSERT OR IGNORE INTO project_members (projectId, userId) VALUES (?, ?)',
            [projectId, userId],
            function(err) {
              if (err) {
                console.error('Error assigning user to project:', err);
                return res.status(500).json({ error: err.message });
              }

              if (this.changes > 0) {
                console.log(`✅ User ${userId} (${user.name}) assigned to project ${projectId} (${project.name})`);
                
                // Create notification for the assigned user
                createNotification(userId, `You have been assigned to project: ${project.name}`);
                
                res.json({ 
                  success: true, 
                  message: `${user.name} has been assigned to ${project.name}`,
                  assignment: {
                    projectId,
                    userId,
                    projectName: project.name,
                    userName: user.name,
                    userEmail: user.email
                  }
                });
              } else {
                res.json({ 
                  success: true, 
                  message: `${user.name} is already assigned to ${project.name}`,
                  assignment: {
                    projectId,
                    userId,
                    projectName: project.name,
                    userName: user.name,
                    userEmail: user.email
                  }
                });
              }
            }
          );
        }
      );
    }
  );
});

// Remove a user from a project (Admin only)
app.delete('/api/projects/:projectId/members/:userId', checkPermission(['Admin']), (req, res) => {
  const projectId = parseInt(req.params.projectId);
  const userId = parseInt(req.params.userId);
  const adminUserId = req.session.userId;

  console.log(`🔍 DELETE /api/projects/${projectId}/members/${userId} - Removing user from project`);

  // Validate input
  if (!Number.isInteger(projectId) || !Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Valid projectId and userId are required' });
  }

  // First, verify the project exists and belongs to the admin's organization
  db.get(
    'SELECT id, name FROM projects WHERE id = ? AND user_id = ?',
    [projectId, adminUserId],
    (err, project) => {
      if (err) {
        console.error('Error checking project:', err);
        return res.status(500).json({ error: err.message });
      }

      if (!project) {
        return res.status(404).json({ error: 'Project not found or access denied' });
      }

      // Get user info for the response
      db.get(
        'SELECT id, name, email FROM users WHERE id = ?',
        [userId],
        (err, user) => {
          if (err) {
            console.error('Error checking user:', err);
            return res.status(500).json({ error: err.message });
          }

          if (!user) {
            return res.status(404).json({ error: 'User not found' });
          }

          // Remove the project member relationship
          db.run(
            'DELETE FROM project_members WHERE projectId = ? AND userId = ?',
            [projectId, userId],
            function(err) {
              if (err) {
                console.error('Error removing user from project:', err);
                return res.status(500).json({ error: err.message });
              }

              if (this.changes > 0) {
                console.log(`✅ User ${userId} (${user.name}) removed from project ${projectId} (${project.name})`);
                
                // Create notification for the removed user
                createNotification(userId, `You have been removed from project: ${project.name}`);
                
                res.json({ 
                  success: true, 
                  message: `${user.name} has been removed from ${project.name}`,
                  removal: {
                    projectId,
                    userId,
                    projectName: project.name,
                    userName: user.name,
                    userEmail: user.email
                  }
                });
              } else {
                res.json({ 
                  success: true, 
                  message: `${user.name} was not assigned to ${project.name}`,
                  removal: {
                    projectId,
                    userId,
                    projectName: project.name,
                    userName: user.name,
                    userEmail: user.email
                  }
                });
              }
            }
          );
        }
      );
    }
  );
});

// Get project members for a specific project (Admin only)
app.get('/api/projects/:projectId/members', checkPermission(['Admin']), (req, res) => {
  const projectId = parseInt(req.params.projectId);
  const adminUserId = req.session.userId;

  console.log(`🔍 GET /api/projects/${projectId}/members - Fetching project members`);

  if (!Number.isInteger(projectId)) {
    return res.status(400).json({ error: 'Valid projectId is required' });
  }

  // First, verify the project exists and belongs to the admin's organization
  db.get(
    'SELECT id, name FROM projects WHERE id = ? AND user_id = ?',
    [projectId, adminUserId],
    (err, project) => {
      if (err) {
        console.error('Error checking project:', err);
        return res.status(500).json({ error: err.message });
      }

      if (!project) {
        return res.status(404).json({ error: 'Project not found or access denied' });
      }

      // Get all members assigned to this project
      db.all(
        `SELECT u.id, u.name, u.email, u.role, pm.created_at as assigned_at
         FROM project_members pm
         JOIN users u ON pm.userId = u.id
         WHERE pm.projectId = ?
         ORDER BY u.name`,
        [projectId],
        (err, members) => {
          if (err) {
            console.error('Error fetching project members:', err);
            return res.status(500).json({ error: err.message });
          }

          console.log(`✅ Found ${members.length} members for project ${projectId}`);
          res.json({
            success: true,
            project: {
              id: project.id,
              name: project.name
            },
            members: members || []
          });
        }
      );
    }
  );
});

// Get user's project assignments (for a specific user)
app.get('/api/users/:userId/projects', checkPermission(['Admin']), (req, res) => {
  const userId = parseInt(req.params.userId);
  const adminUserId = req.session.userId;

  console.log(`🔍 GET /api/users/${userId}/projects - Fetching user's project assignments`);

  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Valid userId is required' });
  }

  // Verify the user exists
  db.get(
    'SELECT id, name, email FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        console.error('Error checking user:', err);
        return res.status(500).json({ error: err.message });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get all projects this user is assigned to (only from admin's organization)
      db.all(
        `SELECT p.id, p.name, p.status, p.description, pm.created_at as assigned_at
         FROM project_members pm
         JOIN projects p ON pm.projectId = p.id
         WHERE pm.userId = ? AND p.user_id = ?
         ORDER BY p.name`,
        [userId, adminUserId],
        (err, projects) => {
          if (err) {
            console.error('Error fetching user projects:', err);
            return res.status(500).json({ error: err.message });
          }

          // Format projects to extract priority from description (similar to main projects endpoint)
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
              status: project.status,
              priority: priority,
              description: description,
              assigned_at: project.assigned_at
            };
          });

          console.log(`✅ Found ${formattedProjects.length} project assignments for user ${userId}`);
          res.json({
            success: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email
            },
            projects: formattedProjects || []
          });
        }
      );
    }
  );
});

// Dashboard API Endpoints

// Get dashboard summary with aggregated metrics for the authenticated user
app.get('/api/dashboard-summary', requireAuth, (req, res) => {
  console.log('🔍 GET /api/dashboard-summary - Request received for user:', req.session.userId);
  
  const userId = req.session.userId;
  
  // Get total revenue (sum of quoteTotal from approved/completed quotes)
  const getTotalRevenue = () => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT COALESCE(SUM(quoteTotal), 0) as totalRevenue 
         FROM quotes 
         WHERE user_id = ? AND (LOWER(status) = 'approved' OR LOWER(status) = 'completed')`,
        [userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result.totalRevenue);
        }
      );
    });
  };

  // Get total budgeted cost (sum of budget from approved/completed quotes)
  const getTotalBudget = () => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT COALESCE(SUM(budget), 0) as totalBudget 
         FROM quotes 
         WHERE user_id = ? AND (LOWER(status) = 'approved' OR LOWER(status) = 'completed')`,
        [userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result.totalBudget);
        }
      );
    });
  };

  // Get project status breakdown
  const getStatusBreakdown = () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT status, COUNT(*) as count 
         FROM quotes 
         WHERE user_id = ? 
         GROUP BY status`,
        [userId],
        (err, results) => {
          if (err) reject(err);
          else {
            const breakdown = {};
            results.forEach(row => {
              breakdown[row.status] = row.count;
            });
            resolve(breakdown);
          }
        }
      );
    });
  };

  // Get cash flow over time (last 6 months)
  const getCashFlowData = () => {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT 
           strftime('%Y-%m', created_at) as month,
           COALESCE(SUM(quoteTotal), 0) as revenue
         FROM quotes 
         WHERE user_id = ? 
           AND (LOWER(status) = 'approved' OR LOWER(status) = 'completed')
           AND created_at >= date('now', '-6 months')
         GROUP BY strftime('%Y-%m', created_at)
         ORDER BY month ASC`,
        [userId],
        (err, results) => {
          if (err) reject(err);
          else {
            // Fill in missing months with 0 revenue
            const cashFlow = [];
            const now = new Date();
            
            for (let i = 5; i >= 0; i--) {
              const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
              const monthKey = date.toISOString().substring(0, 7); // YYYY-MM format
              const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              
              const existingData = results.find(row => row.month === monthKey);
              cashFlow.push({
                month: monthName,
                revenue: existingData ? existingData.revenue : 0
              });
            }
            
            resolve(cashFlow);
          }
        }
      );
    });
  };

  // Get total projects count
  const getTotalProjects = () => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as totalProjects FROM quotes WHERE user_id = ?`,
        [userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result.totalProjects);
        }
      );
    });
  };

  // Get active projects count
  const getActiveProjects = () => {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT COUNT(*) as activeProjects 
         FROM quotes 
         WHERE user_id = ? 
           AND LOWER(status) IN ('approved', 'working on it', 'in progress')`,
        [userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result.activeProjects);
        }
      );
    });
  };

  // Execute all queries
  Promise.all([
    getTotalRevenue(),
    getTotalBudget(),
    getStatusBreakdown(),
    getCashFlowData(),
    getTotalProjects(),
    getActiveProjects()
  ])
  .then(([totalRevenue, totalBudget, statusBreakdown, cashFlowData, totalProjects, activeProjects]) => {
    // Calculate profit margin
    const profitMargin = totalBudget > 0 ? ((totalRevenue - totalBudget) / totalBudget) * 100 : 0;
    
    // Calculate growth rate (compare last month to previous month in cash flow)
    let growthRate = 0;
    if (cashFlowData.length >= 2) {
      const lastMonth = cashFlowData[cashFlowData.length - 1].revenue;
      const previousMonth = cashFlowData[cashFlowData.length - 2].revenue;
      if (previousMonth > 0) {
        growthRate = ((lastMonth - previousMonth) / previousMonth) * 100;
      }
    }

    const dashboardData = {
      kpis: {
        totalRevenue,
        totalBudget,
        profitMargin,
        growthRate,
        totalProjects,
        activeProjects
      },
      statusBreakdown,
      cashFlowData
    };

    console.log('✅ Dashboard summary calculated successfully');
    res.json({
      success: true,
      data: dashboardData
    });
  })
  .catch(error => {
    console.error('❌ Error calculating dashboard summary:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate dashboard summary'
    });
  });
});

// Quotes API Endpoints

// Get all quotes for the authenticated user
app.get('/api/quotes', requireAuth, (req, res) => {
  console.log('🔍 GET /api/quotes - Fetching quotes for user:', req.session.userId);
  
  db.all(
    `SELECT 
      q.id, 
      q.quoteName, 
      q.status, 
      q.timeToDevelop, 
      q.timeToDevelopValue,
      q.timeToDevelopUnit,
      q.variancePercentage, 
      q.quoteTotal, 
      q.budget, 
      q.project_id,
      q.created_at, 
      q.updated_at,
      p.name as project_name
    FROM quotes q 
    LEFT JOIN projects p ON q.project_id = p.id 
    WHERE q.user_id = ? 
    ORDER BY q.created_at DESC`,
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
app.post('/api/quotes', checkPermission(['Admin', 'Member']), (req, res) => {
  console.log('🔍 POST /api/quotes - Request received for user:', req.session.userId);
  console.log('Request body:', req.body);
  
  const { 
    quoteName, 
    clientName,
    clientEmail,
    status = 'Draft', 
    timeToDevelop = '', 
    timeToDevelopValue = 0,
    timeToDevelopUnit = 'Weeks',
    variancePercentage = 0, 
    quoteTotal = 0, 
    budget = 0,
    project_id,
    description
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

  console.log('🔍 Creating quote with project_id:', project_id, 'for user:', userId);
  console.log('🔍 Quote data:', { quoteName, clientName, project_id, quoteTotal });

  db.run(
    `INSERT INTO quotes (
      quoteName, 
      clientName,
      clientEmail,
      status, 
      timeToDevelop, 
      timeToDevelopValue,
      timeToDevelopUnit,
      variancePercentage, 
      quoteTotal, 
      budget, 
      user_id, 
      project_id,
      description,
      created_at, 
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      quoteName.trim(), 
      clientName || '',
      clientEmail || '',
      status, 
      timeToDevelop, 
      timeToDevelopValue,
      timeToDevelopUnit,
      variancePercentage, 
      quoteTotal, 
      budget, 
      userId, 
      project_id || null,
      description || '',
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
          clientName,
          clientEmail,
          status, 
          timeToDevelop, 
          timeToDevelopValue,
          timeToDevelopUnit,
          variancePercentage, 
          quoteTotal, 
          budget, 
          project_id,
          description,
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
          
          // Create notification for new quote
          createNotification(userId, `New quote "${quote.quoteName}" has been created`);
          
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

// Bulk update quotes (must be defined BEFORE /api/quotes/:id to avoid route conflicts)
app.put('/api/quotes/bulk-update', checkPermission(['Admin', 'Member']), (req, res) => {
  console.log('🔍 PUT /api/quotes/bulk-update - Request received for user:', req.session.userId);
  console.log('Request body:', req.body);
  
  const { quote_ids, updates } = req.body;
  const userId = req.session.userId;

  if (!quote_ids || !Array.isArray(quote_ids) || quote_ids.length === 0) {
    console.log('❌ Validation failed: Invalid or empty quote_ids array. Received:', quote_ids);
    return res.status(400).json({ 
      success: false, 
      error: 'quote_ids must be a non-empty array. Received: ' + (quote_ids ? typeof quote_ids : 'undefined')
    });
  }

  if (!updates || typeof updates !== 'object') {
    console.log('❌ Validation failed: Invalid updates object');
    return res.status(400).json({ 
      success: false, 
      error: 'updates must be a valid object' 
    });
  }

  // Build update query dynamically
  const allowedFields = ['project_id', 'status', 'quoteName', 'quoteTotal', 'budget'];
  const updateFields = [];
  const updateValues = [];
  
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = ?`);
      updateValues.push(value);
    }
  }

  if (updateFields.length === 0) {
    console.log('❌ Validation failed: No valid update fields provided');
    return res.status(400).json({ 
      success: false, 
      error: 'No valid update fields provided' 
    });
  }

  // Create placeholders for quote IDs
  const placeholders = quote_ids.map(() => '?').join(', ');
  const queryParams = [...updateValues, ...quote_ids, userId];
  
  const updateQuery = `
    UPDATE quotes 
    SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
    WHERE id IN (${placeholders}) AND user_id = ?
  `;

  console.log('Bulk update query:', updateQuery);
  console.log('Query parameters:', queryParams);

  // Execute the bulk update in a transaction
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    db.run(updateQuery, queryParams, function (err) {
      if (err) {
        console.error('❌ Database error during bulk update:', err);
        db.run('ROLLBACK');
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to bulk update quotes',
          details: err.message 
        });
      }

      const updatedCount = this.changes;
      console.log(`✅ Bulk updated ${updatedCount} quotes`);

      // If project_id is being updated, also update related change orders
      if (updates.project_id !== undefined) {
        const updateChangeOrdersQuery = `
          UPDATE change_orders 
          SET project_id = ? 
          WHERE quote_id IN (${placeholders}) OR quoteId IN (${placeholders})
        `;
        const changeOrderParams = [updates.project_id, ...quote_ids, ...quote_ids];

        db.run(updateChangeOrdersQuery, changeOrderParams, function (changeOrderErr) {
          if (changeOrderErr) {
            console.error('❌ Failed to update related change orders:', changeOrderErr);
            db.run('ROLLBACK');
            return res.status(500).json({ 
              success: false, 
              error: 'Failed to update related change orders',
              details: changeOrderErr.message 
            });
          }

          console.log(`✅ Updated ${this.changes} related change orders`);
          
          db.run('COMMIT', (commitErr) => {
            if (commitErr) {
              console.error('❌ Failed to commit transaction:', commitErr);
              return res.status(500).json({ 
                success: false, 
                error: 'Failed to commit bulk update',
                details: commitErr.message 
              });
            }

            res.json({
              success: true,
              message: `Successfully updated ${updatedCount} quotes`,
              updatedCount: updatedCount,
              updates: updates
            });
          });
        });
      } else {
        db.run('COMMIT', (commitErr) => {
          if (commitErr) {
            console.error('❌ Failed to commit transaction:', commitErr);
            return res.status(500).json({ 
              success: false, 
              error: 'Failed to commit bulk update',
              details: commitErr.message 
            });
          }

          res.json({
            success: true,
            message: `Successfully updated ${updatedCount} quotes`,
            updatedCount: updatedCount,
            updates: updates
          });
        });
      }
    });
  });
});

// Update an existing quote for the authenticated user (supports partial updates)
app.put('/api/quotes/:id', checkProjectAccess(['Admin', 'Member']), (req, res) => {
  console.log('🔍 PUT /api/quotes/:id - Request received for user:', req.session.userId);
  console.log('Quote ID:', req.params.id);
  console.log('Request body:', req.body);
  
  const quoteId = parseInt(req.params.id);
  const updates = req.body;

  if (!quoteId || isNaN(quoteId)) {
    console.log('❌ Validation failed: Invalid quote ID');
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid quote ID' 
    });
  }

  // If quoteName is being updated, validate it's not empty
  if (updates.quoteName !== undefined && (!updates.quoteName || updates.quoteName.trim() === '')) {
    console.log('❌ Validation failed: Quote name cannot be empty');
    return res.status(400).json({ 
      success: false, 
      error: 'Quote name cannot be empty' 
    });
  }

  const userId = req.session.userId;
  const now = new Date().toISOString();

  // First check if the quote exists and belongs to the user
  db.get(
    'SELECT * FROM quotes WHERE id = ? AND user_id = ?',
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

      // Build dynamic update query based on provided fields
      const updateFields = [];
      const updateValues = [];
      
      // Map of allowed update fields (including project_id for linking quotes to projects)
      const allowedFields = {
        quoteName: 'quoteName',
        status: 'status',
        timeToDevelop: 'timeToDevelop',
        timeToDevelopValue: 'timeToDevelopValue',
        timeToDevelopUnit: 'timeToDevelopUnit',
        variancePercentage: 'variancePercentage',
        quoteTotal: 'quoteTotal',
        budget: 'budget',
        project_id: 'project_id'
      };

      // Add fields that are being updated
      Object.keys(updates).forEach(key => {
        if (allowedFields[key]) {
          updateFields.push(`${allowedFields[key]} = ?`);
          let value = updates[key];
          
          // Handle special cases
          if (key === 'quoteName' && value) {
            value = value.trim();
          }
          
          updateValues.push(value);
        }
      });

      // Always update the updated_at timestamp
      updateFields.push('updated_at = ?');
      updateValues.push(now);

      if (updateFields.length === 1) { // Only updated_at was added
        return res.status(400).json({ 
          success: false, 
          error: 'No valid fields provided for update' 
        });
      }

      // Add WHERE clause parameters
      updateValues.push(quoteId, userId);

      const updateQuery = `UPDATE quotes SET ${updateFields.join(', ')} WHERE id = ? AND user_id = ?`;
      
      console.log('🔧 Update query:', updateQuery);
      console.log('🔧 Update values:', updateValues);

      // Update the quote
      db.run(updateQuery, updateValues, function (err) {
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

        // If project_id was updated, cascade the change to all related change orders
        if (updates.project_id !== undefined) {
          db.run(
            'UPDATE change_orders SET project_id = ? WHERE quote_id = ?',
            [updates.project_id, quoteId],
            (coErr) => {
              if (coErr) {
                console.error('⚠️ Warning: Failed to cascade project_id to change orders:', coErr);
              } else {
                console.log('✅ Cascaded project_id to related change orders');
              }
            }
          );
        }

        // Fetch the updated quote to return it
        db.get(
          `SELECT 
            id, 
            quoteName, 
            status, 
            timeToDevelop, 
            timeToDevelopValue,
            timeToDevelopUnit,
            variancePercentage, 
            quoteTotal, 
            budget,
            project_id, 
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
            
            // Create notification for quote update
            createNotification(userId, `Quote "${updatedQuote.quoteName}" has been updated`);
            
            res.json({
              success: true,
              message: 'Quote updated successfully',
              quote: updatedQuote
            });
          }
        );
      });
    }
  );
});

// Delete a quote for the authenticated user
app.delete('/api/quotes/:id', checkProjectAccess(['Admin', 'Member']), (req, res) => {
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

// Bulk update quotes for mass editing


// Get a single quote by ID for the authenticated user
app.get('/api/quotes/:id', checkProjectAccess(['Admin', 'Member']), (req, res) => {
  console.log('🔍 GET /api/quotes/:id - Request received for user:', req.session.userId);
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

  db.get(
    `SELECT 
      id, quoteName, status, timeToDevelop, timeToDevelopValue, timeToDevelopUnit,
      variancePercentage, quoteTotal, budget, project_id, created_at, updated_at
     FROM quotes 
     WHERE id = ? AND user_id = ?`,
    [quoteId, userId],
    (err, quote) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Database error while fetching quote' 
        });
      }

      if (!quote) {
        console.log('❌ Quote not found or access denied');
        return res.status(404).json({ 
          success: false, 
          error: 'Quote not found or access denied' 
        });
      }

      console.log('✅ Quote fetched successfully:', quote.quoteName);
      res.json({
        success: true,
        quote: quote
      });
    }
  );
});

// Generate and download PDF for a specific quote
app.get('/api/quotes/:id/pdf', requireAuth, async (req, res) => {
  console.log('🔍 GET /api/quotes/:id/pdf - Request received for user:', req.session.userId);
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

  try {
    // Fetch quote data
    const quote = await new Promise((resolve, reject) => {
      db.get(
        `SELECT 
          id, quoteName, status, timeToDevelop, timeToDevelopValue, timeToDevelopUnit,
          variancePercentage, quoteTotal, budget, created_at, updated_at
         FROM quotes 
         WHERE id = ? AND user_id = ?`,
        [quoteId, userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    if (!quote) {
      console.log('❌ Quote not found or access denied');
      return res.status(404).json({ 
        success: false, 
        error: 'Quote not found or access denied' 
      });
    }

    // Fetch line items
    const lineItems = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, description, estimatedCost, actualCost, created_at, updated_at 
         FROM line_items 
         WHERE quoteId = ? AND user_id = ? 
         ORDER BY created_at ASC`,
        [quoteId, userId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results || []);
        }
      );
    });

    // Fetch change orders
    const changeOrders = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, description, amount, status, created_at, updated_at
         FROM change_orders 
         WHERE quoteId = ? AND user_id = ? 
         ORDER BY created_at ASC`,
        [quoteId, userId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results || []);
        }
      );
    });

    // Fetch company profile
    const companyProfile = await new Promise((resolve, reject) => {
      db.get(
        'SELECT company_name, logo_url FROM company_profile WHERE user_id = ?',
        [userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result || { company_name: 'Company Co', logo_url: null });
        }
      );
    });

    // Read HTML template
    const templatePath = path.join(__dirname, 'quote-template.html');
    let htmlTemplate = await fs.readFile(templatePath, 'utf-8');

    // Helper functions for formatting
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount || 0);
    };

    const formatPercentage = (percentage) => {
      return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const getStatusClass = (status) => {
      switch (status.toLowerCase()) {
        case 'draft': return 'draft';
        case 'sent':
        case 'pending':
        case 'client to be review': return 'sent';
        case 'approved': return 'approved';
        case 'working on it':
        case 'in progress': return 'working';
        case 'completed': return 'completed';
        case 'rejected': return 'rejected';
        default: return 'draft';
      }
    };

    const getVarianceClass = (variance) => {
      if (variance > 0) return 'variance-positive';
      if (variance < 0) return 'variance-negative';
      return 'variance-neutral';
    };

    // Calculate totals and metrics
    const totalEstimated = lineItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
    const lineItemsActual = lineItems.reduce((sum, item) => sum + (item.actualCost || 0), 0);
    const approvedChangeOrdersTotal = changeOrders
      .filter(co => co.status === 'Approved')
      .reduce((sum, co) => sum + co.amount, 0);
    const totalActual = lineItemsActual + approvedChangeOrdersTotal;
    const totalVariance = totalEstimated === 0 ? 0 : ((totalActual - totalEstimated) / totalEstimated) * 100;
    const profitMargin = totalActual === 0 ? 0 : ((quote.quoteTotal - totalActual) / totalActual) * 100;
    const overallVariance = quote.quoteTotal === 0 ? 0 : ((totalActual - quote.quoteTotal) / quote.quoteTotal) * 100;

    // Process line items for template
    const processedLineItems = lineItems.map(item => {
      const variance = item.estimatedCost === 0 ? 0 : ((item.actualCost - item.estimatedCost) / item.estimatedCost) * 100;
      return {
        description: item.description,
        estimatedCost: formatCurrency(item.estimatedCost),
        actualCost: formatCurrency(item.actualCost),
        variance: formatPercentage(variance),
        varianceClass: getVarianceClass(variance)
      };
    });

    // Process change orders for template
    const processedChangeOrders = changeOrders.map(co => ({
      description: co.description,
      amount: formatCurrency(co.amount),
      status: co.status,
      statusClass: co.status.toLowerCase(),
      createdAt: new Date(co.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }));

    // Replace template placeholders
    const replacements = {
      '{{companyName}}': companyProfile.company_name,
      '{{quoteName}}': quote.quoteName,
      '{{status}}': quote.status.charAt(0).toUpperCase() + quote.status.slice(1).toLowerCase(),
      '{{statusClass}}': getStatusClass(quote.status),
      '{{createdDate}}': formatDate(quote.created_at),
      '{{updatedDate}}': formatDate(quote.updated_at),
      '{{generatedDate}}': formatDate(new Date().toISOString()),
      '{{quoteTotal}}': formatCurrency(quote.quoteTotal),
      '{{actualCost}}': formatCurrency(totalActual),
      '{{profitMargin}}': formatPercentage(profitMargin),
      '{{profitMarginClass}}': profitMargin >= 0 ? 'variance-negative' : 'variance-positive',
      '{{overallVariance}}': formatPercentage(overallVariance),
      '{{overallVarianceClass}}': getVarianceClass(overallVariance),
      '{{totalEstimated}}': formatCurrency(totalEstimated),
      '{{totalActual}}': formatCurrency(totalActual),
      '{{totalVariance}}': formatPercentage(totalVariance),
      '{{totalVarianceClass}}': getVarianceClass(totalVariance)
    };

    // Replace simple placeholders
    Object.entries(replacements).forEach(([placeholder, value]) => {
      htmlTemplate = htmlTemplate.replace(new RegExp(placeholder, 'g'), value);
    });

    // Handle custom logo conditional rendering
    if (companyProfile.logo_url) {
      // Convert relative URL to absolute HTTP URL for PDF generation
      const baseUrl = `http://localhost:${PORT}`;
      const logoAbsoluteUrl = `${baseUrl}${companyProfile.logo_url}`;
      console.log('Logo absolute URL for PDF:', logoAbsoluteUrl); // Debug log
      
      // Replace the conditional with the custom logo img tag with proper class
      htmlTemplate = htmlTemplate.replace(
        /\{\{#if customLogoUrl\}\}[\s\S]*?\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g,
        `<img src="${logoAbsoluteUrl}" alt="${companyProfile.company_name} Logo" class="custom-logo">`
      );
    } else {
      // No custom logo, use default - remove the conditional and keep the else content
      htmlTemplate = htmlTemplate.replace(
        /\{\{#if customLogoUrl\}\}[\s\S]*?\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g,
        '$1'
      );
    }

    // Handle conditional line items rendering
    if (lineItems.length > 0) {
      htmlTemplate = htmlTemplate.replace('{{#if hasLineItems}}', '');
      htmlTemplate = htmlTemplate.replace('{{else}}', '<!--');
      htmlTemplate = htmlTemplate.replace('{{/if}}', '-->');
      
      // Generate line items HTML
      let lineItemsHtml = '';
      processedLineItems.forEach(item => {
        lineItemsHtml += `
        <tr>
          <td>${item.description}</td>
          <td style="text-align: right;" class="amount">${item.estimatedCost}</td>
          <td style="text-align: right;" class="amount">${item.actualCost}</td>
          <td style="text-align: right;" class="${item.varianceClass}">${item.variance}</td>
        </tr>`;
      });
      htmlTemplate = htmlTemplate.replace('{{#each lineItems}}', '');
      htmlTemplate = htmlTemplate.replace('{{/each}}', '');
      htmlTemplate = htmlTemplate.replace(/<tr>\s*<td>\{\{this\.description\}\}<\/td>[\s\S]*?<\/tr>/g, lineItemsHtml);
    } else {
      htmlTemplate = htmlTemplate.replace('{{#if hasLineItems}}', '<!--');
      htmlTemplate = htmlTemplate.replace('{{else}}', '');
      htmlTemplate = htmlTemplate.replace('{{/if}}', '');
    }

    // Handle conditional change orders rendering
    if (changeOrders.length > 0) {
      htmlTemplate = htmlTemplate.replace('{{#if hasChangeOrders}}', '');
      htmlTemplate = htmlTemplate.replace('{{/if}}', '');
      htmlTemplate = htmlTemplate.replace('{{approvedChangeOrdersTotal}}', formatCurrency(approvedChangeOrdersTotal));
      
      // Generate change orders HTML
      let changeOrdersHtml = '';
      processedChangeOrders.forEach(co => {
        changeOrdersHtml += `
        <tr>
          <td>${co.description}</td>
          <td style="text-align: right;" class="amount">${co.amount}</td>
          <td style="text-align: center;">
            <span class="status-badge status-${co.statusClass}">${co.status}</span>
          </td>
          <td style="text-align: center;">${co.createdAt}</td>
        </tr>`;
      });
      htmlTemplate = htmlTemplate.replace('{{#each changeOrders}}', '');
      htmlTemplate = htmlTemplate.replace('{{/each}}', '');
      htmlTemplate = htmlTemplate.replace(/<tr>\s*<td>\{\{this\.description\}\}<\/td>[\s\S]*?<td style="text-align: center;">\{\{this\.createdAt\}\}<\/td>\s*<\/tr>/g, changeOrdersHtml);
    } else {
      htmlTemplate = htmlTemplate.replace('{{#if hasChangeOrders}}', '<!--');
      htmlTemplate = htmlTemplate.replace('{{/if}}', '-->');
    }

    // Inline all CSS styles for reliable PDF rendering
    console.log('🎨 Inlining CSS styles for PDF generation...');
    const inlinedHtml = juice(htmlTemplate, {
      // Juice options for better PDF compatibility
      removeStyleTags: true,  // Remove <style> tags after inlining
      preserveMediaQueries: false,  // Remove media queries (not needed for PDF)
      preservePseudos: false,  // Remove pseudo-selectors (not supported in PDF)
      preserveFontFaces: true,  // Keep @font-face rules
      webResources: {
        images: false,  // Don't inline images (we have absolute URLs)
        svgs: false,    // Don't inline SVGs
        scripts: false, // Don't inline scripts
        links: false    // Don't inline linked stylesheets
      }
    });
    
    console.log('✅ CSS inlining completed. HTML template processed for PDF generation.');

    // Generate PDF using Puppeteer
    console.log('🔄 Launching Puppeteer browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(inlinedHtml, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // Set headers and send PDF
    const filename = `Quote-${quote.quoteName.replace(/[^a-zA-Z0-9-_]/g, '_')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    console.log('✅ PDF generated successfully:', filename);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF report'
    });
  }
});

// Upload and analyze document to create quote using AI
app.post('/api/quotes/upload-and-analyze', requireAuth, upload.single('file'), async (req, res) => {
  console.log('🤖 AI Quote Analysis request received');
  
  if (!GEMINI_API_KEY) {
    return res.status(503).json({
      success: false,
      error: 'AI analysis service is not configured'
    });
  }
  
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }
  
  try {
    // Extract text content based on file type
    let fileContent = '';
    const mimeType = req.file.mimetype;
    const fileName = req.file.originalname.toLowerCase();
    
    console.log(`📄 Processing file: ${req.file.originalname} (${req.file.size} bytes, MIME: ${mimeType})`);
    
    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      // Handle PDF files
      try {
        const pdfData = await pdfParse(req.file.buffer);
        fileContent = pdfData.text;
        console.log('✅ PDF text extracted successfully');
      } catch (pdfError) {
        console.error('❌ PDF parsing error:', pdfError);
        return res.status(400).json({
          success: false,
          error: 'Failed to extract text from PDF. Please ensure the PDF contains readable text.'
        });
      }
    } else if (mimeType.startsWith('text/') || fileName.match(/\.(txt|md|csv|json)$/i)) {
      // Handle text files
      fileContent = req.file.buffer.toString('utf-8');
    } else {
      return res.status(400).json({
        success: false,
        error: 'Unsupported file type. Please upload a text file (.txt, .md, .csv, .json) or PDF file (.pdf).'
      });
    }
    
    if (!fileContent.trim()) {
      return res.status(400).json({
        success: false,
        error: 'File appears to be empty or contains no readable text'
      });
    }
    
    console.log(`� Extracted ${fileContent.length} characters of text content`);
    
    // Construct AI prompt for structured data extraction
    const prompt = buildGeminiPrompt(fileContent, req.file.originalname);
    
    // Call Gemini API for analysis
    const analysisResult = await callGeminiAPI(prompt);
    
    if (!analysisResult) {
      return res.status(500).json({
        success: false,
        error: 'Failed to analyze document with AI'
      });
    }
    
    console.log('✅ AI analysis completed successfully');
    
    // Create notification for AI analysis completion
    createNotification(userId, `AI analysis completed for "${req.file.originalname}" - ${analysisResult.lineItems?.length || 0} items extracted`);
    
    res.json({
      success: true,
      data: analysisResult,
      metadata: {
        fileName: req.file.originalname,
        fileSize: req.file.size,
        processingTimestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ AI analysis error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during document analysis'
    });
  }
});

// Line Items API Endpoints

// Get all line items for a specific quote
app.get('/api/quotes/:quoteId/line-items', requireAuth, (req, res) => {
  console.log('🔍 GET /api/quotes/:quoteId/line-items - Request received for user:', req.session.userId);
  console.log('Quote ID:', req.params.quoteId);
  
  const quoteId = parseInt(req.params.quoteId);
  const userId = req.session.userId;

  if (!quoteId || isNaN(quoteId)) {
    console.log('❌ Validation failed: Invalid quote ID');
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid quote ID' 
    });
  }

  // First verify the quote belongs to the user
  db.get(
    'SELECT id FROM quotes WHERE id = ? AND user_id = ?',
    [quoteId, userId],
    (err, quote) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Database error while verifying quote ownership' 
        });
      }

      if (!quote) {
        console.log('❌ Quote not found or access denied');
        return res.status(404).json({ 
          success: false, 
          error: 'Quote not found or access denied' 
        });
      }

      // Get line items for this quote
      db.all(
        `SELECT id, description, estimatedCost, actualCost, created_at, updated_at 
         FROM line_items 
         WHERE quoteId = ? AND user_id = ? 
         ORDER BY created_at ASC`,
        [quoteId, userId],
        (err, lineItems) => {
          if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ 
              success: false, 
              error: 'Database error while fetching line items' 
            });
          }

          console.log(`✅ Line items fetched successfully: ${lineItems.length} items`);
          res.json({
            success: true,
            lineItems: lineItems || [],
            count: lineItems ? lineItems.length : 0
          });
        }
      );
    }
  );
});

// Create a new line item for a specific quote
app.post('/api/quotes/:quoteId/line-items', checkPermission(['Admin', 'Member']), (req, res) => {
  console.log('🔍 POST /api/quotes/:quoteId/line-items - Request received for user:', req.session.userId);
  console.log('Quote ID:', req.params.quoteId);
  console.log('Request body:', req.body);
  
  const quoteId = parseInt(req.params.quoteId);
  const userId = req.session.userId;
  const { description, estimatedCost = 0, actualCost = 0, cost_code_id } = req.body;

  if (!quoteId || isNaN(quoteId)) {
    console.log('❌ Validation failed: Invalid quote ID');
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid quote ID' 
    });
  }

  if (!description || description.trim() === '') {
    console.log('❌ Validation failed: Description is required');
    return res.status(400).json({ 
      success: false, 
      error: 'Description is required' 
    });
  }

  if (!cost_code_id) {
    console.log('❌ Validation failed: Cost code is required');
    return res.status(400).json({ 
      success: false, 
      error: 'Cost code is required for budget tracking' 
    });
  }

  // First verify the quote belongs to the user
  db.get(
    'SELECT id FROM quotes WHERE id = ? AND user_id = ?',
    [quoteId, userId],
    (err, quote) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Database error while verifying quote ownership' 
        });
      }

      if (!quote) {
        console.log('❌ Quote not found or access denied');
        return res.status(404).json({ 
          success: false, 
          error: 'Quote not found or access denied' 
        });
      }

      // Create the line item
      db.run(
        `INSERT INTO line_items (description, estimatedCost, actualCost, quoteId, user_id, cost_code_id, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [description, estimatedCost, actualCost, quoteId, userId, cost_code_id],
        function (err) {
          if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ 
              success: false, 
              error: 'Database error while creating line item' 
            });
          }

          console.log('✅ Line item created successfully with ID:', this.lastID);
          
          // Return the created line item
          db.get(
            'SELECT id, description, estimatedCost, actualCost, cost_code_id, created_at, updated_at FROM line_items WHERE id = ?',
            [this.lastID],
            (err, lineItem) => {
              if (err) {
                console.error('❌ Error fetching created line item:', err);
                return res.status(500).json({ 
                  success: false, 
                  error: 'Line item created but error fetching details' 
                });
              }

              res.status(201).json({
                success: true,
                message: 'Line item created successfully',
                lineItem: lineItem
              });
            }
          );
        }
      );
    }
  );
});

// Update a specific line item
app.put('/api/line-items/:itemId', checkProjectAccess(['Admin', 'Member']), (req, res) => {
  console.log('🔍 PUT /api/line-items/:itemId - Request received for user:', req.session.userId);
  console.log('Item ID:', req.params.itemId);
  console.log('Request body:', req.body);
  
  const itemId = parseInt(req.params.itemId);
  const userId = req.session.userId;
  const { description, estimatedCost, actualCost, cost_code_id } = req.body;

  if (!itemId || isNaN(itemId)) {
    console.log('❌ Validation failed: Invalid item ID');
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid line item ID' 
    });
  }

  if (!description || description.trim() === '') {
    console.log('❌ Validation failed: Description is required');
    return res.status(400).json({ 
      success: false, 
      error: 'Description is required' 
    });
  }

  if (!cost_code_id) {
    console.log('❌ Validation failed: Cost code is required');
    return res.status(400).json({ 
      success: false, 
      error: 'Cost code is required for budget tracking' 
    });
  }

  // First verify the line item belongs to the user
  db.get(
    'SELECT id, quoteId FROM line_items WHERE id = ? AND user_id = ?',
    [itemId, userId],
    (err, lineItem) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Database error while verifying line item ownership' 
        });
      }

      if (!lineItem) {
        console.log('❌ Line item not found or access denied');
        return res.status(404).json({ 
          success: false, 
          error: 'Line item not found or access denied' 
        });
      }

      // Update the line item
      db.run(
        `UPDATE line_items 
         SET description = ?, estimatedCost = ?, actualCost = ?, cost_code_id = ?, updated_at = datetime('now')
         WHERE id = ? AND user_id = ?`,
        [description, estimatedCost || 0, actualCost || 0, cost_code_id, itemId, userId],
        function (err) {
          if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ 
              success: false, 
              error: 'Database error while updating line item' 
            });
          }

          if (this.changes === 0) {
            console.log('❌ No changes made to line item');
            return res.status(404).json({ 
              success: false, 
              error: 'Line item not found or no changes made' 
            });
          }

          console.log('✅ Line item updated successfully');
          
          // Return the updated line item
          db.get(
            'SELECT id, description, estimatedCost, actualCost, cost_code_id, created_at, updated_at FROM line_items WHERE id = ?',
            [itemId],
            (err, updatedLineItem) => {
              if (err) {
                console.error('❌ Error fetching updated line item:', err);
                return res.status(500).json({ 
                  success: false, 
                  error: 'Line item updated but error fetching details' 
                });
              }

              res.json({
                success: true,
                message: 'Line item updated successfully',
                lineItem: updatedLineItem
              });
            }
          );
        }
      );
    }
  );
});

// Delete a specific line item
app.delete('/api/line-items/:itemId', checkProjectAccess(['Admin', 'Member']), (req, res) => {
  console.log('🔍 DELETE /api/line-items/:itemId - Request received for user:', req.session.userId);
  console.log('Item ID:', req.params.itemId);
  
  const itemId = parseInt(req.params.itemId);
  const userId = req.session.userId;

  if (!itemId || isNaN(itemId)) {
    console.log('❌ Validation failed: Invalid item ID');
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid line item ID' 
    });
  }

  // First verify the line item belongs to the user and get its details
  db.get(
    'SELECT id, description, quoteId FROM line_items WHERE id = ? AND user_id = ?',
    [itemId, userId],
    (err, lineItem) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Database error while verifying line item ownership' 
        });
      }

      if (!lineItem) {
        console.log('❌ Line item not found or access denied');
        return res.status(404).json({ 
          success: false, 
          error: 'Line item not found or access denied' 
        });
      }

      // Delete the line item
      db.run(
        'DELETE FROM line_items WHERE id = ? AND user_id = ?',
        [itemId, userId],
        function (err) {
          if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ 
              success: false, 
              error: 'Database error while deleting line item' 
            });
          }

          if (this.changes === 0) {
            console.log('❌ No line item was deleted');
            return res.status(404).json({ 
              success: false, 
              error: 'Line item not found' 
            });
          }

          console.log('✅ Line item deleted successfully');
          res.json({
            success: true,
            message: 'Line item deleted successfully',
            deletedLineItem: lineItem
          });
        }
      );
    }
  );
});

// Change Orders API Endpoints

// Get all change orders for a specific quote
app.get('/api/quotes/:quoteId/change-orders', requireAuth, (req, res) => {
  console.log('🔍 GET /api/quotes/:quoteId/change-orders - Request received for user:', req.session.userId);
  console.log('Quote ID:', req.params.quoteId);
  
  const quoteId = parseInt(req.params.quoteId);
  const userId = req.session.userId;

  if (!quoteId || isNaN(quoteId)) {
    console.log('❌ Validation failed: Invalid quote ID');
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid quote ID' 
    });
  }

  // First verify the quote belongs to the user
  db.get(
    'SELECT id FROM quotes WHERE id = ? AND user_id = ?',
    [quoteId, userId],
    (err, quote) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Database error while verifying quote ownership' 
        });
      }

      if (!quote) {
        console.log('❌ Quote not found or access denied');
        return res.status(404).json({ 
          success: false, 
          error: 'Quote not found or access denied' 
        });
      }

      // Get change orders for this quote
      db.all(
        'SELECT * FROM change_orders WHERE quoteId = ? AND user_id = ? ORDER BY created_at DESC',
        [quoteId, userId],
        (err, changeOrders) => {
          if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ 
              success: false, 
              error: 'Database error while fetching change orders' 
            });
          }

          console.log(`✅ Successfully fetched ${changeOrders.length} change orders`);
          res.json({
            success: true,
            data: changeOrders
          });
        }
      );
    }
  );
});

// Create a new change order for a specific quote
app.post('/api/quotes/:quoteId/change-orders', checkPermission(['Admin', 'Member']), (req, res) => {
  console.log('📝 POST /api/quotes/:quoteId/change-orders - Creating change order for user:', req.session.userId);
  
  const quoteId = parseInt(req.params.quoteId);
  const userId = req.session.userId;
  const { description, amount, cost_code_id } = req.body;

  // Validation
  if (!quoteId || isNaN(quoteId)) {
    console.log('❌ Validation failed: Invalid quote ID');
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid quote ID' 
    });
  }

  if (!description || description.trim().length === 0) {
    console.log('❌ Validation failed: Description is required');
    return res.status(400).json({ 
      success: false, 
      error: 'Description is required' 
    });
  }

  if (amount === undefined || amount === null || isNaN(parseFloat(amount))) {
    console.log('❌ Validation failed: Amount is required and must be a number');
    return res.status(400).json({ 
      success: false, 
      error: 'Amount is required and must be a valid number' 
    });
  }

  if (!cost_code_id) {
    console.log('❌ Validation failed: Cost code is required');
    return res.status(400).json({ 
      success: false, 
      error: 'Cost code is required for budget tracking' 
    });
  }

  // First verify the quote belongs to the user
  db.get(
    'SELECT id FROM quotes WHERE id = ? AND user_id = ?',
    [quoteId, userId],
    (err, quote) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Database error while verifying quote ownership' 
        });
      }

      if (!quote) {
        console.log('❌ Quote not found or access denied');
        return res.status(404).json({ 
          success: false, 
          error: 'Quote not found or access denied' 
        });
      }

      // Create the change order
      db.run(
        `INSERT INTO change_orders (description, amount, status, quoteId, user_id, cost_code_id, created_at, updated_at) 
         VALUES (?, ?, 'Pending', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [description.trim(), parseFloat(amount), quoteId, userId, cost_code_id],
        function(err) {
          if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ 
              success: false, 
              error: 'Database error while creating change order' 
            });
          }

          const changeOrderId = this.lastID;
          console.log(`✅ Change order created with ID: ${changeOrderId}`);

          // Fetch the complete created change order
          db.get(
            'SELECT * FROM change_orders WHERE id = ?',
            [changeOrderId],
            (err, changeOrder) => {
              if (err) {
                console.error('❌ Database error fetching created change order:', err);
                return res.status(500).json({ 
                  success: false, 
                  error: 'Change order created but error fetching details' 
                });
              }

              // Create notification for change order creation
              const notificationMessage = `New change order created: "${description.trim()}" for ${parseFloat(amount) >= 0 ? '+' : ''}$${Math.abs(parseFloat(amount)).toLocaleString()}`;
              createNotification(userId, notificationMessage);

              res.status(201).json({
                success: true,
                message: 'Change order created successfully',
                data: changeOrder
              });
            }
          );
        }
      );
    }
  );
});

// Create a change order (general endpoint that accepts both project_id and quote_id)
app.post('/api/change-orders', checkPermission(['Admin', 'Member']), (req, res) => {
  console.log('📝 POST /api/change-orders - Creating change order for user:', req.session.userId);
  
  const userId = req.session.userId;
  const { description, amount, status, quote_id, project_id } = req.body;

  // Validation
  if (!description || description.trim().length === 0) {
    console.log('❌ Validation failed: Description is required');
    return res.status(400).json({ 
      success: false, 
      error: 'Description is required' 
    });
  }

  if (amount === undefined || amount === null || isNaN(parseFloat(amount))) {
    console.log('❌ Validation failed: Amount is required and must be a number');
    return res.status(400).json({ 
      success: false, 
      error: 'Amount is required and must be a valid number' 
    });
  }

  if (!quote_id || isNaN(parseInt(quote_id))) {
    console.log('❌ Validation failed: Valid quote_id is required');
    return res.status(400).json({ 
      success: false, 
      error: 'Valid quote_id is required' 
    });
  }

  const changeOrderStatus = status || 'Pending';
  const quoteId = parseInt(quote_id);

  // Verify the quote exists and belongs to the user (and optionally matches the project)
  let quoteQuery = 'SELECT * FROM quotes WHERE id = ? AND user_id = ?';
  let queryParams = [quoteId, userId];
  
  if (project_id && !isNaN(parseInt(project_id))) {
    quoteQuery += ' AND project_id = ?';
    queryParams.push(parseInt(project_id));
  }

  db.get(quoteQuery, queryParams, (err, quote) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ 
        success: false, 
        error: 'Database error while verifying quote' 
      });
    }

    if (!quote) {
      console.log('❌ Quote not found or access denied');
      return res.status(404).json({ 
        success: false, 
        error: 'Quote not found or you do not have permission to add change orders to it' 
      });
    }

    // Create the change order (try with quote_id first, fallback to quoteId for compatibility)
    db.run(
      `INSERT INTO change_orders (description, amount, status, quote_id, quoteId, user_id) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [description.trim(), parseFloat(amount), changeOrderStatus, quoteId, quoteId, userId],
      function(err) {
        if (err) {
          console.error('❌ Database error creating change order:', err);
          console.error('❌ Error details:', err.message);
          console.error('❌ Values:', [description.trim(), parseFloat(amount), changeOrderStatus, quoteId, quoteId, userId]);
          return res.status(500).json({ 
            success: false, 
            error: 'Database error while creating change order: ' + err.message 
          });
        }

        console.log('✅ Change order created with ID:', this.lastID);

        // Fetch the created change order with quote details
        db.get(
          `SELECT co.*, q.quoteName 
           FROM change_orders co 
           JOIN quotes q ON co.quote_id = q.id 
           WHERE co.id = ?`,
          [this.lastID],
          (err, changeOrder) => {
            if (err) {
              console.error('❌ Error fetching created change order:', err);
              return res.status(500).json({ 
                success: false, 
                error: 'Change order created but error fetching details' 
              });
            }

            // Create notification for change order creation
            const notificationMessage = `New change order created: "${description.trim()}" for ${parseFloat(amount) >= 0 ? '+' : ''}$${Math.abs(parseFloat(amount)).toLocaleString()}`;
            createNotification(userId, notificationMessage);

            res.status(201).json({
              success: true,
              message: 'Change order created successfully',
              data: changeOrder
            });
          }
        );
      }
    );
  });
});

// Update a change order (no longer affects quote total, only actual costs)
app.put('/api/change-orders/:changeOrderId', checkPermission(['Admin', 'Member']), (req, res) => {
  console.log('✏️ PUT /api/change-orders/:changeOrderId - Updating change order for user:', req.session.userId);
  
  const changeOrderId = parseInt(req.params.changeOrderId);
  const userId = req.session.userId;
  const { description, amount, status, cost_code_id } = req.body;

  if (!changeOrderId || isNaN(changeOrderId)) {
    console.log('❌ Validation failed: Invalid change order ID');
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid change order ID' 
    });
  }

  // First, get the current change order to check ownership and current status
  db.get(
    'SELECT * FROM change_orders WHERE id = ? AND user_id = ?',
    [changeOrderId, userId],
    (err, currentChangeOrder) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Database error while fetching change order' 
        });
      }

      if (!currentChangeOrder) {
        console.log('❌ Change order not found or access denied');
        return res.status(404).json({ 
          success: false, 
          error: 'Change order not found or access denied' 
        });
      }

      // Build the update query dynamically based on provided fields
      const updates = [];
      const values = [];

      if (description !== undefined && description.trim().length > 0) {
        updates.push('description = ?');
        values.push(description.trim());
      }

      if (amount !== undefined && amount !== null && !isNaN(parseFloat(amount))) {
        updates.push('amount = ?');
        values.push(parseFloat(amount));
      }

      if (status !== undefined && status.trim().length > 0) {
        updates.push('status = ?');
        values.push(status.trim());
      }

      if (cost_code_id !== undefined) {
        updates.push('cost_code_id = ?');
        values.push(cost_code_id);
      }

      if (updates.length === 0) {
        return res.status(400).json({ 
          success: false, 
          error: 'No valid fields provided for update' 
        });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(changeOrderId);

      const query = `UPDATE change_orders SET ${updates.join(', ')} WHERE id = ?`;

      // Check if status changed for notification purposes
      const oldStatus = currentChangeOrder.status;
      const newStatus = status || oldStatus;
      const statusChanged = status && oldStatus !== newStatus;

      // Simple update without affecting quote total (change orders now affect actual costs)
      db.run(query, values, function(err) {
        if (err) {
          console.error('❌ Database error:', err);
          return res.status(500).json({ 
            success: false, 
            error: 'Database error while updating change order' 
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({ 
            success: false, 
            error: 'Change order not found' 
          });
        }

        // Fetch the updated change order
        db.get(
          'SELECT * FROM change_orders WHERE id = ?',
          [changeOrderId],
          (err, updatedChangeOrder) => {
            if (err) {
              console.error('❌ Database error fetching updated change order:', err);
              return res.status(500).json({ 
                success: false, 
                error: 'Change order updated but error fetching details' 
              });
            }

            // Create notification for status change
            if (statusChanged) {
              const notificationMessage = `Change order "${updatedChangeOrder.description}" status changed to ${newStatus}`;
              createNotification(userId, notificationMessage);
            }

            console.log('✅ Change order updated successfully');
            res.json({
              success: true,
              message: 'Change order updated successfully',
              data: updatedChangeOrder
            });
          }
        );
      });
    }
  );
});

// Delete a change order
app.delete('/api/change-orders/:changeOrderId', checkPermission(['Admin', 'Member']), (req, res) => {
  console.log('🗑️ DELETE /api/change-orders/:changeOrderId - Deleting change order for user:', req.session.userId);
  
  const changeOrderId = parseInt(req.params.changeOrderId);
  const userId = req.session.userId;

  if (!changeOrderId || isNaN(changeOrderId)) {
    console.log('❌ Validation failed: Invalid change order ID');
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid change order ID' 
    });
  }

  // First get the change order to check ownership
  db.get(
    'SELECT * FROM change_orders WHERE id = ? AND user_id = ?',
    [changeOrderId, userId],
    (err, changeOrder) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Database error while fetching change order' 
        });
      }

      if (!changeOrder) {
        console.log('❌ Change order not found or access denied');
        return res.status(404).json({ 
          success: false, 
          error: 'Change order not found or access denied' 
        });
      }

      // Simple delete without affecting quote total (change orders now affect actual costs)
      db.run(
        'DELETE FROM change_orders WHERE id = ? AND user_id = ?',
        [changeOrderId, userId],
        function(err) {
          if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({ 
              success: false, 
              error: 'Database error while deleting change order' 
            });
          }

          if (this.changes === 0) {
            return res.status(404).json({ 
              success: false, 
              error: 'Change order not found' 
            });
          }

          // Create notification for deletion
          const notificationMessage = `Change order "${changeOrder.description}" was deleted`;
          createNotification(userId, notificationMessage);

          console.log('✅ Change order deleted successfully');
          res.json({
            success: true,
            message: 'Change order deleted successfully',
            deletedChangeOrder: changeOrder
          });
        }
      );
    }
  );
});

// Global Search endpoint for command palette
app.get('/api/global-search', requireAuth, (req, res) => {
  const { q: searchQuery } = req.query;
  const userId = req.session.userId;

  if (!searchQuery || searchQuery.trim().length < 2) {
    return res.json({ success: true, results: [] });
  }

  const searchPattern = `%${searchQuery.trim()}%`;
  const results = [];

  // Search projects
  const projectQuery = `
    SELECT id, name, description, status, 'Project' as type
    FROM projects 
    WHERE user_id = ? AND (name LIKE ? OR description LIKE ?)
    ORDER BY name ASC
    LIMIT 5
  `;

  // Search quotes
  const quoteQuery = `
    SELECT id, quoteName as name, description, status, 'Quote' as type
    FROM quotes 
    WHERE user_id = ? AND (quoteName LIKE ? OR description LIKE ?)
    ORDER BY quoteName ASC
    LIMIT 5
  `;

  // Search vendors
  const vendorQuery = `
    SELECT id, name, description, 'Active' as status, 'Vendor' as type
    FROM vendors 
    WHERE user_id = ? AND (name LIKE ? OR description LIKE ?)
    ORDER BY name ASC
    LIMIT 5
  `;

  let completed = 0;
  const totalQueries = 3;

  const checkComplete = () => {
    completed++;
    if (completed === totalQueries) {
      res.json({ 
        success: true, 
        results: results.sort((a, b) => a.name.localeCompare(b.name))
      });
    }
  };

  // Execute project search
  db.all(projectQuery, [userId, searchPattern, searchPattern], (err, rows) => {
    if (!err && rows) {
      results.push(...rows.map(row => ({
        id: row.id,
        type: row.type,
        name: row.name,
        description: row.description,
        status: row.status
      })));
    }
    checkComplete();
  });

  // Execute quote search
  db.all(quoteQuery, [userId, searchPattern, searchPattern], (err, rows) => {
    if (!err && rows) {
      results.push(...rows.map(row => ({
        id: row.id,
        type: row.type,
        name: row.name,
        description: row.description,
        status: row.status
      })));
    }
    checkComplete();
  });

  // Execute vendor search
  db.all(vendorQuery, [userId, searchPattern, searchPattern], (err, rows) => {
    if (!err && rows) {
      results.push(...rows.map(row => ({
        id: row.id,
        type: row.type,
        name: row.name,
        description: row.description,
        status: row.status
      })));
    }
    checkComplete();
  });
});

// AI Analysis endpoint with RAG capabilities
app.post('/api/ai-analysis', requireAuth, async (req, res) => {
  console.log('🤖 AI Analysis request from user:', req.session.userId);
  
  const { quote, lineItems } = req.body;
  
  if (!quote || !Array.isArray(lineItems)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Quote and lineItems are required' 
    });
  }

  try {
    // Part 1: Format the private quote data
    const privateData = formatQuoteAnalysisData(quote, lineItems);
    
    // Part 2: Get relevant general knowledge from Supabase
    let knowledgeContext = '';
    if (supabase && embedder) {
      try {
        // Create a search query based on the quote context
        const searchQuery = `construction finance profit margin budget analysis ${quote.status} cost management`;
        knowledgeContext = await getRelevantKnowledge(searchQuery);
      } catch (error) {
        console.warn('⚠️  Knowledge search failed for AI analysis:', error.message);
      }
    }
    
    // Part 3: Construct the expert-level Gemini prompt
    const prompt = buildFinancialAnalysisPrompt(privateData, knowledgeContext);
    
    // Part 4: Call Gemini API
    const geminiApiKey = process.env.VITE_GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('❌ Gemini API Error:', geminiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const candidate = geminiData.candidates?.[0];
    
    if (!candidate?.content?.parts?.[0]?.text) {
      throw new Error('No analysis content received from AI service');
    }

    const analysisText = candidate.content.parts[0].text;
    
    console.log('✅ AI Analysis generated successfully');
    res.json({
      success: true,
      analysis: analysisText,
      sources: {
        privateData: true,
        knowledgeBase: !!knowledgeContext,
        quoteName: quote.quoteName
      }
    });

  } catch (error) {
    console.error('❌ AI Analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate AI analysis: ' + error.message 
    });
  }
});

// Helper function to format quote data for AI analysis
function formatQuoteAnalysisData(quote, lineItems) {
  const totalEstimatedCost = lineItems.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
  const totalActualCost = lineItems.reduce((sum, item) => sum + (item.actualCost || 0), 0);
  const profitMargin = totalActualCost > 0 ? ((quote.quoteTotal - totalActualCost) / totalActualCost) * 100 : 0;
  
  let formattedData = `Quote: "${quote.quoteName}"\n`;
  formattedData += `Status: ${quote.status}\n`;
  formattedData += `Quote Total: $${quote.quoteTotal.toLocaleString()}\n`;
  formattedData += `Total Estimated Cost: $${totalEstimatedCost.toLocaleString()}\n`;
  formattedData += `Total Actual Cost: $${totalActualCost.toLocaleString()}\n`;
  formattedData += `Current Profit Margin: ${profitMargin.toFixed(1)}%\n\n`;
  
  formattedData += `Line Items (${lineItems.length} total):\n`;
  lineItems.forEach((item, index) => {
    const variance = item.estimatedCost > 0 ? ((item.actualCost - item.estimatedCost) / item.estimatedCost) * 100 : 0;
    formattedData += `${index + 1}. ${item.description}\n`;
    formattedData += `   Estimated: $${item.estimatedCost.toLocaleString()} | Actual: $${item.actualCost.toLocaleString()} | Variance: ${variance.toFixed(1)}%\n`;
  });
  
  return formattedData;
}

// Helper function to build the financial analysis prompt
function buildFinancialAnalysisPrompt(privateData, knowledgeContext) {
  let prompt = `You are an expert construction finance analyst with deep industry experience. Based on the following private quote data and general industry knowledge, provide a bulleted list of 3-5 key insights. Focus on major risks (e.g., high-variance items, low profit margin, cost overruns), potential opportunities for cost savings, and overall financial health of the quote.

Your response should be formatted as a bulleted list with each insight clearly marked with • and categorized as either:
- 🟢 POSITIVE: Good financial indicators or opportunities
- 🟡 WARNING: Areas of concern that need attention  
- 🔴 RISK: Significant financial risks that require immediate action
- 💡 RECOMMENDATION: Specific actionable advice

PRIVATE QUOTE DATA:
${privateData}

`;

  if (knowledgeContext) {
    prompt += `GENERAL INDUSTRY KNOWLEDGE:
${knowledgeContext}

`;
  }

  prompt += `Provide your analysis now, focusing on the most critical financial insights for this construction quote:`;
  
  return prompt;
}

// Team Management API Endpoints

// Helper function to generate secure invitation token
function generateInvitationToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to send invitation email
async function sendInvitationEmail(email, token, inviterName, role) {
  if (!resend) {
    throw new Error('Email service not configured');
  }

  const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/accept-invite/${token}`;
  
  const { data, error } = await resend.emails.send({
    from: 'Blueprint Team <onboarding@resend.dev>',
    to: [email],
    subject: 'You\'ve been invited to join Blueprint',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #3b82f6; margin: 0;">Blueprint</h1>
          <p style="color: #6b7280; margin: 5px 0;">Construction Project Management</p>
        </div>
        
        <div style="background: #f8fafc; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
          <h2 style="color: #1f2937; margin-top: 0;">You're invited!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            <strong>${inviterName}</strong> has invited you to join their team on Blueprint as a <strong>${role}</strong>.
          </p>
          <p style="color: #4b5563; line-height: 1.6;">
            Blueprint is a comprehensive construction project management platform that helps teams manage projects, quotes, and workflows efficiently.
          </p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" 
             style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    font-weight: bold;
                    display: inline-block;">
            Accept Invitation
          </a>
        </div>
        
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; text-align: center; color: #6b7280; font-size: 14px;">
          <p>This invitation will expire in 7 days.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </div>
    `
  });

  if (error) {
    console.error('Resend API Error:', error);
    
    // Check if it's the sandbox restriction error
    if (error.statusCode === 403 && error.message.includes('testing emails')) {
      throw new Error(`Email sending is restricted to verified addresses. For testing, use 'carriedo78@gmail.com' or verify a domain at resend.com/domains to send to any email address.`);
    }
    
    throw new Error(`Failed to send email: ${error.message || JSON.stringify(error)}`);
  }

  console.log('✅ Email sent successfully:', data);
  return data;
}

// Send invitation email with attempt tracking
async function sendInvitationEmailWithTracking(invitationId, email, token, inviterName, role) {
  try {
    // Increment attempt counter before sending
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE invitations SET email_attempts = email_attempts + 1, last_attempt_at = datetime("now") WHERE id = ?',
        [invitationId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Send the email
    const result = await sendInvitationEmail(email, token, inviterName, role);
    
    // Mark as successfully sent
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE invitations SET status = "sent" WHERE id = ?',
        [invitationId],
        function(err) {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    return result;
  } catch (error) {
    // Mark as failed but keep the invitation record for potential retry
    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE invitations SET status = "failed" WHERE id = ?',
        [invitationId],
        function(err) {
          if (err) console.error('Error updating failed invitation status:', err);
          resolve(); // Don't reject here, we want to throw the original error
        }
      );
    });

    throw error; // Re-throw the original email error
  }
}

// Send team invitation (Admin only)
app.post('/api/team/invite', checkPermission(['Admin']), async (req, res) => {
  const { email, role } = req.body;
  const inviterId = req.session.userId;

  // Validate input
  if (!email || !role) {
    return res.status(400).json({ 
      success: false, 
      error: 'Email and role are required' 
    });
  }

  // Validate role
  const validRoles = ['Admin', 'Member', 'View-Only'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid role. Must be Admin, Member, or View-Only' 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid email format' 
    });
  }

  try {
    // Check if user already exists (allow testing with specific email)
    const existingUser = await new Promise((resolve, reject) => {
      db.get('SELECT id, email FROM users WHERE email = ?', [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (existingUser && email !== 'carriedo78@gmail.com') {
      return res.status(400).json({ 
        success: false, 
        error: 'User with this email already exists' 
      });
    }

    // Check for existing invitations and rate limiting
    const invitationHistory = await new Promise((resolve, reject) => {
      db.all(
        `SELECT id, status, created_at, expires_at, email_attempts 
         FROM invitations 
         WHERE email = ? 
         AND created_at > datetime('now', '-1 hour')
         ORDER BY created_at DESC`, 
        [email], 
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // Count recent attempts (within last hour) - skip rate limiting for testing email
    const recentAttempts = invitationHistory.length;
    const maxAttemptsPerHour = 3;

    if (recentAttempts >= maxAttemptsPerHour && email !== 'carriedo78@gmail.com') {
      return res.status(429).json({ 
        success: false, 
        error: `Too many invitation attempts. Please wait before sending another invitation to ${email}.` 
      });
    }

    // Check if there's a valid pending/sent invitation
    const validInvitation = invitationHistory.find(inv => 
      (inv.status === 'pending' || inv.status === 'sent') && 
      new Date(inv.expires_at) > new Date()
    );

    // Check for failed invitations that can be retried
    const failedInvitation = invitationHistory.find(inv => 
      (inv.status === 'failed' || (inv.status === 'pending' && (inv.email_attempts || 0) === 0)) && 
      new Date(inv.expires_at) > new Date()
    );

    // If there's a valid invitation that was successfully sent, prevent duplicate (except for testing email)
    if (validInvitation && validInvitation.status === 'sent' && email !== 'carriedo78@gmail.com') {
      return res.status(400).json({ 
        success: false, 
        error: 'A valid invitation has already been sent to this email' 
      });
    }

    let invitationId;
    let token;
    
    // Get inviter's name for email
    const inviter = await new Promise((resolve, reject) => {
      db.get('SELECT name FROM users WHERE id = ?', [inviterId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    // If there's a failed invitation, reuse it; otherwise create new one (always create new for testing email)
    if (failedInvitation && email !== 'carriedo78@gmail.com') {
      // Reuse existing failed invitation
      invitationId = failedInvitation.id;
      token = await new Promise((resolve, reject) => {
        db.get('SELECT token FROM invitations WHERE id = ?', [invitationId], (err, row) => {
          if (err) reject(err);
          else resolve(row?.token);
        });
      });
      
      // Update the invitation with new role if different
      await new Promise((resolve, reject) => {
        db.run(
          'UPDATE invitations SET role = ?, last_attempt_at = datetime("now") WHERE id = ?',
          [role, invitationId],
          function(err) {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    } else {
      // Create new invitation
      token = generateInvitationToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      invitationId = await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO invitations (email, token, role, inviterId, expires_at, last_attempt_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
          [email, token, role, inviterId, expiresAt.toISOString()],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
    }

    // Send invitation email and track the attempt
    await sendInvitationEmailWithTracking(invitationId, email, token, inviter.name, role);

    // Get the expiration date from the database
    const invitationDetails = await new Promise((resolve, reject) => {
      db.get('SELECT expires_at FROM invitations WHERE id = ?', [invitationId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    res.json({
      success: true,
      message: 'Invitation sent successfully',
      data: {
        email,
        role,
        expiresAt: invitationDetails.expires_at
      }
    });

  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send invitation. Please try again.'
    });
  }
});

// Get team members (Admin only)
app.get('/api/team/members', checkPermission(['Admin']), (req, res) => {
  // For now, we'll return all users. In a multi-tenant system, 
  // you'd filter by organization/company
  db.all(
    'SELECT id, email, name, profilePictureUrl, role, created_at FROM users ORDER BY created_at DESC',
    [],
    (err, users) => {
      if (err) {
        console.error('Error fetching team members:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch team members'
        });
      }

      res.json({
        success: true,
        data: users
      });
    }
  );
});

// Update team member role (Admin only)
app.put('/api/team/members/:userId', checkPermission(['Admin']), (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const currentUserId = req.session.userId;

  // Validate role
  const validRoles = ['Admin', 'Member', 'View-Only'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid role. Must be Admin, Member, or View-Only'
    });
  }

  // Prevent user from changing their own role
  if (parseInt(userId) === currentUserId) {
    return res.status(400).json({
      success: false,
      error: 'You cannot change your own role'
    });
  }

  // Check if user exists
  db.get('SELECT id, email, name FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to update user role'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update user role
    db.run(
      'UPDATE users SET role = ?, updated_at = datetime("now") WHERE id = ?',
      [role, userId],
      function(err) {
        if (err) {
          console.error('Error updating user role:', err);
          return res.status(500).json({
            success: false,
            error: 'Failed to update user role'
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            error: 'User not found'
          });
        }

        res.json({
          success: true,
          message: `${user.name}'s role updated to ${role}`,
          data: {
            userId: parseInt(userId),
            email: user.email,
            name: user.name,
            role: role
          }
        });
      }
    );
  });
});

// Delete team member (Admin only)
app.delete('/api/team/members/:userId', checkPermission(['Admin']), (req, res) => {
  const { userId } = req.params;
  const currentUserId = req.session.userId;

  // Prevent user from deleting themselves
  if (parseInt(userId) === currentUserId) {
    return res.status(400).json({
      success: false,
      error: 'You cannot delete your own account'
    });
  }

  // Check if user exists and get their info
  db.get('SELECT id, email, name FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) {
      console.error('Error checking user:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to delete user'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Delete user (this will cascade delete their data due to foreign key constraints)
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
      if (err) {
        console.error('Error deleting user:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to delete user'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        message: `${user.name} has been removed from the team`,
        data: {
          deletedUser: {
            id: user.id,
            email: user.email,
            name: user.name
          }
        }
      });
    });
  });
});

// Invitation Acceptance API Endpoints (Public - no auth required)

// Verify invitation token (public endpoint)
app.get('/api/invitations/:token', (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      success: false,
      error: 'Token is required'
    });
  }

  // Look up the invitation by token
  db.get(
    `SELECT inv.*, u.name as inviter_name, u.email as inviter_email 
     FROM invitations inv 
     LEFT JOIN users u ON inv.inviterId = u.id 
     WHERE inv.token = ? AND inv.status IN ('pending', 'sent', 'failed') AND inv.expires_at > datetime('now')`,
    [token],
    (err, invitation) => {
      if (err) {
        console.error('Error verifying invitation token:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error while verifying invitation'
        });
      }

      if (!invitation) {
        return res.status(404).json({
          success: false,
          error: 'Invalid or expired invitation'
        });
      }

      // Return invitation details (without sensitive data)
      res.json({
        success: true,
        data: {
          email: invitation.email,
          role: invitation.role,
          inviterName: invitation.inviter_name || 'Unknown',
          inviterEmail: invitation.inviter_email,
          createdAt: invitation.created_at,
          expiresAt: invitation.expires_at
        }
      });
    }
  );
});

// Accept invitation and create user account (public endpoint)
app.post('/api/invitations/accept', async (req, res) => {
  const { token, userData } = req.body;

  if (!token || !userData) {
    return res.status(400).json({
      success: false,
      error: 'Token and user data are required'
    });
  }

  try {
    // Start a database transaction to ensure atomicity
    const result = await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // First, verify the invitation token again
        db.get(
          `SELECT * FROM invitations 
           WHERE token = ? AND status IN ('pending', 'sent', 'failed') AND expires_at > datetime('now')`,
          [token],
          (err, invitation) => {
            if (err) {
              db.run('ROLLBACK');
              return reject(new Error('Database error during token verification'));
            }

            if (!invitation) {
              db.run('ROLLBACK');
              return reject(new Error('Invalid or expired invitation'));
            }

            // Check if user already exists
            db.get(
              'SELECT id FROM users WHERE email = ?',
              [userData.email],
              (err, existingUser) => {
                if (err) {
                  db.run('ROLLBACK');
                  return reject(new Error('Database error checking existing user'));
                }

                if (existingUser) {
                  db.run('ROLLBACK');
                  // Special handling for testing email
                  if (userData.email === 'carriedo78@gmail.com') {
                    return reject(new Error('TESTING_MODE_DUPLICATE'));
                  }
                  return reject(new Error('User with this email already exists'));
                }

                // Create the new user with the role from the invitation
                db.run(
                  `INSERT INTO users (googleId, email, name, profilePictureUrl, provider, role, created_at, updated_at)
                   VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                  [
                    userData.googleId,
                    userData.email,
                    userData.name,
                    userData.profilePictureUrl,
                    userData.provider || 'google',
                    invitation.role
                  ],
                  function(err) {
                    if (err) {
                      db.run('ROLLBACK');
                      return reject(new Error('Failed to create user account'));
                    }

                    const newUserId = this.lastID;

                    // Mark the invitation as used
                    db.run(
                      `UPDATE invitations 
                       SET status = 'accepted', used_at = datetime('now') 
                       WHERE token = ?`,
                      [token],
                      (err) => {
                        if (err) {
                          db.run('ROLLBACK');
                          return reject(new Error('Failed to update invitation status'));
                        }

                        // Commit the transaction
                        db.run('COMMIT', (err) => {
                          if (err) {
                            return reject(new Error('Failed to commit transaction'));
                          }

                          // Create session for the new user
                          req.session.userId = newUserId;
                          req.session.save((err) => {
                            if (err) {
                              console.error('Session save error:', err);
                            }
                          });

                          resolve({
                            userId: newUserId,
                            user: {
                              id: newUserId,
                              googleId: userData.googleId,
                              email: userData.email,
                              name: userData.name,
                              profilePictureUrl: userData.profilePictureUrl,
                              provider: userData.provider || 'google',
                              role: invitation.role
                            }
                          });
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      });
    });

    // Create notification for the inviter
    db.get(
      'SELECT inviterId FROM invitations WHERE token = ?',
      [token],
      (err, invitation) => {
        if (!err && invitation) {
          createNotification(
            invitation.inviterId, 
            `${result.user.name} has accepted your team invitation and joined as ${result.user.role}`
          );
        }
      }
    );

    res.json({
      success: true,
      message: 'Account created successfully and invitation accepted',
      user: result.user
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(400).json({
      success: false,
      error: error.message || 'Failed to accept invitation'
    });
  }
});

// Notifications API Endpoints

// Get all notifications for the authenticated user
app.get('/api/notifications', requireAuth, (req, res) => {
  const userId = req.session.userId;
  
  db.all(
    'SELECT * FROM notifications WHERE recipientUserId = ? ORDER BY createdAt DESC LIMIT 50',
    [userId],
    (err, notifications) => {
      if (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
      }
      
      res.json({ success: true, data: notifications });
    }
  );
});

// Mark notification as read
app.patch('/api/notifications/:id/read', requireAuth, (req, res) => {
  const notificationId = req.params.id;
  const userId = req.session.userId;
  
  db.run(
    'UPDATE notifications SET isRead = 1 WHERE id = ? AND recipientUserId = ?',
    [notificationId, userId],
    function(err) {
      if (err) {
        console.error('Error marking notification as read:', err);
        return res.status(500).json({ success: false, error: 'Failed to mark notification as read' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ success: false, error: 'Notification not found' });
      }
      
      res.json({ success: true, message: 'Notification marked as read' });
    }
  );
});

// Mark all notifications as read for the user
app.patch('/api/notifications/read-all', requireAuth, (req, res) => {
  const userId = req.session.userId;
  
  db.run(
    'UPDATE notifications SET isRead = 1 WHERE recipientUserId = ? AND isRead = 0',
    [userId],
    function(err) {
      if (err) {
        console.error('Error marking all notifications as read:', err);
        return res.status(500).json({ success: false, error: 'Failed to mark notifications as read' });
      }
      
      res.json({ success: true, message: `${this.changes} notifications marked as read` });
    }
  );
});

// Get unread notification count
app.get('/api/notifications/unread-count', requireAuth, (req, res) => {
  const userId = req.session.userId;
  
  db.get(
    'SELECT COUNT(*) as count FROM notifications WHERE recipientUserId = ? AND isRead = 0',
    [userId],
    (err, result) => {
      if (err) {
        console.error('Error getting unread count:', err);
        return res.status(500).json({ success: false, error: 'Failed to get unread count' });
      }
      
      res.json({ success: true, count: result.count });
    }
  );
});

// Advanced Reporting API Endpoints

// Get advanced reports with complex aggregations
app.get('/api/reports', requireAuth, async (req, res) => {
  console.log('📊 GET /api/reports - Advanced reporting request from user:', req.session.userId);
  
  const { reportName } = req.query;
  const userId = req.session.userId;

  if (!reportName) {
    return res.status(400).json({
      success: false,
      error: 'reportName query parameter is required'
    });
  }

  try {
    let reportData;

    switch (reportName.toLowerCase()) {
      case 'profitability':
        reportData = await generateProfitabilityReport(userId);
        break;
      case 'budgetvsactuals':
      case 'budgetVsActuals': // Handle camelCase from frontend
        reportData = await generateBudgetVsActualsReport(userId);
        break;
      case 'cashflow':
      case 'cashFlow': // Handle camelCase from frontend
        reportData = await generateCashFlowReport(userId);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown report type: ${reportName}`
        });
    }

    console.log(`✅ Generated ${reportName} report for user ${userId}`);
    res.json({
      success: true,
      reportName,
      data: reportData
    });

  } catch (error) {
    console.error(`❌ Error generating ${reportName} report:`, error);
    console.error('Error details:', error.message, error.stack);
    res.status(500).json({
      success: false,
      error: `Failed to generate ${reportName} report: ${error.message}`
    });
  }
});

// Helper function to generate Quarterly Profitability Report
async function generateProfitabilityReport(userId) {
  return new Promise((resolve, reject) => {
    console.log('📈 Generating profitability report for user:', userId);

    // Get data for the last 4 quarters
    const query = `
      WITH quarter_data AS (
        SELECT 
          strftime('%Y', q.created_at) as year,
          CASE 
            WHEN strftime('%m', q.created_at) IN ('01', '02', '03') THEN 'Q1'
            WHEN strftime('%m', q.created_at) IN ('04', '05', '06') THEN 'Q2'
            WHEN strftime('%m', q.created_at) IN ('07', '08', '09') THEN 'Q3'
            WHEN strftime('%m', q.created_at) IN ('10', '11', '12') THEN 'Q4'
          END as quarter,
          q.quoteTotal as revenue,
          (
            SELECT COALESCE(SUM(li.actualCost), 0) 
            FROM line_items li 
            WHERE li.quoteId = q.id
          ) + (
            SELECT COALESCE(SUM(co.amount), 0)
            FROM change_orders co 
            WHERE co.quoteId = q.id AND co.status = 'Approved'
          ) as actualCosts
        FROM quotes q
        WHERE q.user_id = ? 
          AND q.status IN ('Approved', 'Working on it', 'In Progress', 'Completed')
          AND q.created_at >= date('now', '-15 months')
        ORDER BY q.created_at DESC
      )
      SELECT 
        year || '-' || quarter as period,
        year,
        quarter,
        COALESCE(SUM(revenue), 0) as totalRevenue,
        COALESCE(SUM(actualCosts), 0) as totalCosts,
        COALESCE(SUM(revenue) - SUM(actualCosts), 0) as netProfit,
        CASE 
          WHEN SUM(actualCosts) > 0 
          THEN ROUND(((SUM(revenue) - SUM(actualCosts)) / SUM(actualCosts)) * 100, 2)
          ELSE 0 
        END as profitMargin
      FROM quarter_data
      GROUP BY year, quarter
      ORDER BY year DESC, quarter DESC
      LIMIT 4
    `;

    db.all(query, [userId], (err, rows) => {
      if (err) {
        console.error('❌ Error executing profitability query:', err);
        reject(err);
        return;
      }

      // Ensure we have data for the last 4 quarters, fill with zeros if needed
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
      const currentYear = new Date().getFullYear();
      const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
      
      const reportData = [];
      const existingData = new Map(rows.map(row => [row.period, row]));

      // Generate last 4 quarters
      for (let i = 0; i < 4; i++) {
        let year = currentYear;
        let quarter = currentQuarter - i;
        
        if (quarter <= 0) {
          quarter += 4;
          year -= 1;
        }
        
        const period = `${year}-Q${quarter}`;
        const existing = existingData.get(period);
        
        if (existing) {
          reportData.unshift({
            period,
            year: parseInt(existing.year),
            quarter: existing.quarter,
            totalRevenue: parseFloat(existing.totalRevenue) || 0,
            totalCosts: parseFloat(existing.totalCosts) || 0,
            netProfit: parseFloat(existing.netProfit) || 0,
            profitMargin: parseFloat(existing.profitMargin) || 0
          });
        } else {
          reportData.unshift({
            period,
            year,
            quarter: `Q${quarter}`,
            totalRevenue: 0,
            totalCosts: 0,
            netProfit: 0,
            profitMargin: 0
          });
        }
      }

      console.log('✅ Profitability report generated with', reportData.length, 'quarters');
      resolve(reportData);
    });
  });
}

// Helper function to generate Budget vs Actuals Report
async function generateBudgetVsActualsReport(userId) {
  return new Promise((resolve, reject) => {
    console.log('📊 Generating budget vs actuals report for user:', userId);

    const query = `
      SELECT 
        p.id as projectId,
        p.name as projectName,
        p.status as projectStatus,
        p.created_at,
        p.updated_at,
        COALESCE(SUM(q.quoteTotal), 0) as totalBudget,
        COALESCE(SUM(
          (SELECT COALESCE(SUM(li.actualCost), 0) FROM line_items li WHERE li.quoteId = q.id) +
          (SELECT COALESCE(SUM(co.amount), 0) FROM change_orders co WHERE co.quoteId = q.id AND co.status = 'Approved')
        ), 0) as totalActual,
        COUNT(q.id) as totalQuotes
      FROM projects p
      LEFT JOIN quotes q ON p.name = q.project_name AND q.user_id = p.user_id
      WHERE p.user_id = ?
      GROUP BY p.id, p.name, p.status, p.created_at, p.updated_at
      ORDER BY p.updated_at DESC
    `;

    db.all(query, [userId], (err, rows) => {
      if (err) {
        console.error('❌ Error executing budget vs actuals query:', err);
        reject(err);
        return;
      }

      const reportData = rows.map(row => {
        const budget = parseFloat(row.totalBudget) || 0;
        const actual = parseFloat(row.totalActual) || 0;
        const variance = actual - budget;
        const variancePercentage = budget > 0 ? ((variance / budget) * 100) : 0;

        return {
          projectId: row.projectId,
          projectName: row.projectName,
          projectStatus: row.projectStatus,
          totalBudget: budget,
          totalActual: actual,
          variance,
          variancePercentage: Math.round(variancePercentage * 100) / 100,
          totalQuotes: row.totalQuotes,
          isOverBudget: variance > 0,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
      });

      console.log('✅ Budget vs actuals report generated with', reportData.length, 'projects');
      resolve(reportData);
    });
  });
}

// Helper function to generate Cash Flow Report
async function generateCashFlowReport(userId) {
  return new Promise((resolve, reject) => {
    console.log('💰 Generating cash flow report for user:', userId);

    // Get historical data for the past 6 months
    const historicalQuery = `
      SELECT 
        strftime('%Y-%m', q.created_at) as month,
        COALESCE(SUM(q.quoteTotal), 0) as revenue,
        COALESCE(SUM(
          (SELECT COALESCE(SUM(li.actualCost), 0) FROM line_items li WHERE li.quoteId = q.id) +
          (SELECT COALESCE(SUM(co.amount), 0) FROM change_orders co WHERE co.quoteId = q.id AND co.status = 'Approved')
        ), 0) as costs
      FROM quotes q
      WHERE q.user_id = ? 
        AND q.status IN ('Approved', 'Working on it', 'In Progress', 'Completed')
        AND q.created_at >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', q.created_at)
      ORDER BY month
    `;

    db.all(historicalQuery, [userId], (err, historicalRows) => {
      if (err) {
        console.error('❌ Error executing cash flow historical query:', err);
        reject(err);
        return;
      }

      // Calculate average monthly revenue for projections
      const historicalData = historicalRows.map(row => ({
        month: row.month,
        revenue: parseFloat(row.revenue) || 0,
        costs: parseFloat(row.costs) || 0,
        netCashFlow: (parseFloat(row.revenue) || 0) - (parseFloat(row.costs) || 0),
        type: 'historical'
      }));

      const avgRevenue = historicalData.length > 0 
        ? historicalData.reduce((sum, item) => sum + item.revenue, 0) / historicalData.length
        : 0;
      const avgCosts = historicalData.length > 0 
        ? historicalData.reduce((sum, item) => sum + item.costs, 0) / historicalData.length
        : 0;

      // Generate projected data for next 6 months
      const projectedData = [];
      const currentDate = new Date();
      
      for (let i = 1; i <= 6; i++) {
        const projectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
        const month = projectedDate.toISOString().substring(0, 7);
        
        // Add some variance to projections (±10%)
        const revenueVariance = (Math.random() - 0.5) * 0.2 + 1; // 0.9 to 1.1
        const costVariance = (Math.random() - 0.5) * 0.2 + 1;
        
        const projectedRevenue = avgRevenue * revenueVariance;
        const projectedCosts = avgCosts * costVariance;
        
        projectedData.push({
          month,
          revenue: Math.round(projectedRevenue),
          costs: Math.round(projectedCosts),
          netCashFlow: Math.round(projectedRevenue - projectedCosts),
          type: 'projected'
        });
      }

      // Fill missing historical months with zeros
      const allData = [];
      const historicalMap = new Map(historicalData.map(item => [item.month, item]));
      
      // Generate last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const month = date.toISOString().substring(0, 7);
        
        if (historicalMap.has(month)) {
          allData.push(historicalMap.get(month));
        } else {
          allData.push({
            month,
            revenue: 0,
            costs: 0,
            netCashFlow: 0,
            type: 'historical'
          });
        }
      }

      // Combine historical and projected data
      const reportData = [...allData, ...projectedData];

      console.log('✅ Cash flow report generated with', reportData.length, 'months');
      resolve({
        data: reportData,
        summary: {
          avgMonthlyRevenue: Math.round(avgRevenue),
          avgMonthlyCosts: Math.round(avgCosts),
          avgNetCashFlow: Math.round(avgRevenue - avgCosts),
          totalHistoricalRevenue: historicalData.reduce((sum, item) => sum + item.revenue, 0),
          totalProjectedRevenue: projectedData.reduce((sum, item) => sum + item.revenue, 0)
        }
      });
    });
  });
}

// Stripe Checkout API Endpoints

// Create Stripe Checkout Session (accessible to all users)
app.post('/api/create-checkout-session', async (req, res) => {
  if (!stripe) {
    return res.status(500).json({
      success: false,
      error: 'Stripe not configured. Please contact support.'
    });
  }

  try {
    const { priceId, email, name } = req.body;
    const userId = req.session.userId; // May be undefined for non-authenticated users

    if (!priceId) {
      return res.status(400).json({
        success: false,
        error: 'Price ID is required'
      });
    }

    let customerId = null;
    let sessionMetadata = { priceId };

    // If user is authenticated, try to get their existing Stripe customer
    if (userId) {
      const user = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
          if (err) reject(err);
          else resolve(user);
        });
      });

      if (user) {
        // Security check: Prevent users with active subscriptions from creating new ones
        if (user.subscriptionStatus === 'active') {
          return res.status(400).json({
            success: false,
            error: 'You already have an active subscription. Please manage your existing subscription in the settings.',
            code: 'EXISTING_SUBSCRIPTION'
          });
        }

        customerId = user.stripeCustomerId;
        sessionMetadata.userId = userId.toString();
        sessionMetadata.userEmail = user.email;

        // Create Stripe customer if doesn't exist
        if (!customerId) {
          const customer = await stripe.customers.create({
            email: user.email,
            name: user.name,
            metadata: {
              userId: userId.toString()
            }
          });

          customerId = customer.id;

          // Save customer ID to database
          await new Promise((resolve, reject) => {
            db.run(
              'UPDATE users SET stripeCustomerId = ? WHERE id = ?',
              [customerId, userId],
              function(err) {
                if (err) reject(err);
                else resolve(this);
              }
            );
          });

          console.log(`✅ Created Stripe customer ${customerId} for user ${userId}`);
        }
      }
    }

    // For non-authenticated users, we'll let Stripe handle customer creation during checkout
    // The customer will be created when they complete payment

    // Create checkout session
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscribe-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscribe-cancel`,
      metadata: sessionMetadata,
      allow_promotion_codes: true,
      billing_address_collection: 'required'
    };

    // If we have an existing customer, use it
    if (customerId) {
      sessionConfig.customer = customerId;
    } else {
      // For new customers, collect email during checkout
      sessionConfig.customer_email = email || undefined;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log(`✅ Created Stripe checkout session ${session.id}${userId ? ` for user ${userId}` : ' for anonymous user'}`);

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
      details: error.message
    });
  }
});

// Create Stripe Customer Portal Session (for subscription management)
app.post('/api/create-portal-session', requireAuth, async (req, res) => {
  if (!stripe) {
    return res.status(500).json({
      success: false,
      error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.'
    });
  }

  const userId = req.session.userId;
  console.log('🔄 Creating portal session for user:', userId);

  try {
    // Fetch user's Stripe Customer ID from database
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT stripeCustomerId, email, subscriptionStatus FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        error: 'No Stripe customer ID found. Please subscribe to a plan first.',
        requiresSubscription: true
      });
    }

    // Create the portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?tab=billing`
    });

    console.log('✅ Created Stripe portal session:', portalSession.id);

    res.json({
      success: true,
      url: portalSession.url
    });

  } catch (error) {
    console.error('Error creating portal session:', error);
    
    // Handle specific Stripe configuration error
    if (error.type === 'StripeInvalidRequestError' && 
        error.message.includes('No configuration provided')) {
      return res.status(500).json({
        success: false,
        error: 'Stripe Customer Portal is not configured. Please contact support.',
        details: 'The billing portal configuration needs to be set up in Stripe dashboard.'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create portal session',
      details: error.message
    });
  }
});

// Get current subscription details from Stripe
app.get('/api/subscription-details', requireAuth, async (req, res) => {
  if (!stripe) {
    return res.status(500).json({
      success: false,
      error: 'Stripe is not configured.'
    });
  }

  const userId = req.session.userId;

  try {
    // Get user's Stripe customer ID
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT stripeCustomerId, email, subscriptionStatus FROM users WHERE id = ?',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user || !user.stripeCustomerId) {
      return res.json({
        success: true,
        subscription: null,
        planName: 'Free Plan'
      });
    }

    // Get active subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: 'active',
      limit: 1
    });

    if (subscriptions.data.length === 0) {
      return res.json({
        success: true,
        subscription: null,
        planName: 'Free Plan'
      });
    }

    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    const productId = subscription.items.data[0].price.product;

    // Get product details to get the name
    const product = await stripe.products.retrieve(productId);

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        priceId: priceId,
        amount: subscription.items.data[0].price.unit_amount,
        currency: subscription.items.data[0].price.currency,
        interval: subscription.items.data[0].price.recurring.interval
      },
      planName: product.name || 'Pro Plan'
    });

  } catch (error) {
    console.error('Error fetching subscription details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription details',
      details: error.message
    });
  }
});

// Stripe Webhook for handling successful payments
app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    if (endpointSecret && sig) {
      // Verify webhook signature in production
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // For development without webhook setup, parse directly
      console.log('⚠️  Running in development mode without webhook verification');
      event = JSON.parse(req.body.toString());
    }
  } catch (err) {
    console.log(`⚠️  Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('✅ Checkout session completed:', session.id);

      try {
        // Get customer details from Stripe
        const customer = await stripe.customers.retrieve(session.customer);
        const subscription = await stripe.subscriptions.retrieve(session.subscription);

        // Check if user already exists (for authenticated checkouts)
        if (session.metadata.userId) {
          // Update existing user's subscription status
          db.run(
            'UPDATE users SET subscriptionStatus = ?, stripeCustomerId = ? WHERE id = ?',
            ['active', customer.id, session.metadata.userId],
            function(err) {
              if (err) {
                console.error('Error updating user subscription:', err);
              } else {
                console.log(`✅ Updated subscription for user ${session.metadata.userId}`);
                
                // Send real-time update to the user via WebSocket
                const userConnection = activeConnections.get(parseInt(session.metadata.userId));
                if (userConnection && userConnection.readyState === WebSocket.OPEN) {
                  userConnection.send(JSON.stringify({ 
                    type: 'user_updated',
                    message: 'Your subscription has been activated!' 
                  }));
                  console.log(`📡 Sent user_updated WebSocket message to user ${session.metadata.userId}`);
                }
              }
            }
          );
        } else {
          // Create new user account for anonymous checkout
          const userData = {
            email: customer.email,
            name: customer.name || customer.email.split('@')[0],
            stripeCustomerId: customer.id,
            subscriptionStatus: 'active'
          };

          db.run(
            'INSERT INTO users (email, name, stripeCustomerId, subscriptionStatus) VALUES (?, ?, ?, ?)',
            [userData.email, userData.name, userData.stripeCustomerId, userData.subscriptionStatus],
            function(err) {
              if (err) {
                console.error('Error creating user from webhook:', err);
              } else {
                console.log(`✅ Created new user account for ${userData.email} via Stripe checkout`);
                
                // Create welcome notification
                createNotification(this.lastID, `Welcome to Blueprint! Your ${subscription.items.data[0].price.nickname || 'subscription'} is now active.`);
                
                // Note: For new users created via webhook, we don't send WebSocket update 
                // since they're not yet connected. They'll get the updated status on login.
              }
            }
          );
        }
      } catch (error) {
        console.error('Error processing checkout completion:', error);
      }
      break;

    case 'customer.subscription.created':
      const newSubscription = event.data.object;
      console.log(`✅ New subscription created:`, newSubscription.id);

      try {
        // Update user subscription status to active when new subscription is created
        db.run(
          'UPDATE users SET subscriptionStatus = ? WHERE stripeCustomerId = ?',
          ['active', newSubscription.customer],
          function(err) {
            if (err) {
              console.error('Error updating subscription status to active:', err);
            } else {
              console.log(`✅ Updated subscription status to active for customer ${newSubscription.customer}`);
              
              // Get user ID and send WebSocket update
              db.get(
                'SELECT id FROM users WHERE stripeCustomerId = ?',
                [newSubscription.customer],
                (err, user) => {
                  if (!err && user) {
                    const userConnection = activeConnections.get(user.id);
                    if (userConnection && userConnection.readyState === WebSocket.OPEN) {
                      userConnection.send(JSON.stringify({
                        type: 'subscription_updated',
                        status: 'active',
                        message: 'Welcome back! Your subscription is now active.'
                      }));
                      console.log(`📡 Sent subscription activation notification to user ${user.id}`);
                    }
                  }
                }
              );
            }
          }
        );
      } catch (error) {
        console.error('Error processing new subscription:', error);
      }
      break;

    case 'customer.subscription.updated':
      const subscriptionUpdate = event.data.object;
      console.log(`✅ Subscription updated:`, subscriptionUpdate.id);

      try {
        // Update user subscription status based on subscription status
        let status;
        switch (subscriptionUpdate.status) {
          case 'active':
            status = 'active';
            break;
          case 'past_due':
            status = 'past_due';
            break;
          case 'canceled':
            status = 'canceled';
            break;
          case 'unpaid':
          case 'incomplete':
          case 'incomplete_expired':
            status = 'past_due';
            break;
          default:
            status = 'inactive';
        }

        db.run(
          'UPDATE users SET subscriptionStatus = ? WHERE stripeCustomerId = ?',
          [status, subscriptionUpdate.customer],
          function(err) {
            if (err) {
              console.error('Error updating subscription status:', err);
            } else {
              console.log(`✅ Updated subscription status to ${status} for customer ${subscriptionUpdate.customer}`);
              
              // Get user ID and send WebSocket update
              db.get(
                'SELECT id FROM users WHERE stripeCustomerId = ?',
                [subscriptionUpdate.customer],
                (err, user) => {
                  if (!err && user) {
                    const userConnection = activeConnections.get(user.id);
                    if (userConnection && userConnection.readyState === WebSocket.OPEN) {
                      userConnection.send(JSON.stringify({ 
                        type: 'user_updated',
                        message: `Your subscription status has been updated to ${status}` 
                      }));
                      console.log(`📡 Sent user_updated WebSocket message to user ${user.id} for status: ${status}`);
                    }
                  }
                }
              );
            }
          }
        );
      } catch (error) {
        console.error('Error processing subscription update:', error);
      }
      break;

    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log(`✅ Subscription deleted:`, deletedSubscription.id);

      try {
        db.run(
          'UPDATE users SET subscriptionStatus = ? WHERE stripeCustomerId = ?',
          ['canceled', deletedSubscription.customer],
          function(err) {
            if (err) {
              console.error('Error updating subscription status to canceled:', err);
            } else {
              console.log(`✅ Updated subscription status to canceled for customer ${deletedSubscription.customer}`);
              
              // Get user ID and send WebSocket update
              db.get(
                'SELECT id FROM users WHERE stripeCustomerId = ?',
                [deletedSubscription.customer],
                (err, user) => {
                  if (!err && user) {
                    const userConnection = activeConnections.get(user.id);
                    if (userConnection && userConnection.readyState === WebSocket.OPEN) {
                      userConnection.send(JSON.stringify({ 
                        type: 'user_updated',
                        message: 'Your subscription has been canceled' 
                      }));
                      console.log(`📡 Sent user_updated WebSocket message to user ${user.id} for canceled subscription`);
                    }
                  }
                }
              );
            }
          }
        );
      } catch (error) {
        console.error('Error processing subscription deletion:', error);
      }
      break;

    case 'invoice.payment_failed':
      const failedInvoice = event.data.object;
      console.log(`⚠️ Payment failed for invoice:`, failedInvoice.id);

      try {
        // Get the subscription from the invoice
        if (failedInvoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(failedInvoice.subscription);
          
          db.run(
            'UPDATE users SET subscriptionStatus = ? WHERE stripeCustomerId = ?',
            ['past_due', failedInvoice.customer],
            function(err) {
              if (err) {
                console.error('Error updating subscription status to past_due:', err);
              } else {
                console.log(`✅ Updated subscription status to past_due for customer ${failedInvoice.customer}`);
                
                // Get user ID and send WebSocket update
                db.get(
                  'SELECT id FROM users WHERE stripeCustomerId = ?',
                  [failedInvoice.customer],
                  (err, user) => {
                    if (!err && user) {
                      const userConnection = activeConnections.get(user.id);
                      if (userConnection && userConnection.readyState === WebSocket.OPEN) {
                        userConnection.send(JSON.stringify({ 
                          type: 'user_updated',
                          message: 'There was an issue with your payment. Please update your payment method.' 
                        }));
                        console.log(`📡 Sent user_updated WebSocket message to user ${user.id} for payment failure`);
                      }
                    }
                  }
                );
              }
            }
          );
        }
      } catch (error) {
        console.error('Error processing payment failure:', error);
      }
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({received: true});
});

// Test endpoint to create sample notifications (for testing purposes)
app.post('/api/notifications/test', requireAuth, (req, res) => {
  const userId = req.session.userId;
  const { message } = req.body;
  
  const testMessage = message || `Test notification created at ${new Date().toLocaleString()}`;
  createNotification(userId, testMessage);
  
  res.json({ success: true, message: 'Test notification created' });
});

// Vendors & Subcontractors API Endpoints

// Get all vendors for the authenticated user
app.get('/api/vendors', requireAuth, (req, res) => {
  console.log('🔍 GET /api/vendors - Fetching vendors for user:', req.session.userId);
  
  db.all(
    `SELECT 
      id, name, specialty, contact_email as contactEmail, phone, rating, user_id, 
      created_at, updated_at
     FROM vendors 
     WHERE user_id = ? 
     ORDER BY name ASC`,
    [req.session.userId],
    (err, rows) => {
      if (err) {
        console.error('❌ Error fetching vendors:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch vendors'
        });
      }

      console.log(`✅ Found ${rows.length} vendors for user ${req.session.userId}`);
      res.json({
        success: true,
        data: rows
      });
    }
  );
});

// Create a new vendor for the authenticated user
app.post('/api/vendors', checkPermission(['Admin', 'Member']), (req, res) => {
  console.log('📝 POST /api/vendors - Creating vendor for user:', req.session.userId);
  
  const { name, specialty, contactEmail, phone, rating } = req.body;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Vendor name is required'
    });
  }

  const vendorData = {
    name: name.trim(),
    specialty: specialty?.trim() || '',
    contactEmail: contactEmail?.trim() || '',
    phone: phone?.trim() || '',
    rating: rating ? parseFloat(rating) : null,
    user_id: req.session.userId
  };

  db.run(
    `INSERT INTO vendors (name, specialty, contact_email, phone, rating, user_id, created_at, updated_at) 
     VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
    [vendorData.name, vendorData.specialty, vendorData.contactEmail, vendorData.phone, vendorData.rating, vendorData.user_id],
    function (err) {
      if (err) {
        console.error('❌ Error creating vendor:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to create vendor'
        });
      }

      console.log(`✅ Vendor created successfully with ID: ${this.lastID}`);
      
      // Create notification
      createNotification(
        req.session.userId,
        `New vendor "${vendorData.name}" has been added to your directory`
      );

      res.status(201).json({
        success: true,
        data: {
          id: this.lastID,
          name: vendorData.name,
          specialty: vendorData.specialty,
          contactEmail: vendorData.contactEmail,
          phone: vendorData.phone,
          rating: vendorData.rating,
          user_id: vendorData.user_id
        }
      });
    }
  );
});

// Update an existing vendor for the authenticated user
app.put('/api/vendors/:vendorId', checkPermission(['Admin', 'Member']), (req, res) => {
  const vendorId = parseInt(req.params.vendorId);
  console.log('✏️ PUT /api/vendors/:vendorId - Updating vendor for user:', req.session.userId);
  
  if (!vendorId || isNaN(vendorId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid vendor ID'
    });
  }

  const { name, specialty, contactEmail, phone, rating } = req.body;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Vendor name is required'
    });
  }

  const vendorData = {
    name: name.trim(),
    specialty: specialty?.trim() || '',
    contactEmail: contactEmail?.trim() || '',
    phone: phone?.trim() || '',
    rating: rating ? parseFloat(rating) : null
  };

  // First verify the vendor belongs to the user
  db.get(
    'SELECT id, name FROM vendors WHERE id = ? AND user_id = ?',
    [vendorId, req.session.userId],
    (err, vendor) => {
      if (err) {
        console.error('❌ Error verifying vendor ownership:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to verify vendor ownership'
        });
      }

      if (!vendor) {
        return res.status(404).json({
          success: false,
          error: 'Vendor not found or access denied'
        });
      }

      // Update the vendor
      db.run(
        `UPDATE vendors 
         SET name = ?, specialty = ?, contact_email = ?, phone = ?, rating = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [vendorData.name, vendorData.specialty, vendorData.contactEmail, vendorData.phone, vendorData.rating, vendorId, req.session.userId],
        function (err) {
          if (err) {
            console.error('❌ Error updating vendor:', err);
            return res.status(500).json({
              success: false,
              error: 'Failed to update vendor'
            });
          }

          if (this.changes === 0) {
            return res.status(404).json({
              success: false,
              error: 'Vendor not found'
            });
          }

          console.log(`✅ Vendor updated successfully: ${vendorData.name}`);
          
          // Create notification
          createNotification(
            req.session.userId,
            `Vendor "${vendorData.name}" has been updated`
          );

          res.json({
            success: true,
            data: {
              id: vendorId,
              name: vendorData.name,
              specialty: vendorData.specialty,
              contactEmail: vendorData.contactEmail,
              phone: vendorData.phone,
              rating: vendorData.rating
            }
          });
        }
      );
    }
  );
});

// Delete a vendor for the authenticated user
app.delete('/api/vendors/:vendorId', checkPermission(['Admin', 'Member']), (req, res) => {
  const vendorId = parseInt(req.params.vendorId);
  console.log('🗑️ DELETE /api/vendors/:vendorId - Deleting vendor for user:', req.session.userId);
  
  if (!vendorId || isNaN(vendorId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid vendor ID'
    });
  }

  // First get vendor details for notification
  db.get(
    'SELECT id, name FROM vendors WHERE id = ? AND user_id = ?',
    [vendorId, req.session.userId],
    (err, vendor) => {
      if (err) {
        console.error('❌ Error fetching vendor for deletion:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch vendor'
        });
      }

      if (!vendor) {
        return res.status(404).json({
          success: false,
          error: 'Vendor not found or access denied'
        });
      }

      // Delete the vendor
      db.run(
        'DELETE FROM vendors WHERE id = ? AND user_id = ?',
        [vendorId, req.session.userId],
        function (err) {
          if (err) {
            console.error('❌ Error deleting vendor:', err);
            return res.status(500).json({
              success: false,
              error: 'Failed to delete vendor'
            });
          }

          if (this.changes === 0) {
            return res.status(404).json({
              success: false,
              error: 'Vendor not found'
            });
          }

          console.log(`✅ Vendor deleted successfully: ${vendor.name}`);
          
          // Create notification
          createNotification(
            req.session.userId,
            `Vendor "${vendor.name}" has been removed from your directory`
          );

          res.json({
            success: true,
            message: 'Vendor deleted successfully'
          });
        }
      );
    }
  );
});

// ===== COST CODES API ROUTES (Budget vs Actuals Feature) =====

// GET all cost codes for user (custom + templates)
app.get('/api/cost-codes', requireAuth, (req, res) => {
  console.log('🔍 GET /api/cost-codes - Fetching cost codes for user:', req.session.userId);
  
  const { division, search, includeTemplates = 'true' } = req.query;
  const userId = req.session.userId;
  
  let query = `
    SELECT id, code, description, division, is_template, user_id, created_at, updated_at
    FROM cost_codes
    WHERE (user_id = ? OR ${includeTemplates === 'true' ? 'is_template = 1' : 'is_template = 0'})
  `;
  
  const params = [userId];
  
  // Add division filter if provided
  if (division) {
    query += ` AND division = ?`;
    params.push(division);
  }
  
  // Add search filter if provided
  if (search) {
    query += ` AND (code LIKE ? OR description LIKE ?)`;
    const searchPattern = `%${search}%`;
    params.push(searchPattern, searchPattern);
  }
  
  query += ` ORDER BY is_template DESC, division ASC, code ASC`;
  
  db.all(query, params, (err, codes) => {
    if (err) {
      console.error('❌ Error fetching cost codes:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch cost codes'
      });
    }
    
    console.log(`✅ Found ${codes.length} cost codes for user ${userId}`);
    res.json({
      success: true,
      data: codes
    });
  });
});

// GET CSI MasterFormat templates only
app.get('/api/cost-codes/templates', requireAuth, (req, res) => {
  console.log('🔍 GET /api/cost-codes/templates - Fetching CSI templates');
  
  const query = `
    SELECT id, code, description, division
    FROM cost_codes
    WHERE is_template = 1
    ORDER BY division ASC, code ASC
  `;
  
  db.all(query, [], (err, templates) => {
    if (err) {
      console.error('❌ Error fetching CSI templates:', err);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch CSI templates'
      });
    }
    
    // Group by division for easier browsing
    const groupedByDivision = templates.reduce((acc, template) => {
      const division = template.division || 'Other';
      if (!acc[division]) {
        acc[division] = [];
      }
      acc[division].push(template);
      return acc;
    }, {});
    
    console.log(`✅ Found ${templates.length} CSI templates across ${Object.keys(groupedByDivision).length} divisions`);
    res.json({
      success: true,
      data: {
        templates,
        groupedByDivision
      }
    });
  });
});

// POST create custom cost code
app.post('/api/cost-codes', checkPermission(['Admin', 'Member']), (req, res) => {
  console.log('📝 POST /api/cost-codes - Creating cost code for user:', req.session.userId);
  
  const { code, description, division } = req.body;
  const userId = req.session.userId;
  
  // Validation
  if (!code || !code.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Cost code is required'
    });
  }
  
  if (!description || !description.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Description is required'
    });
  }
  
  // Check for duplicate code for this user
  db.get(
    'SELECT id FROM cost_codes WHERE code = ? AND user_id = ?',
    [code.trim(), userId],
    (err, existing) => {
      if (err) {
        console.error('❌ Error checking for duplicate cost code:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to validate cost code'
        });
      }
      
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'A cost code with this code already exists in your library'
        });
      }
      
      // Insert new cost code
      db.run(
        `INSERT INTO cost_codes (code, description, division, is_template, user_id)
         VALUES (?, ?, ?, 0, ?)`,
        [code.trim(), description.trim(), division?.trim() || null, userId],
        function(err) {
          if (err) {
            console.error('❌ Error creating cost code:', err);
            return res.status(500).json({
              success: false,
              error: 'Failed to create cost code'
            });
          }
          
          const newCodeId = this.lastID;
          console.log(`✅ Cost code created successfully with ID: ${newCodeId}`);
          
          // Fetch the newly created code
          db.get(
            'SELECT * FROM cost_codes WHERE id = ?',
            [newCodeId],
            (err, newCode) => {
              if (err) {
                console.error('❌ Error fetching new cost code:', err);
                return res.status(500).json({
                  success: false,
                  error: 'Cost code created but failed to retrieve'
                });
              }
              
              createNotification(
                userId,
                `New cost code "${code.trim()}" added to your library`
              );
              
              res.status(201).json({
                success: true,
                data: newCode
              });
            }
          );
        }
      );
    }
  );
});

// POST import CSI template to user's library
app.post('/api/cost-codes/import-template', checkPermission(['Admin', 'Member']), (req, res) => {
  console.log('📥 POST /api/cost-codes/import-template - Importing template for user:', req.session.userId);
  
  const { templateId, customDescription } = req.body;
  const userId = req.session.userId;
  
  if (!templateId) {
    return res.status(400).json({
      success: false,
      error: 'Template ID is required'
    });
  }
  
  // Get the template
  db.get(
    'SELECT * FROM cost_codes WHERE id = ? AND is_template = 1',
    [templateId],
    (err, template) => {
      if (err) {
        console.error('❌ Error fetching template:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch template'
        });
      }
      
      if (!template) {
        return res.status(404).json({
          success: false,
          error: 'Template not found'
        });
      }
      
      // Check if user already has this code
      db.get(
        'SELECT id FROM cost_codes WHERE code = ? AND user_id = ?',
        [template.code, userId],
        (err, existing) => {
          if (err) {
            console.error('❌ Error checking for existing code:', err);
            return res.status(500).json({
              success: false,
              error: 'Failed to validate code'
            });
          }
          
          if (existing) {
            return res.status(400).json({
              success: false,
              error: 'You already have a cost code with this code'
            });
          }
          
          // Copy template to user's library
          const description = customDescription?.trim() || template.description;
          
          db.run(
            `INSERT INTO cost_codes (code, description, division, is_template, user_id)
             VALUES (?, ?, ?, 0, ?)`,
            [template.code, description, template.division, userId],
            function(err) {
              if (err) {
                console.error('❌ Error importing template:', err);
                return res.status(500).json({
                  success: false,
                  error: 'Failed to import template'
                });
              }
              
              const newCodeId = this.lastID;
              console.log(`✅ Template imported successfully with ID: ${newCodeId}`);
              
              // Fetch the newly created code
              db.get(
                'SELECT * FROM cost_codes WHERE id = ?',
                [newCodeId],
                (err, newCode) => {
                  if (err) {
                    console.error('❌ Error fetching imported code:', err);
                    return res.status(500).json({
                      success: false,
                      error: 'Template imported but failed to retrieve'
                    });
                  }
                  
                  createNotification(
                    userId,
                    `CSI template "${template.code}" imported to your library`
                  );
                  
                  res.status(201).json({
                    success: true,
                    data: newCode
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// PUT update custom cost code
app.put('/api/cost-codes/:id', checkPermission(['Admin', 'Member']), (req, res) => {
  const codeId = parseInt(req.params.id);
  const userId = req.session.userId;
  console.log(`🔄 PUT /api/cost-codes/${codeId} - Updating cost code for user:`, userId);
  
  if (!codeId || isNaN(codeId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid cost code ID'
    });
  }
  
  const { code, description, division } = req.body;
  
  // Validation
  if (!code || !code.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Cost code is required'
    });
  }
  
  if (!description || !description.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Description is required'
    });
  }
  
  // Verify ownership and prevent editing templates
  db.get(
    'SELECT * FROM cost_codes WHERE id = ? AND user_id = ?',
    [codeId, userId],
    (err, costCode) => {
      if (err) {
        console.error('❌ Error fetching cost code:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch cost code'
        });
      }
      
      if (!costCode) {
        return res.status(404).json({
          success: false,
          error: 'Cost code not found or access denied'
        });
      }
      
      if (costCode.is_template) {
        return res.status(403).json({
          success: false,
          error: 'Cannot edit CSI MasterFormat templates. Import it to your library first.'
        });
      }
      
      // Check for duplicate code (excluding current code)
      db.get(
        'SELECT id FROM cost_codes WHERE code = ? AND user_id = ? AND id != ?',
        [code.trim(), userId, codeId],
        (err, duplicate) => {
          if (err) {
            console.error('❌ Error checking for duplicate code:', err);
            return res.status(500).json({
              success: false,
              error: 'Failed to validate code'
            });
          }
          
          if (duplicate) {
            return res.status(400).json({
              success: false,
              error: 'A cost code with this code already exists in your library'
            });
          }
          
          // Update the cost code
          db.run(
            `UPDATE cost_codes 
             SET code = ?, description = ?, division = ?, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND user_id = ?`,
            [code.trim(), description.trim(), division?.trim() || null, codeId, userId],
            function(err) {
              if (err) {
                console.error('❌ Error updating cost code:', err);
                return res.status(500).json({
                  success: false,
                  error: 'Failed to update cost code'
                });
              }
              
              if (this.changes === 0) {
                return res.status(404).json({
                  success: false,
                  error: 'Cost code not found'
                });
              }
              
              console.log(`✅ Cost code ${codeId} updated successfully`);
              
              // Fetch updated code
              db.get(
                'SELECT * FROM cost_codes WHERE id = ?',
                [codeId],
                (err, updatedCode) => {
                  if (err) {
                    console.error('❌ Error fetching updated cost code:', err);
                    return res.status(500).json({
                      success: false,
                      error: 'Cost code updated but failed to retrieve'
                    });
                  }
                  
                  createNotification(
                    userId,
                    `Cost code "${code.trim()}" updated successfully`
                  );
                  
                  res.json({
                    success: true,
                    data: updatedCode
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

// DELETE custom cost code
app.delete('/api/cost-codes/:id', checkPermission(['Admin', 'Member']), (req, res) => {
  const codeId = parseInt(req.params.id);
  const userId = req.session.userId;
  console.log(`🗑️ DELETE /api/cost-codes/${codeId} - Deleting cost code for user:`, userId);
  
  if (!codeId || isNaN(codeId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid cost code ID'
    });
  }
  
  // Verify ownership and prevent deleting templates
  db.get(
    'SELECT * FROM cost_codes WHERE id = ? AND user_id = ?',
    [codeId, userId],
    (err, costCode) => {
      if (err) {
        console.error('❌ Error fetching cost code:', err);
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch cost code'
        });
      }
      
      if (!costCode) {
        return res.status(404).json({
          success: false,
          error: 'Cost code not found or access denied'
        });
      }
      
      if (costCode.is_template) {
        return res.status(403).json({
          success: false,
          error: 'Cannot delete CSI MasterFormat templates'
        });
      }
      
      // Check if code is in use by line items or change orders
      db.get(
        `SELECT 
          (SELECT COUNT(*) FROM line_items WHERE cost_code_id = ?) as lineItemCount,
          (SELECT COUNT(*) FROM change_orders WHERE cost_code_id = ?) as changeOrderCount`,
        [codeId, codeId],
        (err, usage) => {
          if (err) {
            console.error('❌ Error checking cost code usage:', err);
            return res.status(500).json({
              success: false,
              error: 'Failed to check cost code usage'
            });
          }
          
          const totalUsage = (usage.lineItemCount || 0) + (usage.changeOrderCount || 0);
          
          if (totalUsage > 0) {
            return res.status(400).json({
              success: false,
              error: `Cannot delete cost code. It is currently used by ${usage.lineItemCount} line item(s) and ${usage.changeOrderCount} change order(s).`,
              usage: {
                lineItems: usage.lineItemCount,
                changeOrders: usage.changeOrderCount
              }
            });
          }
          
          // Delete the cost code
          db.run(
            'DELETE FROM cost_codes WHERE id = ? AND user_id = ?',
            [codeId, userId],
            function(err) {
              if (err) {
                console.error('❌ Error deleting cost code:', err);
                return res.status(500).json({
                  success: false,
                  error: 'Failed to delete cost code'
                });
              }
              
              if (this.changes === 0) {
                return res.status(404).json({
                  success: false,
                  error: 'Cost code not found'
                });
              }
              
              console.log(`✅ Cost code ${codeId} deleted successfully`);
              
              createNotification(
                userId,
                `Cost code "${costCode.code}" has been removed from your library`
              );
              
              res.json({
                success: true,
                message: 'Cost code deleted successfully'
              });
            }
          );
        }
      );
    }
  );
});

// ===== END COST CODES API ROUTES =====

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

// QuickBooks Integration API Endpoints

// Initialize QuickBooks OAuth configuration
const QUICKBOOKS_CLIENT_ID = process.env.QUICKBOOKS_CLIENT_ID;
const QUICKBOOKS_CLIENT_SECRET = process.env.QUICKBOOKS_CLIENT_SECRET;
const QUICKBOOKS_REDIRECT_URI = process.env.QUICKBOOKS_REDIRECT_URI || 'http://localhost:4000/api/integrations/quickbooks/callback';
const QUICKBOOKS_SCOPE = 'com.intuit.quickbooks.accounting';

if (QUICKBOOKS_CLIENT_ID && QUICKBOOKS_CLIENT_SECRET) {
  console.log('✅ QuickBooks OAuth credentials configured');
} else {
  console.warn('⚠️  QuickBooks credentials not configured - integration features will be disabled');
}

// Helper function to encrypt tokens
function encryptToken(token) {
  const algorithm = 'aes-256-gcm';
  const secretKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-please!';
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key);
  cipher.setAAD(Buffer.from('quickbooks-token'));
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

// Helper function to decrypt tokens
function decryptToken(encryptedData) {
  const algorithm = 'aes-256-gcm';
  const secretKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production-please!';
  const key = crypto.scryptSync(secretKey, 'salt', 32);
  
  const decipher = crypto.createDecipher(algorithm, key);
  decipher.setAAD(Buffer.from('quickbooks-token'));
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Get integration status
app.get('/api/integrations/status', requireAuth, (req, res) => {
  const userId = req.session.userId;
  
  db.get(
    'SELECT realm_id, expires_at FROM quickbooks_tokens WHERE user_id = ?',
    [userId],
    (err, row) => {
      if (err) {
        console.error('Database error checking QuickBooks status:', err);
        return res.status(500).json({ error: 'Failed to check integration status' });
      }
      
      const isConnected = !!row;
      const isExpired = row ? new Date(row.expires_at) < new Date() : false;
      
      res.json({
        success: true,
        integrations: {
          quickbooks: {
            connected: isConnected && !isExpired,
            realmId: row?.realm_id || null,
            expired: isExpired
          }
        }
      });
    }
  );
});

// Initiate QuickBooks OAuth flow
app.get('/api/integrations/quickbooks/connect', requireAuth, (req, res) => {
  if (!QUICKBOOKS_CLIENT_ID || !QUICKBOOKS_CLIENT_SECRET) {
    return res.status(500).json({ error: 'QuickBooks integration not configured' });
  }
  
  const userId = req.session.userId;
  const state = crypto.randomBytes(32).toString('hex');
  
  // Store state in session for validation
  req.session.qbOAuthState = state;
  req.session.qbUserId = userId;
  
  const oauthUrl = `https://appcenter.intuit.com/connect/oauth2?` +
    `client_id=${QUICKBOOKS_CLIENT_ID}&` +
    `scope=${encodeURIComponent(QUICKBOOKS_SCOPE)}&` +
    `redirect_uri=${encodeURIComponent(QUICKBOOKS_REDIRECT_URI)}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `state=${state}`;
  
  console.log(`🔗 Redirecting user ${userId} to QuickBooks OAuth: ${oauthUrl}`);
  res.redirect(oauthUrl);
});

// Helper function to handle OAuth redirects (popup or normal)
const handleOAuthRedirect = (res, success, message) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>QuickBooks OAuth ${success ? 'Success' : 'Error'}</title>
      </head>
      <body>
        <script>
          if (window.opener) {
            // If opened in popup, notify parent and close
            window.opener.postMessage({ 
              type: 'quickbooks_oauth_${success ? 'success' : 'error'}',
              message: '${message}'
            }, '*');
            window.close();
          } else {
            // If opened in same tab, redirect normally
            window.location.href = '/integrations?${success ? 'success=connected' : `error=${message}`}';
          }
        </script>
        <p>${success ? 'QuickBooks connected successfully!' : 'OAuth error occurred.'} This window will close automatically.</p>
      </body>
    </html>
  `;
  res.send(html);
};

// Handle QuickBooks OAuth callback
app.get('/api/integrations/quickbooks/callback', (req, res) => {
  const { code, state, realmId, error } = req.query;
  
  if (error) {
    console.error('QuickBooks OAuth error:', error);
    return handleOAuthRedirect(res, false, 'oauth_denied');
  }
  
  if (!code || !state || !realmId) {
    console.error('Missing required OAuth parameters');
    return handleOAuthRedirect(res, false, 'invalid_callback');
  }
  
  // Validate state parameter
  if (state !== req.session.qbOAuthState) {
    console.error('Invalid OAuth state parameter');
    return handleOAuthRedirect(res, false, 'invalid_state');
  }
  
  const userId = req.session.qbUserId;
  if (!userId) {
    console.error('No user ID in session');
    return handleOAuthRedirect(res, false, 'session_expired');
  }
  
  // Exchange code for tokens using OAuth 2.0
  const tokenEndpoint = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
  const auth = Buffer.from(`${QUICKBOOKS_CLIENT_ID}:${QUICKBOOKS_CLIENT_SECRET}`).toString('base64');
  
  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: QUICKBOOKS_REDIRECT_URI
  });
  
  https.request(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(tokenParams.toString())
    }
  }, (tokenRes) => {
    let tokenData = '';
    tokenRes.on('data', (chunk) => tokenData += chunk);
    tokenRes.on('end', () => {
      try {
        const tokenResponse = JSON.parse(tokenData);
        
        if (tokenResponse.error) {
          console.error('QuickBooks token exchange error:', tokenResponse);
          return handleOAuthRedirect(res, false, 'token_exchange_failed');
        }
        
        // Calculate expiration time
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokenResponse.expires_in);
        
        // Encrypt tokens before storage
        const encryptedAccessToken = encryptToken(tokenResponse.access_token);
        const encryptedRefreshToken = encryptToken(tokenResponse.refresh_token);
        
        // Store tokens in database
        db.run(
          `INSERT OR REPLACE INTO quickbooks_tokens 
           (user_id, access_token, refresh_token, realm_id, expires_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [
            userId,
            JSON.stringify(encryptedAccessToken),
            JSON.stringify(encryptedRefreshToken),
            realmId,
            expiresAt.toISOString()
          ],
          function(err) {
            if (err) {
              console.error('Database error storing QuickBooks tokens:', err);
              return handleOAuthRedirect(res, false, 'storage_failed');
            }
            
            console.log(`✅ QuickBooks tokens stored for user ${userId}, realm ${realmId}`);
            
            // Clean up session
            delete req.session.qbOAuthState;
            delete req.session.qbUserId;
            
            // Create notification
            createNotification(userId, 'QuickBooks integration connected successfully');
            
            handleOAuthRedirect(res, true, 'connected');
          }
        );
        
      } catch (parseErr) {
        console.error('Error parsing token response:', parseErr);
        handleOAuthRedirect(res, false, 'token_exchange_failed');
      }
    });
  }).on('error', (err) => {
    console.error('Token request error:', err);
    handleOAuthRedirect(res, false, 'token_exchange_failed');
  }).end(tokenParams.toString());
});

// Sync data from QuickBooks
app.post('/api/integrations/quickbooks/sync', requireAuth, async (req, res) => {
  const userId = req.session.userId;
  
  try {
    // Get stored tokens
    db.get(
      'SELECT access_token, refresh_token, realm_id, expires_at FROM quickbooks_tokens WHERE user_id = ?',
      [userId],
      async (err, row) => {
        if (err) {
          console.error('Database error retrieving QuickBooks tokens:', err);
          return res.status(500).json({ error: 'Failed to retrieve integration credentials' });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'QuickBooks integration not found' });
        }
        
        // Check if token is expired
        if (new Date(row.expires_at) < new Date()) {
          return res.status(401).json({ error: 'QuickBooks token expired', expired: true });
        }
        
        try {
          // Decrypt tokens
          const accessTokenData = JSON.parse(row.access_token);
          const accessToken = decryptToken(accessTokenData);
          
          // Make API call to QuickBooks using REST API
          const baseUrl = process.env.NODE_ENV === 'production' 
            ? 'https://quickbooks-api.intuit.com' 
            : 'https://sandbox-quickbooks.intuit.com';
          
          const url = `${baseUrl}/v3/company/${row.realm_id}/query?query=SELECT * FROM Purchase MAXRESULTS 100`;
          const options = {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            }
          };
          
          https.get(url, options, (apiRes) => {
            let data = '';
            apiRes.on('data', (chunk) => data += chunk);
            apiRes.on('end', () => {
              try {
                const response = JSON.parse(data);
                
                if (response.Fault) {
                  console.error('QuickBooks API error:', response.Fault);
                  return res.status(500).json({ error: 'Failed to fetch data from QuickBooks' });
                }
                
                // Transform QuickBooks data for Blueprint format
                const expenses = response.QueryResponse?.Purchase?.map(purchase => ({
                  id: purchase.Id,
                  date: purchase.TxnDate,
                  amount: purchase.TotalAmt,
                  description: purchase.PrivateNote || 'QuickBooks Purchase',
                  vendor: purchase.EntityRef?.name || 'Unknown Vendor',
                  account: purchase.AccountRef?.name || 'Unknown Account',
                  source: 'quickbooks'
                })) || [];
                
                console.log(`📊 Retrieved ${expenses.length} expenses from QuickBooks for user ${userId}`);
                
                // Create notification
                createNotification(userId, `Synced ${expenses.length} expenses from QuickBooks`);
                
                res.json({
                  success: true,
                  data: {
                    expenses,
                    syncedAt: new Date().toISOString(),
                    source: 'quickbooks'
                  }
                });
                
              } catch (parseErr) {
                console.error('Error parsing QuickBooks response:', parseErr);
                res.status(500).json({ error: 'Failed to process QuickBooks data' });
              }
            });
          }).on('error', (err) => {
            console.error('QuickBooks API request error:', err);
            res.status(500).json({ error: 'Failed to connect to QuickBooks API' });
          });
          
        } catch (decryptError) {
          console.error('Token decryption error:', decryptError);
          return res.status(500).json({ error: 'Failed to decrypt integration credentials' });
        }
      }
    );
    
  } catch (error) {
    console.error('QuickBooks sync error:', error);
    res.status(500).json({ error: 'Failed to sync QuickBooks data' });
  }
});

// Disconnect QuickBooks integration
app.delete('/api/integrations/quickbooks/disconnect', requireAuth, (req, res) => {
  const userId = req.session.userId;
  
  db.run(
    'DELETE FROM quickbooks_tokens WHERE user_id = ?',
    [userId],
    function(err) {
      if (err) {
        console.error('Database error disconnecting QuickBooks:', err);
        return res.status(500).json({ error: 'Failed to disconnect QuickBooks integration' });
      }
      
      console.log(`🔌 QuickBooks integration disconnected for user ${userId}`);
      
      // Create notification
      createNotification(userId, 'QuickBooks integration disconnected');
      
      res.json({
        success: true,
        message: 'QuickBooks integration disconnected successfully'
      });
    }
  );
});

// ===== ACTUAL COSTS API ROUTES (Budget vs Actuals Feature - Phase 2) =====

// GET all actual costs for a project
app.get('/api/projects/:id/actuals', requireAuth, (req, res) => {
  console.log('🔍 GET /api/projects/:id/actuals - Fetching actual costs for project:', req.params.id);

  const projectId = parseInt(req.params.id);
  const userId = req.session.userId;

  if (!projectId || isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project ID'
    });
  }

  // First verify the project belongs to the user
  db.get(
    'SELECT id FROM projects WHERE id = ? AND user_id = ?',
    [projectId, userId],
    (err, project) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error while verifying project ownership'
        });
      }

      if (!project) {
        console.log('❌ Project not found or access denied');
        return res.status(404).json({
          success: false,
          error: 'Project not found or access denied'
        });
      }

      // Fetch all actual costs with related data
      const query = `
        SELECT 
          ac.id,
          ac.project_id,
          ac.cost_code_id,
          ac.amount,
          ac.date,
          ac.description,
          ac.vendor_id,
          ac.receipt_url,
          ac.created_by,
          ac.created_at,
          ac.updated_at,
          cc.code as cost_code,
          cc.description as cost_code_description,
          cc.division as cost_code_division,
          v.name as vendor_name,
          u.email as created_by_email
        FROM actual_costs ac
        LEFT JOIN cost_codes cc ON ac.cost_code_id = cc.id
        LEFT JOIN vendors v ON ac.vendor_id = v.id
        LEFT JOIN users u ON ac.created_by = u.id
        WHERE ac.project_id = ? AND ac.user_id = ? AND ac.deleted_at IS NULL
        ORDER BY ac.date DESC, ac.created_at DESC
      `;

      db.all(query, [projectId, userId], (err, actuals) => {
        if (err) {
          console.error('❌ Error fetching actual costs:', err);
          return res.status(500).json({
            success: false,
            error: 'Failed to fetch actual costs'
          });
        }

        console.log(`✅ Found ${actuals.length} actual costs for project ${projectId}`);
        res.json({
          success: true,
          data: actuals
        });
      });
    }
  );
});

// POST a new actual cost entry
app.post('/api/projects/:id/actuals', checkPermission(['Admin', 'Member']), (req, res) => {
  console.log('📝 POST /api/projects/:id/actuals - Creating actual cost for project:', req.params.id);

  const projectId = parseInt(req.params.id);
  const userId = req.session.userId;
  const { cost_code_id, amount, date, description, vendor_id } = req.body;

  // Validation
  if (!projectId || isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project ID'
    });
  }

  if (!cost_code_id) {
    return res.status(400).json({
      success: false,
      error: 'Cost code is required'
    });
  }

  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({
      success: false,
      error: 'Amount is required and must be greater than 0'
    });
  }

  if (!date) {
    return res.status(400).json({
      success: false,
      error: 'Date is required'
    });
  }

  // Verify project belongs to user
  db.get(
    'SELECT id, name FROM projects WHERE id = ? AND user_id = ?',
    [projectId, userId],
    (err, project) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error while verifying project ownership'
        });
      }

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found or access denied'
        });
      }

      // Insert the actual cost
      db.run(
        `INSERT INTO actual_costs (
          project_id, cost_code_id, amount, date, description, vendor_id, 
          created_by, user_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [projectId, cost_code_id, parseFloat(amount), date, description || null, vendor_id || null, userId, userId],
        function (err) {
          if (err) {
            console.error('❌ Database error creating actual cost:', err);
            return res.status(500).json({
              success: false,
              error: 'Failed to create actual cost entry'
            });
          }

          const actualCostId = this.lastID;
          console.log(`✅ Actual cost created with ID: ${actualCostId}`);

          // Fetch the created actual cost with related data
          db.get(
            `SELECT 
              ac.id, ac.project_id, ac.cost_code_id, ac.amount, ac.date, 
              ac.description, ac.vendor_id, ac.created_by, ac.created_at, ac.updated_at,
              cc.code as cost_code, cc.description as cost_code_description,
              v.name as vendor_name
            FROM actual_costs ac
            LEFT JOIN cost_codes cc ON ac.cost_code_id = cc.id
            LEFT JOIN vendors v ON ac.vendor_id = v.id
            WHERE ac.id = ?`,
            [actualCostId],
            (err, actualCost) => {
              if (err) {
                console.error('❌ Error fetching created actual cost:', err);
                return res.status(500).json({
                  success: false,
                  error: 'Actual cost created but error fetching details'
                });
              }

              // Create notification for large expenses (over $1000)
              if (parseFloat(amount) > 1000) {
                createNotification(
                  userId,
                  `Large expense logged: $${parseFloat(amount).toLocaleString()} for project "${project.title}"`
                );
              }

              res.status(201).json({
                success: true,
                message: 'Actual cost created successfully',
                data: actualCost
              });
            }
          );
        }
      );
    }
  );
});

// PUT update an actual cost entry
app.put('/api/projects/:projectId/actuals/:actualId', checkPermission(['Admin', 'Member']), (req, res) => {
  console.log('✏️ PUT /api/projects/:projectId/actuals/:actualId - Updating actual cost');

  const projectId = parseInt(req.params.projectId);
  const actualId = parseInt(req.params.actualId);
  const userId = req.session.userId;
  const { cost_code_id, amount, date, description, vendor_id } = req.body;

  if (!projectId || isNaN(projectId) || !actualId || isNaN(actualId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project ID or actual cost ID'
    });
  }

  // Verify ownership
  db.get(
    'SELECT id FROM actual_costs WHERE id = ? AND project_id = ? AND user_id = ? AND deleted_at IS NULL',
    [actualId, projectId, userId],
    (err, actualCost) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error while verifying actual cost ownership'
        });
      }

      if (!actualCost) {
        return res.status(404).json({
          success: false,
          error: 'Actual cost not found or access denied'
        });
      }

      // Build dynamic update query
      const updates = [];
      const values = [];

      if (cost_code_id !== undefined) {
        updates.push('cost_code_id = ?');
        values.push(cost_code_id);
      }

      if (amount !== undefined && !isNaN(parseFloat(amount))) {
        updates.push('amount = ?');
        values.push(parseFloat(amount));
      }

      if (date !== undefined) {
        updates.push('date = ?');
        values.push(date);
      }

      if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
      }

      if (vendor_id !== undefined) {
        updates.push('vendor_id = ?');
        values.push(vendor_id);
      }

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields provided for update'
        });
      }

      updates.push("updated_at = datetime('now')");
      values.push(actualId, userId);

      const query = `UPDATE actual_costs SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`;

      db.run(query, values, function (err) {
        if (err) {
          console.error('❌ Database error updating actual cost:', err);
          return res.status(500).json({
            success: false,
            error: 'Failed to update actual cost'
          });
        }

        if (this.changes === 0) {
          return res.status(404).json({
            success: false,
            error: 'Actual cost not found or no changes made'
          });
        }

        console.log(`✅ Actual cost ${actualId} updated successfully`);

        // Fetch updated actual cost
        db.get(
          `SELECT 
            ac.id, ac.project_id, ac.cost_code_id, ac.amount, ac.date, 
            ac.description, ac.vendor_id, ac.created_by, ac.created_at, ac.updated_at,
            cc.code as cost_code, cc.description as cost_code_description,
            v.name as vendor_name
          FROM actual_costs ac
          LEFT JOIN cost_codes cc ON ac.cost_code_id = cc.id
          LEFT JOIN vendors v ON ac.vendor_id = v.id
          WHERE ac.id = ?`,
          [actualId],
          (err, updatedActualCost) => {
            if (err) {
              console.error('❌ Error fetching updated actual cost:', err);
              return res.status(500).json({
                success: false,
                error: 'Actual cost updated but error fetching details'
              });
            }

            res.json({
              success: true,
              message: 'Actual cost updated successfully',
              data: updatedActualCost
            });
          }
        );
      });
    }
  );
});

// DELETE an actual cost entry (soft delete)
app.delete('/api/projects/:projectId/actuals/:actualId', checkPermission(['Admin']), (req, res) => {
  console.log('🗑️ DELETE /api/projects/:projectId/actuals/:actualId - Deleting actual cost');

  const projectId = parseInt(req.params.projectId);
  const actualId = parseInt(req.params.actualId);
  const userId = req.session.userId;

  if (!projectId || isNaN(projectId) || !actualId || isNaN(actualId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project ID or actual cost ID'
    });
  }

  // Verify ownership
  db.get(
    'SELECT id FROM actual_costs WHERE id = ? AND project_id = ? AND user_id = ? AND deleted_at IS NULL',
    [actualId, projectId, userId],
    (err, actualCost) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error while verifying actual cost ownership'
        });
      }

      if (!actualCost) {
        return res.status(404).json({
          success: false,
          error: 'Actual cost not found or access denied'
        });
      }

      // Soft delete the actual cost
      db.run(
        "UPDATE actual_costs SET deleted_at = datetime('now'), updated_at = datetime('now') WHERE id = ? AND user_id = ?",
        [actualId, userId],
        function (err) {
          if (err) {
            console.error('❌ Database error deleting actual cost:', err);
            return res.status(500).json({
              success: false,
              error: 'Failed to delete actual cost'
            });
          }

          if (this.changes === 0) {
            return res.status(404).json({
              success: false,
              error: 'Actual cost not found'
            });
          }

          console.log(`✅ Actual cost ${actualId} deleted successfully`);
          res.json({
            success: true,
            message: 'Actual cost deleted successfully'
          });
        }
      );
    }
  );
});

// ===== BASELINE BUDGET API ROUTES (Budget vs Actuals Feature - Phase 2.5) =====

// GET baseline budget for a project
app.get('/api/projects/:id/baseline', requireAuth, (req, res) => {
  console.log('🔍 GET /api/projects/:id/baseline - Fetching baseline for project:', req.params.id);

  const projectId = parseInt(req.params.id);
  const userId = req.session.userId;

  if (!projectId || isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project ID'
    });
  }

  // Verify project ownership
  db.get(
    'SELECT id FROM projects WHERE id = ? AND user_id = ?',
    [projectId, userId],
    (err, project) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error while verifying project ownership'
        });
      }

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found or access denied'
        });
      }

      // Fetch baseline
      db.get(
        `SELECT 
          bb.id,
          bb.project_id,
          bb.baseline_data,
          bb.frozen_at,
          bb.frozen_by,
          bb.notes,
          u.email as frozen_by_email
        FROM budget_baselines bb
        LEFT JOIN users u ON bb.frozen_by = u.id
        WHERE bb.project_id = ? AND bb.user_id = ?`,
        [projectId, userId],
        (err, baseline) => {
          if (err) {
            console.error('❌ Error fetching baseline:', err);
            return res.status(500).json({
              success: false,
              error: 'Failed to fetch baseline budget'
            });
          }

          if (!baseline) {
            console.log(`✅ No baseline found for project ${projectId}`);
            return res.json({
              success: true,
              data: null
            });
          }

          // Parse baseline_data JSON
          try {
            baseline.baseline_data = JSON.parse(baseline.baseline_data);
          } catch (e) {
            console.error('❌ Error parsing baseline data:', e);
            baseline.baseline_data = null;
          }

          console.log(`✅ Baseline found for project ${projectId}`);
          res.json({
            success: true,
            data: baseline
          });
        }
      );
    }
  );
});

// POST freeze baseline budget
app.post('/api/projects/:id/baseline/freeze', checkPermission(['Admin']), (req, res) => {
  console.log('🔒 POST /api/projects/:id/baseline/freeze - Freezing baseline for project:', req.params.id);

  const projectId = parseInt(req.params.id);
  const userId = req.session.userId;
  const { notes } = req.body;

  if (!projectId || isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project ID'
    });
  }

  // Verify project ownership
  db.get(
    'SELECT id, name FROM projects WHERE id = ? AND user_id = ?',
    [projectId, userId],
    (err, project) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error while verifying project ownership'
        });
      }

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found or access denied'
        });
      }

      // Check if baseline already exists
      db.get(
        'SELECT id FROM budget_baselines WHERE project_id = ? AND user_id = ?',
        [projectId, userId],
        (err, existingBaseline) => {
          if (err) {
            console.error('❌ Database error:', err);
            return res.status(500).json({
              success: false,
              error: 'Database error while checking existing baseline'
            });
          }

          if (existingBaseline) {
            return res.status(400).json({
              success: false,
              error: 'Baseline already frozen for this project. Unfreeze first to create a new baseline.'
            });
          }

          // Calculate current budget from approved quotes and change orders
          const budgetQuery = `
            SELECT 
              li.cost_code_id,
              cc.code,
              cc.description,
              cc.division,
              SUM(li.estimatedCost) as budgeted_amount,
              COUNT(li.id) as line_item_count
            FROM line_items li
            INNER JOIN quotes q ON li.quoteId = q.id
            LEFT JOIN cost_codes cc ON li.cost_code_id = cc.id
            WHERE q.project_id = ? AND q.status = 'Approved' AND q.user_id = ?
            GROUP BY li.cost_code_id
          `;

          db.all(budgetQuery, [projectId, userId], (err, budgetByCode) => {
            if (err) {
              console.error('❌ Database error calculating budget:', err);
              return res.status(500).json({
                success: false,
                error: 'Failed to calculate budget for baseline'
              });
            }

            // Also get change orders
            const changeOrdersQuery = `
              SELECT 
                co.cost_code_id,
                cc.code,
                cc.description,
                SUM(co.amount) as total_change_orders
              FROM change_orders co
              INNER JOIN quotes q ON co.quoteId = q.id
              LEFT JOIN cost_codes cc ON co.cost_code_id = cc.id
              WHERE q.project_id = ? AND co.status = 'Approved' AND co.user_id = ?
              GROUP BY co.cost_code_id
            `;

            db.all(changeOrdersQuery, [projectId, userId], (err, changeOrdersByCode) => {
              if (err) {
                console.error('❌ Database error calculating change orders:', err);
                return res.status(500).json({
                  success: false,
                  error: 'Failed to calculate change orders for baseline'
                });
              }

              // Combine budget and change orders
              const baselineData = {
                budgetByCode: budgetByCode || [],
                changeOrdersByCode: changeOrdersByCode || [],
                frozenAt: new Date().toISOString(),
                projectTitle: project.title
              };

              // Insert baseline
              db.run(
                `INSERT INTO budget_baselines (project_id, baseline_data, frozen_at, frozen_by, notes, user_id)
                 VALUES (?, ?, datetime('now'), ?, ?, ?)`,
                [projectId, JSON.stringify(baselineData), userId, notes || null, userId],
                function (err) {
                  if (err) {
                    console.error('❌ Database error creating baseline:', err);
                    return res.status(500).json({
                      success: false,
                      error: 'Failed to freeze baseline budget'
                    });
                  }

                  const baselineId = this.lastID;
                  console.log(`✅ Baseline frozen successfully with ID: ${baselineId}`);

                  // Create notification
                  createNotification(
                    userId,
                    `Budget baseline frozen for project "${project.title}"`
                  );

                  res.status(201).json({
                    success: true,
                    message: 'Baseline budget frozen successfully',
                    data: {
                      id: baselineId,
                      project_id: projectId,
                      baseline_data: baselineData,
                      frozen_at: new Date().toISOString(),
                      frozen_by: userId,
                      notes: notes || null
                    }
                  });
                }
              );
            });
          });
        }
      );
    }
  );
});

// DELETE unfreeze baseline budget
app.delete('/api/projects/:id/baseline', checkPermission(['Admin']), (req, res) => {
  console.log('🔓 DELETE /api/projects/:id/baseline - Unfreezing baseline for project:', req.params.id);

  const projectId = parseInt(req.params.id);
  const userId = req.session.userId;

  if (!projectId || isNaN(projectId)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid project ID'
    });
  }

  // Verify project ownership
  db.get(
    'SELECT id, name FROM projects WHERE id = ? AND user_id = ?',
    [projectId, userId],
    (err, project) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({
          success: false,
          error: 'Database error while verifying project ownership'
        });
      }

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found or access denied'
        });
      }

      // Delete baseline
      db.run(
        'DELETE FROM budget_baselines WHERE project_id = ? AND user_id = ?',
        [projectId, userId],
        function (err) {
          if (err) {
            console.error('❌ Database error deleting baseline:', err);
            return res.status(500).json({
              success: false,
              error: 'Failed to unfreeze baseline budget'
            });
          }

          if (this.changes === 0) {
            return res.status(404).json({
              success: false,
              error: 'No baseline found for this project'
            });
          }

          console.log(`✅ Baseline unfrozen for project ${projectId}`);

          // Create notification
          createNotification(
            userId,
            `Budget baseline unfrozen for project "${project.title}"`
          );

          res.json({
            success: true,
            message: 'Baseline budget unfrozen successfully'
          });
        }
      );
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

server.listen(PORT, () => console.log(`Server running on port ${PORT} with WebSocket support`));
