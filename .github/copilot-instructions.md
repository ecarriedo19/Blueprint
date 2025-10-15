# Blueprint AI Coding Instructions

## Architecture Overview

Blueprint is a construction industry SaaS platform with a **hybrid full-stack architecture**:
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Framer Motion
- **Backend**: Express.js server (CommonJS) with SQLite for user data
- **AI/RAG**: Supabase vector database + Transformers.js for knowledge retrieval + Gemini API
- **Auth**: Google OAuth + Express sessions with SQLite storage
- **File Processing**: Multer + PDF-parse for document AI analysis
- **Real-time**: WebSocket server for notifications and live updates
- **UI/UX**: Modern design system with glassmorphism, animations, and command palette

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
npm start  # Runs: concurrently "npm run dev" "node server.cjs"

# Or individually:
node server.cjs  # Backend only (:4000)
npm run dev      # Frontend only (:5173, separate terminal)
```

### Development Environment Features
- **Auto-Refresh**: Custom Vite plugin monitors backend restart and auto-refreshes browser
- **Proxy Setup**: `/api` requests automatically proxied from `:5173` to `:4000`
- **Hot Module Replacement**: Frontend changes reflected instantly via Vite HMR
- **Session Persistence**: Express sessions maintain auth state across browser refreshes

### Task Management with Task Master AI
Integrated `task-master-ai` for AI-driven development workflow with dual interaction modes:

**MCP Server Integration (Preferred for AI agents):**
- Available in Cursor/VS Code via Model Context Protocol 
- Provides structured tools: `get_tasks`, `add_subtask`, `set_task_status`, etc.
- Better performance and error handling than CLI parsing
- Restart MCP server when core logic changes

**CLI Commands (Fallback and direct usage):**
```bash
# Initialize task management (if starting fresh)
npx task-master-ai init

# Parse PRD and generate tasks
npx task-master-ai parse-prd scripts/prd.txt

# Show next task to work on
npx task-master-ai next

# List all tasks with status
npx task-master-ai list --with-subtasks

# Mark task as complete
npx task-master-ai set-status --id=1 --status=done

# Break down complex tasks into subtasks
npx task-master-ai expand --id=5 --num=3

# Analyze task complexity with research
npx task-master-ai analyze-complexity --research

# Update tasks when implementation drifts
npx task-master-ai update --from=4 --prompt="Using Express instead of Fastify"
```

**Task File Structure:**
- `tasks/tasks.json`: Main task registry with dependencies and status
- `tasks/task_001.txt`, `tasks/task_002.txt`: Individual detailed task files
- Supports subtasks with dot notation (e.g., `1.1`, `1.2`) and dependency chains

### Modern UI Development Patterns
**Component Showcase & Testing:**
- Use `/showcase` route for testing UI components in development
- Component showcase displays all variants: buttons, cards, loading states
- Phase-based UI development for systematic enhancement

**Animation System:**
- Reusable Framer Motion variants in `src/utils/animations.ts`
- Standard 300ms timing for balanced UX
- Consistent hover effects: `hoverScale`, `hoverLift`

**Loading & Skeleton States:**
- `SkeletonCard.tsx` with shimmer effects
- Variants: card, stat, chart, text
- Dark mode compatible with smooth transitions

### Testing Strategy
E2E testing with Cypress configured for Blueprint's dual-server setup:
```bash
# Run E2E tests headless
npm run test:e2e
# or
npm run cypress:run

# Open Cypress Test Runner
npm run cypress:open
# or  
npm run cy:open
```

**Cypress Configuration:**
- Base URL: `http://localhost:5173` (Vite dev server)
- Backend API: `http://localhost:4000` for programmatic operations
- Tests in `cypress/e2e/` directory (.cy.js files)
- Custom commands in `cypress/support/commands.js`

**Testing Patterns:**
- **Programmatic Login**: Uses `cy.login()` custom command that calls `/api/test/login` endpoint
- **Test Data**: Predefined test user (`test@blueprint.com`) with active subscription
- **Session Persistence**: Tests verify auth state survives page refreshes
- **Security Testing**: Validates unauthorized access protection

