# Blueprint - Project Architecture & Style Guide

## 1. Project Overview

- **Project Name:** Blueprint
- **Core Purpose:** A multi-tenant SaaS application for Financial Planning & Analysis (FP&A) for construction companies.
- **Key Features:** 
  - Project Management with budget tracking, status monitoring, and team collaboration
  - Quote Management with line items, variance tracking, and change orders
  - Team Collaboration with role-based access, project assignments, and real-time notifications via WebSocket
  - AI Copilot for document analysis (quotes, contracts, requirements) using Google Generative AI
  - Vendor Management with ratings and contact information
  - Dashboard & Analytics with KPIs, revenue tracking, and cash flow visualization
  - Subscription Management via Stripe with tiered pricing (Free, Pro, Enterprise)
  - RAG (Retrieval-Augmented Generation) system using Supabase Vector Store for knowledge base queries

## 2. Tech Stack

- **Frontend:** 
  - React 18.3.1 with TypeScript
  - Vite 7.1.4 (build tool and dev server)
  - TailStack Query 5.89.0 (server state management)
  - React Router DOM 7.8.2 (routing)
  - Tailwind CSS 3.4.1 (styling)
  - Lucide React (icons)
  - Recharts 2.12.7 (data visualization)

- **Backend:** 
  - Node.js with Express 5.1.0
  - SQLite3 (primary database)
  - express-session with connect-sqlite3 (session management)
  - WebSocket (ws 8.18.0) for real-time notifications

- **Databases:** 
  - SQLite (`users.db`, `sessions.db`) for relational data
  - Supabase/PostgreSQL for vector embeddings (RAG system)

- **Third-Party Services:** 
  - Stripe (subscription & payment processing)
  - Google Generative AI (AI Copilot features)
  - Firebase (Google OAuth authentication)
  - Resend (transactional emails for team invitations)
  - Puppeteer (PDF generation for quotes)
  - Xenova Transformers (local text embeddings for RAG)

## 3. Directory Structure & Key Files

### `/src` - Frontend Application

#### `/src/components`
All React components, organized by function:
- **Page Components**: Top-level route components like `Dashboard.tsx`, `ProjectsPage.tsx`, `QuotesPage.tsx`, `AiCopilotPage.tsx`, `ReportsPage.tsx`, `SettingsPage.tsx`, `VendorsDataPage.tsx`, `IntegrationsPage.tsx`
- **Modal Components**: Dialog/overlay components like `AuthModal.tsx`, `QuoteModal.tsx`, `LineItemModal.tsx`, `ChangeOrderModal.tsx`, `VendorModal.tsx`, `ConfirmationModal.tsx`, `SubscriptionSuccessModal.tsx`
- **Layout Components**: Structural components like `DashboardLayout.tsx`, `Sidebar.tsx`, `Navigation.tsx`, `PageHeader.tsx`
- **Shared UI Components**: Reusable primitives like `Button.tsx`, `Card.tsx`, `Toast.tsx`, `ThemeToggle.tsx`, `NotificationBell.tsx`
- **Marketing Components**: Landing page sections like `Hero.tsx`, `Features.tsx`, `Pricing.tsx`, `Footer.tsx`, `TrustedBy.tsx`

#### `/src/contexts`
React Context providers for global state management:
- `AppContext.tsx`: Global confirmation modal state
- `ThemeContext.tsx`: Dark/light mode theme management
- `ProjectState.tsx`: Project CRUD mutations (TanStack Query)
- `QuoteContext.tsx`: Quote and line item mutations (TanStack Query)
- `VendorContext.tsx`: Vendor CRUD operations with local state
- `NotificationContext.tsx`: Notification state with WebSocket integration
- `NotificationMutations.tsx`: Notification mutation hooks
- `TeamMutations.tsx`: Team member mutation hooks

#### `/src/utils`
Utility functions and shared configurations:
- `queries.ts`: All TanStack Query hooks for data fetching (`useProjects`, `useQuotes`, `useCurrentUser`, `useDashboardSummary`, etc.)
- `firebase.ts`: Firebase SDK initialization and configuration
- `googleAuth.ts`: Google OAuth sign-in helpers and redirect handling

#### Root Files
- `App.tsx`: Root component with routing logic, nested route structure for authenticated dashboard, authentication flow with onboarding/subscription checks
- `main.tsx`: Application entry point, renders App with StrictMode
- `index.css`: Global Tailwind directives and custom CSS

