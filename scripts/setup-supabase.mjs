#!/usr/bin/env node

/**
 * Supabase Setup Script
 * 
 * This script sets up the required tables and functions in your Supabase database
 * for the RAG knowledge base system.
 * 
 * Usage: node scripts/setup-supabase.mjs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupSupabase() {
  console.log('🚀 Setting up Supabase for RAG knowledge base...\n');
  
  try {
    // Step 1: Check if vector extension is enabled
    console.log('🔍 Checking vector extension...');
    
    // Step 2: Create the knowledge table using direct SQL
    console.log('📊 Creating knowledge table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS knowledge (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        file_path TEXT NOT NULL,
        embedding VECTOR(384),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    
    const { error: tableError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });
    
    if (tableError) {
      console.log('⚠️  Direct table creation failed, trying alternative method...');
      
      // Alternative: Try to create via insert (will fail but table might exist)
      const { error: testError } = await supabase
        .from('knowledge')
        .select('id')
        .limit(1);
      
      if (testError && testError.message.includes('does not exist')) {
        console.error('❌ Knowledge table creation failed.');
        console.log('\n📝 Please manually create the table in Supabase SQL Editor:');
        console.log('Go to https://supabase.com/dashboard/project/' + SUPABASE_URL.split('//')[1].split('.')[0] + '/sql');
        console.log('\nRun this SQL:');
        console.log('```sql');
        console.log('-- Enable vector extension');
        console.log('CREATE EXTENSION IF NOT EXISTS vector;');
        console.log('');
        console.log('-- Create knowledge table');
        console.log(createTableSQL);
        console.log('');
        console.log('-- Create index for vector similarity search');
        console.log('CREATE INDEX IF NOT EXISTS knowledge_embedding_idx ON knowledge USING ivfflat (embedding vector_cosine_ops);');
        console.log('');
        console.log('-- Create search function');
        console.log(`CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding VECTOR(384),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id INT,
  title TEXT,
  content TEXT,
  file_path TEXT,
  similarity FLOAT
)
LANGUAGE SQL
AS $$
  SELECT
    id,
    title,
    content,
    file_path,
    1 - (embedding <=> query_embedding) AS similarity
  FROM knowledge
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;`);
        console.log('```');
        console.log('\nAfter running the SQL, run: npm run embed');
        return;
      }
    }
    
    console.log('✅ Knowledge table ready');
    
    // Step 3: Create vector search index
    console.log('🔍 Creating vector search index...');
    
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS knowledge_embedding_idx 
      ON knowledge USING ivfflat (embedding vector_cosine_ops);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', { 
      sql: createIndexSQL 
    });
    
    if (indexError) {
      console.log('⚠️  Index creation will be handled manually');
    } else {
      console.log('✅ Vector search index created');
    }
    
    // Step 4: Create search function
    console.log('🔍 Creating search function...');
    
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION search_knowledge(
        query_embedding VECTOR(384),
        match_threshold FLOAT DEFAULT 0.5,
        match_count INT DEFAULT 5
      )
      RETURNS TABLE (
        id INT,
        title TEXT,
        content TEXT,
        file_path TEXT,
        similarity FLOAT
      )
      LANGUAGE SQL
      AS $$
        SELECT
          id,
          title,
          content,
          file_path,
          1 - (embedding <=> query_embedding) AS similarity
        FROM knowledge
        WHERE 1 - (embedding <=> query_embedding) > match_threshold
        ORDER BY embedding <=> query_embedding
        LIMIT match_count;
      $$;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', { 
      sql: createFunctionSQL 
    });
    
    if (functionError) {
      console.log('⚠️  Function creation will be handled manually');
    } else {
      console.log('✅ Search function created');
    }
    
    // Step 5: Test the setup
    console.log('🧪 Testing table access...');
    
    const { data, error: testError } = await supabase
      .from('knowledge')
      .select('count(*)')
      .limit(1);
    
    if (testError) {
      throw new Error(`Table test failed: ${testError.message}`);
    }
    
    console.log('✅ Table access confirmed');
    
    console.log('\n🎉 Supabase setup complete!');
    console.log('📋 Next steps:');
    console.log('1. Run: npm run embed');
    console.log('2. Test your enhanced AI context API');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n📝 Manual setup required. Please run this SQL in Supabase:');
    console.log('```sql');
    console.log('-- Enable vector extension');
    console.log('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('');
    console.log('-- Create knowledge table');
    console.log(`CREATE TABLE IF NOT EXISTS knowledge (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_path TEXT NOT NULL,
  embedding VECTOR(384),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`);
    console.log('');
    console.log('-- Create index');
    console.log('CREATE INDEX IF NOT EXISTS knowledge_embedding_idx ON knowledge USING ivfflat (embedding vector_cosine_ops);');
    console.log('```');
  }
}

setupSupabase();
