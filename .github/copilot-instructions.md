# Blueprint AI Coding Instructions

## Architecture Overview

Blueprint is a construction industry SaaS platform with a **hybrid full-stack architecture**:
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Backend**: Express.js server (CommonJS) with SQLite for user data
- **AI/RAG**: Supabase vector database + Transformers.js for knowledge retrieval
- **Auth**: Google OAuth + Express sessions with SQLite storage
- **File Processing**: Multer + PDF-parse for document AI analysis
- **Real-time**: WebSocket server for notifications and live updates

## Key Architectural Patterns

### 1. Dual-Server Architecture
- **Development**: Frontend on `:5173` (Vite), Backend on `:4000` (Express)
- **CORS Configuration**: Explicit credentials support for session management
- **Security Headers**: COOP/COEP headers for OAuth compatibility

### 2. Modern Server State Management with TanStack Query
Uses TanStack Query for reactive server state with automatic cache invalidation:
```tsx
// Pattern: Data fetching with useQuery hooks
const { data: projects = [], isLoading, error } = useProjects();
const { data: quotes = [] } = useQuotes();

// Pattern: Mutations with context providers
const { addProject, updateProject, deleteProject } = useProjectMutations();
const { addQuote, updateQuote, deleteQuote } = useQuoteMutations();
```

**Query/Mutation Separation:**
- **Data Fetching**: Direct useQuery hooks from `src/utils/queries.ts`
- **Data Modification**: useMutation hooks via context providers with automatic cache invalidation
- **Authentication**: Reactive useCurrentUser hook with queryClient.invalidateQueries

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

## TanStack Query Patterns

### Data Fetching Strategy
All server state managed through dedicated query hooks in `src/utils/queries.ts`:
```tsx
// Query hooks - for data fetching
export const useProjects = () => useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  staleTime: 5 * 60 * 1000 // 5 minutes
});

export const useQuote = (id: number) => useQuery({
  queryKey: ['quote', id],
  queryFn: () => fetchQuote(id),
  enabled: !!id
});
```

### Mutation Context Pattern
Context providers handle only mutations with automatic cache invalidation:
```tsx
// Context for mutations only - no state storage
export const ProjectProvider = ({ children }) => {
  const queryClient = useQueryClient();
  
  const addProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    }
  });
  
  return (
    <ProjectContext.Provider value={{ addProject: addProjectMutation.mutate }}>
      {children}
    </ProjectContext.Provider>
  );
};
```

### Component Data Consumption
Components consume data directly from query hooks, not contexts:
```tsx
const ProjectsPage = () => {
  // Data fetching - direct query hook usage
  const { data: projects = [], isLoading, error } = useProjects();
  
  // Mutations - from context providers
  const { addProject, updateProject, deleteProject } = useProjectMutations();
  
  // React Query automatically handles loading states, errors, and cache invalidation
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error?.message} />;
  
  return <ProjectsList projects={projects} />;
};
```

### Cache Invalidation Strategy
Mutations automatically invalidate related queries:
```tsx
// Comprehensive invalidation patterns
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['projects'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  queryClient.invalidateQueries({ queryKey: ['quotes'] }); // If projects affect quotes
}
```

### Error Handling
React Query provides structured error objects:
```tsx
// Error handling pattern
const { data, isLoading, error } = useProjects();

// Error display with proper type checking
{error && (
  <ErrorCard>
    {error?.message || 'An error occurred while loading data'}
  </ErrorCard>
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

### Data Loading Pattern
Components use direct query hooks for data fetching with separation from mutations:
```tsx
// ✅ Correct pattern - data fetching via query hooks
const { data: projects = [], isLoading, error } = useProjects();
const { addProject, updateProject } = useProjectMutations();

// ❌ Avoid - no manual API calls or useEffect for data fetching
useEffect(() => {
  fetch('/api/projects').then(...); // Don't do this
}, []);
```

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
# Backend + Frontend together (preferred - uses concurrently)
npm run start  # Runs: concurrently "npm run dev" "node server.cjs"

# Or use VS Code task (available in workspace)
# Task: "Start Backend and Frontend" (runs as background process)

# Or individually:
node server.cjs  # Backend only (:4000)
npm run dev      # Frontend only (:5173, separate terminal)
```

### Environment Setup
Required `.env` variables:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_key_here
VITE_GEMINI_API_KEY=your_gemini_key    # For AI document analysis
STRIPE_SECRET_KEY=sk_test_...          # For subscriptions (optional)
RESEND_API_KEY=re_...                  # For email invitations (optional)
```

### RAG Knowledge Base Setup
```bash
npm run embed        # Processes knowledge-base/*.md files
npm run setup-rag    # Alias for embed script
npm run setup-supabase  # Initial Supabase table setup
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

### Document Processing Pipeline
File upload → AI analysis → Quote generation workflow:
```javascript
// Multer config supports PDF, text files (10MB limit)
upload.single('file') → pdfParse(buffer) → callGeminiAPI(prompt) → structured output
```

### AI-Powered Quote Generation
`/api/quotes/upload-and-analyze` endpoint:
- Accepts PDF/text files via drag-drop or browse
- Extracts text using PDF-parse or buffer.toString()
- Uses Gemini API with structured prompts for quote/line item extraction
- Creates quote + line items directly in database

### Context Providers for AI
The `/api/ai-context` endpoint provides structured business data for AI assistants:
- User's projects, quotes, vendors from SQLite
- Relevant knowledge base articles from Supabase vector search
- Combined formatting with industry guidance

### Embedding Pipeline
Uses `@xenova/transformers` for server-side embeddings:
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

### WebSocket Notifications
Real-time notifications via WebSocket server on same port:
```javascript
// Server: activeConnections.get(userId)?.send(JSON.stringify(notification))
// Client: WebSocket connection established in NotificationContext
```

### PDF Generation
Uses Puppeteer for server-side PDF generation:
```javascript
// Pattern: HTML template → Puppeteer → PDF buffer → download
const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
```

## Construction Industry Context

This is a **construction project management** platform specializing in:
- Project budgeting and status tracking
- Quote generation with line items
- Vendor relationship management  
- Financial planning & analysis (FP&A)
- Change order management

When adding features, consider construction-specific workflows like bidding cycles, project phases, and compliance requirements.