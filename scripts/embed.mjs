#!/usr/bin/env node

/**
 * Knowledge Base Embedding Script
 * 
 * This script reads all markdown files from the knowledge-base directory,
 * generates vector embeddings using Transformers.js, and uploads them
 * to Supabase for semantic search capabilities.
 * 
 * Usage: node scripts/embed.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { pipeline } from '@xenova/transformers';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
import dotenv from 'dotenv';
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

// Initialize the embedding pipeline
let embedder;

async function initializeEmbedder() {
  console.log('🔄 Initializing embedding model...');
  try {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('✅ Embedding model loaded successfully');
  } catch (error) {
    console.error('❌ Failed to load embedding model:', error);
    process.exit(1);
  }
}

async function createKnowledgeTable() {
  console.log('🔄 Creating knowledge table in Supabase...');
  
  // First, check if the table exists and create it if not
  const { error } = await supabase.rpc('create_knowledge_table_if_not_exists');
  
  if (error && !error.message.includes('already exists')) {
    console.error('❌ Failed to create knowledge table:', error);
    
    // Fallback: try to create via SQL
    console.log('🔄 Attempting fallback table creation...');
    const { error: createError } = await supabase
      .from('knowledge')
      .select('id')
      .limit(1);
    
    if (createError && createError.message.includes('does not exist')) {
      console.error('❌ Knowledge table does not exist and cannot be created automatically.');
      console.log('📝 Please create the table manually in Supabase with this SQL:');
      console.log(`
CREATE TABLE knowledge (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  file_path TEXT NOT NULL,
  embedding VECTOR(384),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create an index for vector similarity search
CREATE INDEX ON knowledge USING ivfflat (embedding vector_cosine_ops);
      `);
      process.exit(1);
    }
  }
  
  console.log('✅ Knowledge table ready');
}

async function generateEmbedding(text) {
  try {
    // Clean and truncate text if needed (model has token limits)
    const cleanText = text.replace(/\n+/g, ' ').trim();
    const truncatedText = cleanText.substring(0, 1000); // Limit to ~1000 chars
    
    const output = await embedder(truncatedText, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.error('❌ Failed to generate embedding:', error);
    throw error;
  }
}

async function readMarkdownFiles() {
  const knowledgeBasePath = path.join(__dirname, '..', 'knowledge-base');
  
  if (!fs.existsSync(knowledgeBasePath)) {
    console.error('❌ Knowledge base directory not found:', knowledgeBasePath);
    process.exit(1);
  }
  
  const files = fs.readdirSync(knowledgeBasePath)
    .filter(file => file.endsWith('.md'));
  
  if (files.length === 0) {
    console.warn('⚠️  No markdown files found in knowledge-base directory');
    return [];
  }
  
  console.log(`📚 Found ${files.length} markdown files`);
  
  const documents = [];
  
  for (const file of files) {
    const filePath = path.join(knowledgeBasePath, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract title from filename or first heading
    const title = extractTitle(content, file);
    
    documents.push({
      title,
      content,
      file_path: file
    });
    
    console.log(`📄 Loaded: ${file} (${content.length} chars)`);
  }
  
  return documents;
}

function extractTitle(content, filename) {
  // Try to extract title from first heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  
  // Fallback to filename without extension
  return path.basename(filename, '.md')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
}

async function uploadToSupabase(documents) {
  console.log('🔄 Processing and uploading documents...');
  
  // Clear existing knowledge base
  console.log('🗑️  Clearing existing knowledge base...');
  const { error: deleteError } = await supabase
    .from('knowledge')
    .delete()
    .neq('id', 0); // Delete all records
  
  if (deleteError) {
    console.warn('⚠️  Could not clear existing data:', deleteError.message);
  }
  
  const enrichedDocuments = [];
  
  for (let i = 0; i < documents.length; i++) {
    const doc = documents[i];
    console.log(`🔄 Processing ${i + 1}/${documents.length}: ${doc.title}`);
    
    try {
      // Generate embedding for the content
      const embedding = await generateEmbedding(doc.content);
      
      enrichedDocuments.push({
        title: doc.title,
        content: doc.content,
        file_path: doc.file_path,
        embedding
      });
      
      console.log(`✅ Generated embedding for: ${doc.title} (${embedding.length} dimensions)`);
    } catch (error) {
      console.error(`❌ Failed to process ${doc.title}:`, error);
      continue;
    }
  }
  
  if (enrichedDocuments.length === 0) {
    console.error('❌ No documents were successfully processed');
    process.exit(1);
  }
  
  // Upload to Supabase
  console.log('📤 Uploading to Supabase...');
  const { data, error } = await supabase
    .from('knowledge')
    .insert(enrichedDocuments);
  
  if (error) {
    console.error('❌ Failed to upload to Supabase:', error);
    process.exit(1);
  }
  
  console.log(`✅ Successfully uploaded ${enrichedDocuments.length} documents to knowledge base`);
}

async function testSimilaritySearch() {
  console.log('🔍 Testing similarity search...');
  
  try {
    const testQuery = "What is a change order in construction?";
    const queryEmbedding = await generateEmbedding(testQuery);
    
    // Perform similarity search
    const { data, error } = await supabase.rpc('search_knowledge', {
      query_embedding: queryEmbedding,
      match_threshold: 0.1,
      match_count: 3
    });
    
    if (error) {
      console.warn('⚠️  Similarity search test failed (this is expected if RPC function is not set up):', error.message);
      console.log('📝 You can create the search function in Supabase with:');
      console.log(`
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
      `);
    } else {
      console.log(`✅ Similarity search test successful! Found ${data.length} matches`);
      if (data.length > 0) {
        console.log(`📄 Top match: "${data[0].title}" (similarity: ${data[0].similarity.toFixed(3)})`);
      }
    }
  } catch (error) {
    console.warn('⚠️  Could not test similarity search:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting knowledge base embedding process...\n');
  
  try {
    // Initialize the embedding model
    await initializeEmbedder();
    
    // Ensure the knowledge table exists
    await createKnowledgeTable();
    
    // Read all markdown files
    const documents = await readMarkdownFiles();
    
    if (documents.length === 0) {
      console.log('ℹ️  No documents to process');
      return;
    }
    
    // Process and upload to Supabase
    await uploadToSupabase(documents);
    
    // Test the similarity search
    await testSimilaritySearch();
    
    console.log('\n🎉 Knowledge base embedding complete!');
    console.log('📋 Next steps:');
    console.log('1. Set up the search_knowledge RPC function in Supabase (see output above)');
    console.log('2. Start your server with: npm run dev');
    console.log('3. Test the enhanced AI context endpoint');
    
  } catch (error) {
    console.error('❌ Process failed:', error);
    process.exit(1);
  }
}

// Add dotenv to package.json if not already present
const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

if (!packageJson.dependencies.dotenv && !packageJson.devDependencies?.dotenv) {
  console.log('📦 Adding dotenv dependency...');
  packageJson.dependencies.dotenv = '^16.4.5';
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Added dotenv to package.json');
}

// Run the main function
main();