### Environment Setup
Complete `.env` configuration (all variables shown in actual .env file):
```env
VITE_GEMINI_API_KEY=your_key_here     # Required for AI document analysis
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_key_here       # For vector database RAG

# Email Service (Resend) - for team invitations
RESEND_API_KEY=re_...                 # Optional but needed for invites

# Application Configuration
NODE_ENV=development
PORT=4000
SESSION_SECRET=blueprint-session-secret-key-change-in-production
FRONTEND_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:4000

# Stripe Configuration - for subscription billing
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### RAG Knowledge Base Setup
```bash
npm run embed        # Processes knowledge-base/*.md files
npm run setup-rag    # Alias for embed script
npm run setup-supabase  # Initial Supabase table setup
```

## Modern UI/UX System

### Design System & Components
- **Component Library**: Consistent design system in `src/components/`
- **Animation System**: Framer Motion variants in `src/utils/animations.ts`
- **Loading States**: Skeleton components with shimmer animation (`SkeletonCard.tsx`)
- **Color Palette**: Financial colors (green/red), brand gradients, AI purple accents

### TailwindCSS + Dark Mode
- Use `dark:` prefix for dark mode variants
- Glass morphism: `bg-white/10 backdrop-blur-sm border border-white/20`
- Gradients: `bg-gradient-to-r from-blue-500 to-purple-500`
- Consistent animations: 300ms duration for balanced UX

### Theme System
Toggle via `ThemeContext.tsx`:
```tsx
const { theme, toggleTheme } = useTheme();
// Applies 'dark' class to <html> element
```

### Command Palette & Search
- Global search: `⌘K` shortcut opens search modal
- Inline search: Real-time search with keyboard navigation
- Results display: Projects, quotes, vendors with type indicators

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
Uses `@xenova/transformers` for server-side embeddings in `scripts/embed.mjs`:
```javascript
// Pattern: Generate embeddings for semantic search
const embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
const embedding = await embedder(text, { pooling: 'mean', normalize: true });
// Stores 384-dimensional vectors in Supabase with ivfflat index
```

### Knowledge Base RAG Setup
Automated embedding generation for `knowledge-base/*.md` files:
```bash
npm run embed               # Processes markdown → embeddings → Supabase
npm run setup-supabase     # Creates knowledge table and search function
```

## Critical Integration Notes

### Session Management
- Express sessions stored in SQLite (`sessions.db`) using `connect-sqlite3`
- Google OAuth redirect handling in `checkRedirectResult()` from `src/utils/googleAuth.ts`
- Session persistence across browser refreshes with `credentials: 'include'`
- Session middleware: `express-session` with SQLiteStore backing

### Authentication Flow
Session-based authentication with Google OAuth integration:
1. **Google OAuth**: Handled via Firebase Auth SDK with popup-based flow
2. **Session Management**: Express sessions stored in SQLite with `connect-sqlite3`
3. **Frontend Auth State**: Reactive `useCurrentUser()` hook from TanStack Query
4. **Route Protection**: 401 responses trigger automatic auth redirects
5. **Session Persistence**: `credentials: 'include'` for cross-origin session cookies

### CORS Headers for OAuth
```javascript
// Required for Google OAuth popups in server.cjs
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

### WebSocket Implementation
Real-time notifications via WebSocket server on same HTTP server:
```javascript
// Server setup: WebSocket.Server({ server }) on http.createServer(app)
// Connection tracking: activeConnections Map stores user ID → WebSocket
// Authentication: Client sends { type: 'auth', userId } after connection
// Notification dispatch: activeConnections.get(userId)?.send(JSON.stringify(notification))
```

### PDF Generation
Uses Puppeteer for server-side PDF generation:
```javascript
// Pattern: HTML template → Puppeteer → PDF buffer → download
const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
```

### File Upload & Processing
Multer configuration for document analysis:
```javascript
// 10MB limit, memory storage for temporary processing
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10MB } });
// Supports PDF via pdf-parse and text files for AI analysis
```

### Custom Development Tools
**Backend Watch Plugin**: Custom Vite plugin (`vite-plugin-backend-watch.ts`) that:
- Monitors backend server availability every 1.5 seconds
- Auto-refreshes browser when backend restarts
- Provides seamless development experience during server changes

**Development Environment Setup:**
- Use `npm start` for concurrent frontend/backend development
- Vite proxy setup routes `/api` requests to `:4000`
- WebSocket connection for real-time features
- Session persistence across browser refreshes

## Construction Industry Context

This is a **construction project management** platform specializing in:
- Project budgeting and status tracking
- Quote generation with line items
- Vendor relationship management  
- Financial planning & analysis (FP&A)
- Change order management

When adding features, consider construction-specific workflows like bidding cycles, project phases, and compliance requirements.