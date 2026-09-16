# Blueprint RAG System Setup Guide

This guide explains how to set up and use the enhanced Blueprint application with Retrieval-Augmented Generation (RAG) capabilities powered by Supabase vector database.

## 🎯 What's New

Your Blueprint application now features a **dual-search RAG system** that combines:
- **Private Data**: Your company's specific projects, vendors, and quotes from SQLite
- **Knowledge Base**: General construction industry knowledge from Supabase vector database

## 🏗️ Architecture Overview

```
User Query → AI Context API → [SQLite Search] + [Supabase Vector Search] → Combined Context → AI Assistant
```

### Components Added:
1. **Supabase Vector Database**: Stores construction knowledge with semantic search
2. **Embedding Pipeline**: Uses Transformers.js to create vector embeddings
3. **Enhanced API**: `/api/ai-context` now supports query-based knowledge retrieval
4. **Embedding Script**: `scripts/embed.mjs` to populate the knowledge base

## 📋 Setup Instructions

### Step 1: Supabase Setup

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for the project to be fully initialized

2. **Enable Vector Extension**:
   ```sql
   -- In Supabase SQL Editor, run:
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. **Create the Knowledge Table**:
   ```sql
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
   ```

4. **Create the Search Function**:
   ```sql
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
   ```

### Step 2: Environment Configuration

1. **Get Supabase Credentials**:
   - Go to Settings → API in your Supabase dashboard
   - Copy your Project URL and anon/public key

2. **Update .env File**:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

### Step 3: Populate Knowledge Base

1. **Run the Embedding Script**:
   ```bash
   node scripts/embed.mjs
   ```

   This script will:
   - Read all `.md` files from `knowledge-base/` directory
   - Generate vector embeddings using Transformers.js
   - Upload content and embeddings to Supabase

2. **Expected Output**:
   ```
   🚀 Starting knowledge base embedding process...
   ✅ Embedding model loaded successfully
   ✅ Knowledge table ready
   📚 Found 3 markdown files
   📄 Loaded: what-is-fp&a.md (2156 chars)
   📄 Loaded: change-orders-explained.md (1842 chars)
   📄 Loaded: construction-billing-cycles.md (2053 chars)
   ✅ Successfully uploaded 3 documents to knowledge base
   🎉 Knowledge base embedding complete!
   ```

### Step 4: Start the Enhanced Server

```bash
npm run dev
```

The server will start with:
- ✅ Supabase client initialized
- ✅ Embedding model loaded for similarity search
- 🚀 Enhanced AI context endpoint ready

## 🔧 API Usage

### Enhanced AI Context Endpoint

**Endpoint**: `GET /api/ai-context?query=your_question_here`

**Example Request**:
```javascript
fetch('/api/ai-context?query=What is a change order?', {
  credentials: 'include'
})
```

**Response Structure**:
```json
{
  "context": "# Company Business Data\\n\\n## 🎯 User Query\\n...\\n## 📚 Relevant Knowledge Base Information\\n...",
  "sources": {
    "privateData": true,
    "knowledgeBase": true,
    "query": "What is a change order?"
  },
  "rawData": {
    "projects": [...],
    "vendors": [...],
    "quotes": [...]
  }
}
```

### How It Works

1. **Query Processing**: When a query is provided, the system generates a vector embedding
2. **Dual Search**: 
   - Searches user's private SQLite data (projects, vendors, quotes)
   - Performs semantic search on Supabase knowledge base
3. **Context Combination**: Merges both results into a comprehensive context
4. **AI Guidelines**: Adds instructions for the AI to use both data sources

## 📚 Knowledge Base Management

### Adding New Knowledge

1. **Add Markdown Files**: Place new `.md` files in the `knowledge-base/` directory
2. **Re-run Embedding**: Execute `node scripts/embed.mjs` to update the vector database
3. **File Format**: Use clear headings and structured content for best results

### Current Knowledge Base

- `what-is-fp&a.md`: Financial Planning & Analysis in construction
- `change-orders-explained.md`: Understanding construction change orders
- `construction-billing-cycles.md`: Construction billing and payment processes

## 🧪 Testing the System

### 1. Test Without Query (Private Data Only)
```bash
curl -X GET "http://localhost:4000/api/ai-context" \
  -H "Cookie: your-session-cookie"
```

### 2. Test With Query (RAG Search)
```bash
curl -X GET "http://localhost:4000/api/ai-context?query=What%20is%20a%20change%20order" \
  -H "Cookie: your-session-cookie"
```

### 3. Test Knowledge Base Search
```bash
node scripts/embed.mjs  # Should include a test search at the end
```

## 🎯 Benefits

### For Users:
- **Smarter AI**: Gets relevant construction knowledge automatically
- **Personalized Advice**: Combines industry knowledge with your specific data
- **Better Context**: AI understands both your projects AND industry best practices

### For Developers:
- **Scalable**: Easy to add more knowledge documents
- **Flexible**: Works with or without Supabase (graceful fallback)
- **Modern**: Uses state-of-the-art vector similarity search

## 🔍 Troubleshooting

### Common Issues:

1. **"Supabase not configured"**:
   - Check your `.env` file has correct SUPABASE_URL and SUPABASE_ANON_KEY
   - Ensure credentials are from the correct Supabase project

2. **"Knowledge search RPC failed"**:
   - Run the `search_knowledge` function SQL in Supabase
   - Check that the `vector` extension is enabled

3. **"Embedding model failed to load"**:
   - Ensure you have a stable internet connection (downloads ~23MB model)
   - Check Node.js version (requires Node 16+)

4. **"No documents found"**:
   - Verify `.md` files exist in `knowledge-base/` directory
   - Check file permissions and encoding (should be UTF-8)

### Debug Mode:

Enable detailed logging by checking the server console for:
- 🤖 AI Context request logs
- 🔍 Knowledge base search logs
- 📚 Document retrieval logs

## 🚀 Next Steps

1. **Add More Knowledge**: Expand the `knowledge-base/` with more construction documents
2. **Custom Embeddings**: Train domain-specific embedding models for construction
3. **Real-time Updates**: Set up webhooks to update knowledge base automatically
4. **Analytics**: Track which knowledge articles are most helpful

## 📊 Performance Notes

- **First Request**: May take 5-10 seconds (loading embedding model)
- **Subsequent Requests**: <1 second (model cached in memory)
- **Knowledge Base Size**: Optimized for 100+ documents
- **Vector Dimensions**: 384 (all-MiniLM-L6-v2 model)

---

🎉 **Your Blueprint application now has enterprise-grade RAG capabilities!** The AI can provide both personalized business advice and general construction industry knowledge.