### `/` - Root Configuration & Backend

- `server.cjs`: Main Express backend server (4000+ lines)
  - API routes (all prefixed with `/api`)
  - Database initialization and schema definitions
  - Session middleware and authentication checks
  - WebSocket server for real-time notifications
  - Stripe webhook handlers
  - File upload handling (avatars, logos, documents)
  
- `vite.config.ts`: Vite configuration with proxy setup (`/api` → `http://localhost:4000`)

- `tailwind.config.js`: Tailwind theme with dark mode support and custom animations

- `package.json`: Dependencies and scripts (`npm run dev`, `npm run build`, `npm start`)

- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`: TypeScript configuration files

- `.env`: Environment variables (API keys, configuration)

### `/scripts`
- `embed.mjs`: Script to generate vector embeddings for RAG knowledge base
- `setup-supabase.mjs`: Script to initialize Supabase vector store
- `example_prd.txt`: Example Product Requirements Document template

### `/knowledge-base`
Markdown files for RAG system:
- `change-orders-explained.md`
- `construction-billing-cycles.md`
- `what-is-fp&a.md`

### `/cypress`
End-to-end testing with Cypress:
- `/e2e`: Test specifications (`auth.cy.js`, `quotes.cy.js`)
- `/fixtures`: Test data (`testData.json`)

## 4. Core Concepts & Logic Flow

### Frontend Architecture

#### Routing
- **Router Library**: `react-router-dom` (v7)
- **Route Definition**: All routes defined in `App.tsx` using `<Routes>` and `<Route>` components
- **Route Structure**:
  - Public routes: Marketing landing page (default), `/pricing`, `/accept-invite/:token`
  - Auth conditional routes: Unauthenticated users see marketing site, authenticated users redirect to dashboard/onboarding
  - Subscription lifecycle routes: `/update-payment`, `/resubscribe`, `/subscribe-success`, `/subscribe-cancel`
  - Protected dashboard routes: Nested under `DashboardLayout` component
    - `/` → Dashboard
    - `/projects` → ProjectsPage
    - `/projects/:id` → ViewProjectPage
    - `/quotes` → QuotesPage
    - `/quotes/:id` → ViewQuotePage
    - `/ai-copilot` → AiCopilotPage
    - `/reports` → ReportsPage
    - `/integrations` → IntegrationsPage
    - `/vendors` → VendorsDataPage
    - `/settings` → SettingsPage

#### Authentication Flow
- **Provider**: Google OAuth via Firebase SDK
- **Sign-In Process**:
  1. User clicks "Sign In with Google" → triggers `signInWithRedirect()` from `googleAuth.ts`
  2. User completes OAuth flow on Google's servers
  3. User redirected back to app → `checkRedirectResult()` extracts user data from Firebase
  4. Frontend sends user data to `/api/users` endpoint
  5. Backend creates or updates user in SQLite, downloads avatar, sets `req.session.userId`
  6. Session stored in SQLite via `connect-sqlite3`
  7. Frontend stores user in TanStack Query cache via `useCurrentUser` hook
- **Session Management**: 
  - Server-side: Express sessions with SQLite store, cookie-based authentication
  - Client-side: `useCurrentUser()` hook provides current user state, TanStack Query handles caching and refetching
- **Protected Routes**: Routes check `isLoggedIn` state (derived from `useCurrentUser()`) before rendering dashboard
- **Onboarding Flow**: New users redirected to `/onboarding` until `hasCompletedOnboarding` is true
- **Subscription Checks**: Users with `subscriptionStatus` of `'past_due'` or `'canceled'` redirected to appropriate recovery flows

#### Server State Management
- **Library**: TanStack Query v5
- **Pattern**: All queries and mutations defined as custom hooks
- **Query Hooks** (in `utils/queries.ts`):
  - `useCurrentUser()`: Fetch authenticated user
  - `useProjects()`: Fetch all projects
  - `useProject(id)`: Fetch single project with quotes, members, change orders
  - `useQuotes()`: Fetch all quotes
  - `useQuote(id)`: Fetch single quote
  - `useLineItems(quoteId)`: Fetch line items for a quote
  - `useDashboardSummary()`: Fetch KPIs and analytics
  - `useNotificationsList()`: Fetch notifications
  - `useTeamMembers()`: Fetch team members
  - `useSubscriptionDetails()`: Fetch Stripe subscription info
- **Mutation Hooks** (in Context providers):
  - Defined within React Context providers (`ProjectProvider`, `QuoteProvider`, `VendorProvider`, `NotificationMutationsProvider`, `TeamMutationsProvider`)
  - Use `useMutation` from TanStack Query
  - Automatically invalidate related queries on success using `queryClient.invalidateQueries()`
- **Configuration**: 
  - 5-minute stale time by default
  - No refetch on window focus
  - Retry disabled for 401/403 errors
  - All queries use `credentials: 'include'` for session cookies

#### UI Components & Styling
- **Styling Framework**: Tailwind CSS with dark mode support (`darkMode: 'class'`)
- **Component Pattern**: Functional components with TypeScript interfaces for props
- **Icons**: Lucide React icon library
- **Theme**: Managed by `ThemeContext` with `'light'` | `'dark'` | `'system'` modes
- **Reusable Components**: `Button`, `Card`, `Toast`, `PageHeader`, `ConfirmationModal`
- **Color Scheme**: 
  - Light mode: `bg-gray-50`, `text-gray-900`
  - Dark mode: `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`, `text-white`

#### Real-Time Features
- **WebSocket Connection**: Established in `NotificationContext.tsx` when user logs in
- **Server**: WebSocket server at `ws://localhost:4000` (in `server.cjs`)
- **Authentication**: Client sends `{ type: 'auth', userId }` message on connect
- **Message Types**:
  - `notification`: New notification received
  - `user_updated`: Subscription/user data changed, triggers refetch of `useCurrentUser()`
