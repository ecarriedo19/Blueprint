# Blueprint 🏗️

A modern construction project management SaaS platform built for construction professionals, contractors, and project managers. Blueprint streamlines project budgeting, quote generation, team collaboration, and financial tracking in the construction industry.

## ✨ Features

### 🎯 Core Functionality
- **Project Management** - Create, track, and manage construction projects with detailed budgeting
- **Quote Generation** - Build professional quotes with line items and cost breakdowns
- **AI-Powered Document Analysis** - Upload PDFs and let AI extract quotes and line items automatically
- **Team Collaboration** - Invite team members with role-based access control
- **Financial Planning & Analysis (FP&A)** - Budget vs actuals reporting and variance tracking
- **Vendor Management** - Manage contractor and supplier relationships
- **Change Order Management** - Track project changes and cost impacts

### 🤖 AI & Automation
- **Document Processing** - AI-powered extraction from construction documents
- **Quote Auto-Generation** - Intelligent line item creation from uploaded files
- **Cost Code Integration** - CSI MasterFormat cost codes for industry standards
- **Knowledge Base RAG** - Vector search for construction industry guidance

### 💼 Business Features
- **Subscription Management** - Stripe-powered billing with free and pro tiers
- **Multi-tenant Architecture** - Company-based data isolation
- **Team Invitations** - Email-based team member onboarding
- **Real-time Notifications** - WebSocket-powered live updates
- **Project Access Control** - Granular permissions per project

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling with custom design system
- **Framer Motion** for smooth animations
- **TanStack Query** for server state management
- **React Router** for client-side routing

### Backend
- **Express.js** server with CommonJS
- **SQLite** for user data and business logic
- **Supabase** for vector database (RAG/AI features)
- **WebSocket** server for real-time features
- **Multer** for file upload handling

### AI & Data Processing
- **Google Gemini API** for document analysis
- **Transformers.js** for embeddings generation
- **PDF-parse** for document text extraction
- **Vector search** with Supabase ivfflat indexing

### Authentication & Payments
- **Google OAuth** via Firebase Auth SDK
- **Express sessions** with SQLite storage
- **Stripe** for subscription billing and payments
- **CORS** configured for OAuth compatibility

### Development & Deployment
- **TypeScript** for type safety
- **ESLint** for code quality
- **Cypress** for end-to-end testing
- **Concurrently** for dual-server development
- **Hot Module Replacement** with custom backend monitoring

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- SQLite

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/ecarriedo19/Blueprint.git
cd Blueprint
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Copy `.env.example` to `.env` and configure:
```env
# Required for AI features
VITE_GEMINI_API_KEY=your_gemini_api_key

# Supabase (for vector database)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_key

# Stripe (for billing)
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Email service (optional)
RESEND_API_KEY=re_...

# App configuration
SESSION_SECRET=your-session-secret
FRONTEND_URL=http://localhost:5173
VITE_API_BASE_URL=http://localhost:4000
```

4. **Set up the knowledge base (optional)**
```bash
npm run setup-supabase  # Create vector database tables
npm run embed           # Process knowledge base files
```

5. **Start development servers**
```bash
npm start  # Starts both frontend (5173) and backend (4000)
```

Or start individually:
```bash
npm run dev     # Frontend only
node server.cjs # Backend only
```

## 📁 Project Structure

```
Blueprint/
├── src/                      # Frontend React application
│   ├── components/          # React components
│   ├── contexts/           # React Context providers
│   ├── utils/              # Utilities and TanStack Query hooks
│   └── main.tsx            # Application entry point
├── server.cjs              # Express.js backend server
├── knowledge-base/         # Markdown files for AI knowledge base
├── scripts/               # Build and utility scripts
├── cypress/               # E2E tests
└── public/                # Static assets
```

### Key Components
- **DashboardLayout.tsx** - Main application shell
- **ProjectsPage.tsx** - Project management interface
- **QuotesPage.tsx** - Quote creation and management
- **TeamMembersPage.tsx** - Team collaboration features
- **AIWizard.tsx** - AI-powered document processing

### Data Flow
- **TanStack Query** for server state caching and synchronization
- **Context Providers** for mutations and global state
- **WebSocket** connection for real-time updates
- **SQLite** for persistent data storage

## 🧪 Testing

### End-to-End Tests
```bash
npm run test:e2e     # Run Cypress tests headless
npm run cypress:open # Open Cypress test runner
```

### Test Coverage
- Authentication flows
- Project CRUD operations
- Quote generation workflows
- Team member management
- Payment processing

## 🚢 Deployment

### Production Build
```bash
npm run build    # Build frontend for production
```

### Environment Variables
Ensure all production environment variables are set:
- Database connections
- API keys (Gemini, Stripe, Supabase)
- Session secrets
- CORS origins

### Database Migration
The application handles schema migrations automatically on startup.

## 🏗️ Architecture

### Design Patterns
- **Hybrid full-stack architecture** with separate frontend/backend
- **Component-based design system** with TailwindCSS
- **Server state management** via TanStack Query
- **Real-time updates** through WebSocket connections
- **Multi-tenant data isolation** by company/user

### Key Features
- **Responsive design** with mobile-first approach
- **Dark/light theme** support
- **Progressive Web App** capabilities
- **SEO-friendly** routing and meta tags

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use the established component patterns
- Write tests for new features
- Follow the existing code style

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support and questions:
- Create an issue in this repository
- Check the knowledge base documentation
- Review the architecture guide in the project docs

## 🗺️ Roadmap

- [ ] Mobile app development
- [ ] Advanced reporting dashboards
- [ ] Integration with QuickBooks
- [ ] Multi-language support
- [ ] Advanced AI features
- [ ] API documentation

---

**Built with ❤️ for the construction industry**

Transform your construction business with modern project management tools.