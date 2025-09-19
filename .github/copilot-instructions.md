# Blueprint AI Coding Instructions

## Architecture Overview

Blueprint is a construction industry SaaS platform with a **hybrid full-stack architecture**:
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Express.js server (CommonJS) with SQLite for user data
- **AI/RAG**: Supabase vector database + Transformers.js for knowledge retrieval
- **Auth**: Google OAuth + Express sessions with SQLite storage

## Key Architectural Patterns

### 1. Dual-Server Architecture
- **Development**: Frontend on `:5173` (Vite), Backend on `:4000` (Express)
- **CORS Configuration**: Explicit credentials support for session management
- **Security Headers**: COOP/COEP headers for OAuth compatibility

### 2. Context-Based State Management
Use React Context providers (not Redux):
```tsx
// Pattern: Wrap components with context providers
<ThemeProvider>
  <ProjectProvider>
    <QuoteProvider>
      {/* Components */}
    </QuoteProvider>
  </ProjectProvider>
</ThemeProvider>
```

### 3. Conditional Rendering Pattern
Single `App.tsx` switches between marketing site and dashboard:
```tsx
{isLoggedIn ? (
  <DashboardLayout />
) : (
  <>
    <Navigation />
    <Hero />
    {/* Marketing components */}
  </>
)}
```

## Database Schema Patterns

### User-Scoped Data
Every data table includes `user_id` foreign key:
```sql
-- All business data is user-scoped
CREATE TABLE projects (id, name, user_id, ...)
CREATE TABLE quotes (id, quoteName, user_id, ...)  
CREATE TABLE line_items (id, description, quoteId, user_id, ...)
```

### Dynamic Schema Migration
Server handles schema changes gracefully with runtime column additions:
```javascript
// Pattern: Check if column exists before adding
db.all("PRAGMA table_info(projects)", (err, columns) => {
  const hasUpdatedAt = columns.some(col => col.name === 'updated_at');
  if (!hasUpdatedAt) {
    db.run(`ALTER TABLE projects ADD COLUMN updated_at DATETIME`);
  }
});
```

## API Conventions

### REST Endpoints with Express
- Use `/api/` prefix for all endpoints
- Include `requireAuth` middleware for protected routes
- Return consistent JSON: `{ success: true, data: {...} }` or `{ success: false, error: "message" }`

### AI Context Endpoint Pattern
`/api/ai-context?query=...` combines private + public data:
```javascript
// Returns merged context for AI assistants
const context = buildCombinedContext(privateData, knowledgeBase, query);
```

## Component Development Patterns

### Reusable Components
Use the established component library in `src/components/`:
- `Button.tsx`: Variants (primary, secondary, outline, ghost)
- `Card.tsx`: Variants (default, gradient, glass) 
- `PageHeader.tsx`: Consistent page titles

### Navigation Pattern
React Router with nested routes in `DashboardLayout.tsx`:
```tsx
<Routes>
  <Route path="/" element={<Dashboard />} />
  <Route path="/projects" element={<ProjectsPage />} />
  <Route path="/quotes/:id" element={<ViewQuotePage />} />
</Routes>
```

## Development Workflow

### Starting the Application
```bash
# Backend + Frontend together (uses task runner)
npm run dev  # Runs: node server.cjs; npm run dev

# Or individually:
node server.cjs  # Backend only
npm run dev      # Frontend only (separate terminal)
```

### Environment Setup
Required `.env` variables:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_key_here
```

### RAG Knowledge Base
Populate with construction industry knowledge:
```bash
npm run embed  # Processes knowledge-base/*.md files
```

## Styling Conventions

### TailwindCSS + Dark Mode
- Use `dark:` prefix for dark mode variants
- Glass morphism: `bg-white/10 backdrop-blur-sm border border-white/20`
- Gradients: `bg-gradient-to-r from-blue-500 to-purple-500`

### Theme System
Toggle via `ThemeContext.tsx`:
```tsx
const { theme, toggleTheme } = useTheme();
// Applies 'dark' class to <html> element
```

## AI Integration Points

### Context Providers for AI
The `/api/ai-context` endpoint provides structured business data for AI assistants:
- User's projects, quotes, vendors from SQLite
- Relevant knowledge base articles from Supabase vector search
- Combined formatting with industry guidance

### Embedding Pipeline
Uses `@xenova/transformers` for client-side embeddings:
```javascript
// Pattern: Generate embeddings for semantic search
const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
const embedding = await embedder(text, { pooling: 'mean', normalize: true });
```

## Critical Integration Notes

### Session Management
- Express sessions stored in SQLite (`sessions.db`)
- Google OAuth redirect handling in `checkRedirectResult()`
- Session persistence across browser refreshes

### CORS Headers for OAuth
```javascript
// Required for Google OAuth popups
res.header('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');
```

### Database Connection Patterns
Always use callbacks with SQLite, not promises:
```javascript
// ✅ Correct pattern
db.run('INSERT INTO...', [values], function(err) {
  if (err) return res.status(500).json({error: err.message});
  res.json({success: true, id: this.lastID});
});
```

## Construction Industry Context

This is a **construction project management** platform specializing in:
- Project budgeting and status tracking
- Quote generation with line items
- Vendor relationship management  
- Financial planning & analysis (FP&A)
- Change order management

When adding features, consider construction-specific workflows like bidding cycles, project phases, and compliance requirements.