- **Reconnection**: Automatic reconnection after 3 seconds on disconnect

### Backend Architecture

#### API Routing
- **Framework**: Express.js (v5.1.0)
- **Route Prefix**: All API routes prefixed with `/api`
- **Route Organization**: All routes defined in single `server.cjs` file
- **Common Routes**:
  - Auth: `/api/users`, `/api/me`, `/api/logout`
  - Projects: `/api/projects`, `/api/projects/:id`
  - Quotes: `/api/quotes`, `/api/quotes/:id`, `/api/quotes/:id/line-items`
  - Line Items: `/api/line-items/:id`
  - Change Orders: `/api/change-orders`, `/api/change-orders/:id`
  - Vendors: `/api/vendors`, `/api/vendors/:id`
  - Notifications: `/api/notifications`, `/api/notifications/:id/read`
  - Team: `/api/team/invite`, `/api/team/members`, `/api/team/members/:id`
  - Dashboard: `/api/dashboard-summary`
  - AI: `/api/ai-copilot/analyze`, `/api/ai-copilot/ask`
  - Subscriptions: `/api/create-checkout-session`, `/api/webhook`, `/api/subscription-details`
  - Uploads: `/api/upload-logo`

#### Database Interaction
- **Library**: `sqlite3` with verbose mode
- **Pattern**: Direct SQL queries in route handlers (no ORM)
- **Database Files**: 
  - `users.db`: All application data
  - `sessions.db`: Session storage
- **Query Methods**:
  - `db.get()`: Fetch single row
  - `db.all()`: Fetch multiple rows
  - `db.run()`: Execute INSERT/UPDATE/DELETE
- **Prepared Statements**: All queries use parameterized placeholders (`?`) to prevent SQL injection

#### Authentication Middleware
- **Session Library**: `express-session` with `SQLiteStore`
- **Pattern**: Routes check `req.session.userId` to verify authentication
- **Protected Routes**: Most API routes require valid session (except public routes like `/api/health`, OAuth callbacks)
- **Authorization**: 
  - Users can only access their own data (queries filtered by `userId`)
  - Project members can access shared projects (via `project_members` join table)
  - Team members can access workspace data (via `user_id` or workspace membership)

#### Database Schema
- **Multi-Tenant Model**: All tables include `user_id` (or `userId`) foreign key for data isolation
- **Key Tables**:
  - `users`: User accounts with Google OAuth data, subscription status, onboarding flag
  - `projects`: Projects with name, budget, status, priority, description
  - `quotes`: Quotes with name, status, time estimates, variance tracking, budget
  - `line_items`: Individual cost items within quotes
  - `change_orders`: Change requests for quotes with amount and status
  - `vendors`: Vendor directory with contact info and ratings
  - `notifications`: User notifications with read status
  - `invitations`: Team invitation tokens
  - `project_members`: Many-to-many relationship between users and projects
  - `company_profile`: Company branding (name, logo)
  - `quickbooks_tokens`: OAuth tokens for QuickBooks integration

#### File Uploads
- **Library**: Multer
- **Storage**:
  - Avatars: Downloaded from Google OAuth URL and saved to `/uploads/avatars/user_{userId}.jpg`
  - Logos: Uploaded by user and saved to `/uploads/logos/{userId}_{timestamp}.{ext}`
  - Documents (AI analysis): Stored in memory buffer, not persisted
- **Allowed Types**:
  - Logos: JPEG, PNG, GIF, WebP (max 5MB)
  - Documents: TXT, MD, CSV, JSON, PDF (max 10MB)

### Data Models (Primary TypeScript Types)

```typescript
// Project
export interface Project {
  id: number;
  name: string;
  description: string;
  status: string;  // e.g., 'planning', 'in-progress', 'completed', 'on-hold'
  priority: string;  // e.g., 'high', 'medium', 'low'
  budget?: number;
  created_at: string;
  updated_at: string;
}

// Extended Project (for detail view)
export interface ProjectDetails extends Project {
  quotes: any[];
  members: any[];
  changeOrders: any[];
  kpis?: {
    totalBudget: number;
    totalSpent: number;
    variance: number;
    percentComplete: number;
  };
}

// Quote
export interface Quote {
  id: number;
  quoteName: string;
  status: string;  // e.g., 'Draft', 'Pending', 'Approved', 'Rejected'
  timeToDevelop: string;  // Legacy field for backward compatibility
  timeToDevelopValue: number;
  timeToDevelopUnit: string;  // e.g., 'days', 'weeks', 'months'
  variancePercentage: number;
  quoteTotal: number;
  budget: number;
  created_at: string;
  updated_at: string;
}

// Line Item
export interface LineItem {
  id: number;
  description: string;
  estimatedCost: number;
  actualCost?: number;
  quoteId: number;
  userId: number;
  created_at: string;
  updated_at: string;
}

// Change Order
interface ChangeOrder {
  id: number;
  description: string;
  amount: number;
  status: string;  // e.g., 'Pending', 'Approved', 'Rejected'
  quoteId: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

// Vendor
export interface Vendor {
  id: number;
  name: string;
  specialty: string;
  contactEmail: string;
  phone: string;
  rating: number | null;  // 1-5 star rating
  user_id: number;
  created_at?: string;
  updated_at?: string;
}

// User
interface User {
  id: number;
  name: string;
  email: string;
  role?: string;  // e.g., 'Owner', 'Admin', 'Member'
  subscriptionStatus?: string;  // e.g., 'free', 'active', 'past_due', 'canceled'
  hasCompletedOnboarding?: boolean;
  profilePictureUrl?: string;
  googleId?: string;
}

// Project Member (join table representation)
interface ProjectMember {
  id: number;
  name: string;
  email: string;
  role?: string;
  project_role?: string;  // Role specific to the project
}

// Notification
interface Notification {
  id: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// Dashboard Summary
export interface DashboardSummary {
  kpis: {
    totalRevenue: number;
    totalBudget: number;
    profitMargin: number;
    growthRate: number;
    totalProjects: number;
    activeProjects: number;
  };
  statusBreakdown: { [key: string]: number };  // e.g., { 'in-progress': 5, 'completed': 10 }
  cashFlowData: Array<{
    month: string;
    revenue: number;
  }>;
}
```

## 5. Key Coding Patterns & Conventions

### Component Structure
```typescript
// Standard component pattern
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ComponentProps {
  // Props definition
}

const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // State
  const [localState, setLocalState] = useState();
  
  // Queries/Mutations
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data) => { /* ... */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
    }
  });
  
  // Handlers
  const handleAction = () => { /* ... */ };
  
  // Render
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

### API Calls
```typescript
// Always include credentials for session cookies
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(data)
});

// Standard error handling
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
}

const result = await response.json();
if (result.success) {
  return result.data;  // or result.project, result.quote, etc.
} else {
  throw new Error(result.error || 'Operation failed');
}
```

### Backend Route Pattern
```javascript
// Standard backend route structure
app.post('/api/resource', (req, res) => {
  // 1. Check authentication
  if (!req.session.userId) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized' 
    });
  }
  
  // 2. Extract and validate data
  const { field1, field2 } = req.body;
  if (!field1) {
    return res.status(400).json({ 
      success: false, 
      error: 'Field1 is required' 
    });
  }
  
  // 3. Database operation
  db.run(
    'INSERT INTO table (field1, field2, user_id) VALUES (?, ?, ?)',
    [field1, field2, req.session.userId],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to create resource' 
        });
      }
      
      // 4. Return success response
      res.json({ 
        success: true, 
        data: { id: this.lastID, field1, field2 } 
      });
    }
  );
});
```

### Context Provider Pattern
```typescript
// All mutation logic encapsulated in context providers
export const ResourceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  
  const addMutation = useMutation({
    mutationFn: async (data) => { /* API call */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    }
  });
  
  const addResource = useCallback(async (data) => {
    return await addMutation.mutateAsync(data);
  }, [addMutation]);
  
  return (
    <ResourceContext.Provider value={{ addResource }}>
      {children}
    </ResourceContext.Provider>
  );
};
```

## 6. Important Notes

- **Dev Server**: Frontend runs on port 5173 (Vite), backend on port 4000 (Express), proxy configured in `vite.config.ts`
- **Session Cookies**: All API requests must include `credentials: 'include'` for session authentication
- **Multi-Tenancy**: All data access filtered by `user_id` or workspace membership
- **Real-Time Updates**: WebSocket connection automatically handles subscription changes and new notifications
- **Error Handling**: Consistent error response format: `{ success: false, error: 'Message' }`
- **Success Responses**: Consistent format: `{ success: true, data: {...} }` or `{ success: true, project: {...} }`
- **TypeScript**: Strict typing enforced in frontend, interfaces defined close to usage
- **Tailwind**: Use dark mode classes (`dark:bg-slate-900`) for theme support
- **Icons**: Import from `lucide-react` (e.g., `import { Save, Trash2 } from 'lucide-react'`)



## 7. Component Structure

// Standard component pattern
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface ComponentProps {
  // Props definition
}

const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // State
  const [localState, setLocalState] = useState();
  
  // Queries/Mutations
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (data) => { /* ... */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['relevant-data'] });
    }
  });
  
  // Handlers
  const handleAction = () => { /* ... */ };
  
  // Render
  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
};

export default ComponentName;


## 8. API Calls

// Always include credentials for session cookies
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(data)
});

// Standard error handling
if (!response.ok) {
  const errorData = await response.json();
  throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
}

const result = await response.json();
if (result.success) {
  return result.data;  // or result.project, result.quote, etc.
} else {
  throw new Error(result.error || 'Operation failed');
}


## 9. Backend Route Pattern

// Standard backend route structure
app.post('/api/resource', (req, res) => {
  // 1. Check authentication
  if (!req.session.userId) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized' 
    });
  }
  
  // 2. Extract and validate data
  const { field1, field2 } = req.body;
  if (!field1) {
    return res.status(400).json({ 
      success: false, 
      error: 'Field1 is required' 
    });
  }
  
  // 3. Database operation
  db.run(
    'INSERT INTO table (field1, field2, user_id) VALUES (?, ?, ?)',
    [field1, field2, req.session.userId],
    function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to create resource' 
        });
      }
      
      // 4. Return success response
      res.json({ 
        success: true, 
        data: { id: this.lastID, field1, field2 } 
      });
    }
  );
});


## 10. Context Provider Pattern

// All mutation logic encapsulated in context providers
export const ResourceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  
  const addMutation = useMutation({
    mutationFn: async (data) => { /* API call */ },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    }
  });
  
  const addResource = useCallback(async (data) => {
    return await addMutation.mutateAsync(data);
  }, [addMutation]);
  
  return (
    <ResourceContext.Provider value={{ addResource }}>
      {children}
    </ResourceContext.Provider>
  );
};

 ## 11. Important Notes

- **Dev Server**: Frontend runs on port 5173 (Vite), backend on port 4000 (Express), proxy configured in `vite.config.ts`
- **Session Cookies**: All API requests must include `credentials: 'include'` for session authentication
- **Multi-Tenancy**: All data access filtered by `user_id` or workspace membership
- **Real-Time Updates**: WebSocket connection automatically handles subscription changes and new notifications
- **Error Handling**: Consistent error response format: `{ success: false, error: 'Message' }`
- **Success Responses**: Consistent format: `{ success: true, data: {...} }` or `{ success: true, project: {...} }`
- **TypeScript**: Strict typing enforced in frontend, interfaces defined close to usage
- **Tailwind**: Use dark mode classes (`dark:bg-slate-900`) for theme support
- **Icons**: Import from `lucide-react` (e.g., `import { Save, Trash2 } from 'lucide-react'`)