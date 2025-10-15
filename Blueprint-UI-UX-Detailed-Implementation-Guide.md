# Blueprint FP&A - Complete UI/UX Revamp - Detailed Implementation Guide

## Table of Contents
1. [Phase 1: Foundation & Animation System](#phase-1)
2. [Phase 2: Navigation & Layout Enhancement](#phase-2)
3. [Phase 3: Card & Data Display Modernization](#phase-3)
4. [Phase 4: Advanced Data Tables](#phase-4)
5. [Phase 5: Forms & Modals Enhancement](#phase-5)
6. [Phase 6: Notifications & Feedback](#phase-6)
7. [Phase 7: Button & Interactive Elements](#phase-7)
8. [Phase 8: Charts & Visualizations](#phase-8)
9. [Phase 9: Page-Specific Enhancements](#phase-9)
10. [Phase 10: Micro-Interactions & Polish](#phase-10)
11. [Phase 11: Dark Mode Refinement](#phase-11)
12. [Phase 12: Accessibility & Performance](#phase-12)
13. [Component Mapping Summary](#component-mapping)
14. [Implementation To-Do List](#todo-list)

---

<a name="phase-1"></a>
## Phase 1: Foundation & Animation System

### Overview
Establish the foundational animation and design system that will power all subsequent UI enhancements.

### Dependencies to Install
```bash
npm install framer-motion @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select @radix-ui/react-tooltip @radix-ui/react-tabs cmdk sonner react-hot-toast vaul
```

### 1.1 Tailwind Configuration Enhancement

**File:** `tailwind.config.js`

**Additions:**
- Custom animations (shimmer, fade-in-up, scale-in, slide-up)
- Extended color palette with gradients
- Custom shadows (glow effects)
- Custom backdrop blur values
- Animation timing functions

**Key Features:**
```javascript
animation: {
  'shimmer': 'shimmer 2s linear infinite',
  'fade-in-up': 'fadeInUp 0.5s ease-out',
  'scale-in': 'scaleIn 0.3s ease-out',
  'slide-up': 'slideUp 0.4s ease-out'
}
```

### 1.2 Global Animation System

**New File:** `src/utils/animations.ts`

**Purpose:** Centralized Framer Motion animation variants for consistency

**Variants to Create:**
- `fadeInUp` - Element fades in while moving up
- `fadeInDown` - Element fades in while moving down
- `scaleIn` - Element scales from 95% to 100%
- `slideInRight` - Slides from right
- `slideInLeft` - Slides from left
- `staggerContainer` - Parent container for staggered children
- `staggerItem` - Child element in stagger sequence
- `hoverScale` - Subtle scale on hover
- `tapScale` - Scale down on click

**Example Implementation:**
```typescript
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeOut' }
};
```

### 1.3 Page Transitions Setup

**New File:** `src/utils/transitions.ts`

**Purpose:** Consistent page transition configurations

**Transitions:**
- Page fade
- Page slide
- Modal backdrop
- Drawer slide-up
- Toast slide-in

---

<a name="phase-2"></a>
## Phase 2: Navigation & Layout Enhancement

### 2.1 Command Palette (⌘K)

**New File:** `src/components/CommandPalette.tsx`

**Purpose:** Quick navigation and search across the entire platform

**Features:**
- Global keyboard shortcut (Cmd/Ctrl + K)
- Fuzzy search algorithm
- Search categories:
  - Projects
  - Quotes
  - Vendors
  - Cost Codes
  - Quick Actions
  - Navigation
- Recent items history
- Keyboard navigation (↑↓ to navigate, Enter to select, Esc to close)
- Visual keyboard shortcut hints

**Implementation Pattern:**
- Uses `cmdk` library
- Framer Motion for enter/exit animations
- Radix Dialog for accessibility
- Search debouncing (300ms)
- Max 8 results per category

**Integration:**
- Add to `src/App.tsx` with global keyboard listener
- Add to `DashboardLayout.tsx` for rendering
- Add search icon trigger in navigation header

### 2.2 Enhanced Sidebar

**File:** `src/components/Sidebar.tsx`

**Enhancements:**
1. **Animations:**
   - Smooth width transition on expand/collapse
   - Icon bounce on hover
   - Active indicator sliding animation
   - Tooltip fade-in on hover (when collapsed)

2. **Active State Indicator:**
   - Animated sliding bar on left edge
   - Gradient background highlight
   - Icon color change

3. **Micro-interactions:**
   - Icons rotate/bounce on hover
   - Badge pulse for notifications
   - Smooth transitions between states

4. **Tooltips:**
   - Radix Tooltip when sidebar collapsed
   - Position: right
   - Delay: 300ms

**Code Pattern:**
```typescript
<motion.li
  whileHover={{ x: 4 }}
  whileTap={{ scale: 0.98 }}
  className="sidebar-item"
>
  <Tooltip content="Projects" side="right">
    <Icon />
  </Tooltip>
</motion.li>
```

### 2.3 Breadcrumb Navigation

**New File:** `src/components/Breadcrumbs.tsx`

**Purpose:** Show current location in hierarchy

**Features:**
- Auto-generated from route
- Clickable segments
- Separator with chevron icon
- Truncate long names with tooltip
- Responsive (collapse on mobile)

**Add To:**
- `ViewProjectPage.tsx` → Home / Projects / [Project Name]
- `ViewQuotePage.tsx` → Home / Quotes / [Quote Name]
- `CostCodesPage.tsx` → Home / Settings / Cost Codes

---

<a name="phase-3"></a>
## Phase 3: Card & Data Display Modernization

### 3.1 Bento Grid Layout for Dashboard

**File:** `src/components/Dashboard.tsx`

**Current:** Simple grid with equal-sized cards
**New:** Bento-style layout with varying card sizes

**Grid Structure:**
- Small (1x1): Quick stats (Total Budget, Projects, Quotes)
- Medium (2x1): Bar charts, recent activity
- Large (2x2): Budget vs Actuals overview
- Wide (3x1): Timeline or notifications

**CSS Grid Setup:**
```css
grid-template-columns: repeat(4, 1fr);
grid-auto-rows: 200px;
gap: 1.5rem;
```

**Animation:**
- Stagger cards on page load (0.1s delay between each)
- Cards fade in with slight upward movement
- Charts animate data in after card appears

### 3.2 Skeleton Loaders

**New Files:**
- `src/components/SkeletonCard.tsx`
- `src/components/SkeletonTable.tsx`
- `src/components/SkeletonChart.tsx`

**Features:**
- Shimmer animation (gradient moving left to right)
- Matches actual content layout
- Dark mode compatible
- Accessible (aria-label="Loading...")

**Shimmer Implementation:**
```css
background: linear-gradient(
  90deg,
  rgba(255, 255, 255, 0) 0%,
  rgba(255, 255, 255, 0.2) 50%,
  rgba(255, 255, 255, 0) 100%
);
animation: shimmer 2s infinite;
```

**Replace Loading States In:**
- `Dashboard.tsx` (lines 98-131)
- `ViewProjectPage.tsx` (lines 112-138)
- `QuotesPage.tsx`
- `ProjectsPage.tsx`

### 3.3 Enhanced Card Component

**File:** `src/components/Card.tsx`

**New Features:**
1. **Hover Effects:**
   - Lift with increased shadow
   - Gradient border glow
   - Slight scale increase

2. **Variants:**
   - `variant="glass"` - Current glassmorphism
   - `variant="gradient"` - Gradient background
   - `variant="bordered"` - With animated border
   - `variant="glow"` - Glowing border on hover

3. **Interactive States:**
   - `hover` prop - Enable/disable hover effects
   - `clickable` prop - Cursor pointer + tap animation
   - `loading` prop - Show shimmer overlay

**Animation Example:**
```typescript
<motion.div
  whileHover={{ y: -8, boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}
  transition={{ type: "spring", stiffness: 300 }}
>
```

### 3.4 Project & Quote Cards

**Files:** `ProjectsPage.tsx`, `QuotesPage.tsx`

**Enhancements:**
1. **Visual:**
   - Gradient progress bars (animated fill)
   - Status badges with pulse for "urgent"
   - Priority indicators (color-coded flags)
   - Hover reveal actions menu

2. **Animations:**
   - Cards stagger in on page load
   - Hover lift effect
   - Action buttons slide in on hover
   - Smooth status badge transitions

3. **Interactions:**
   - Click card → Navigate to detail
   - Checkbox for bulk selection (animated)
   - Quick actions on hover (Edit, Delete, Duplicate)

---

<a name="phase-4"></a>
## Phase 4: Advanced Data Tables

### 4.1 Install TanStack Table

```bash
npm install @tanstack/react-table
```

### 4.2 Base DataTable Component

**New File:** `src/components/ui/DataTable.tsx`

**Features:**
- Column sorting (multi-column support)
- Column resizing (drag divider)
- Column visibility toggle
- Sticky header on scroll
- Row selection (single/multi)
- Pagination
- Search/filtering
- Export functionality (CSV, PDF)
- Virtualized rows for large datasets
- Responsive (horizontal scroll on mobile)

**Advanced Features:**
- Inline editing (click cell to edit)
- Expandable rows
- Row actions menu
- Custom cell renderers
- Loading states
- Empty states

### 4.3 Budget vs Actuals Table Enhancement

**File:** `src/components/BudgetVsActualsReport.tsx`

**Current:** Custom table implementation
**New:** TanStack Table with advanced features

**Enhancements:**
1. **Sorting:**
   - Click column header to sort
   - Multi-column sort (Shift+Click)
   - Visual sort indicator (arrow icon)

2. **Filtering:**
   - Division filter (multi-select)
   - Status filter (over/under/on budget)
   - Amount range slider
   - Search by cost code or description

3. **Grouping:**
   - Group by division (collapsible)
   - Subtotals per division
   - Grand total row

4. **Interactions:**
   - Click row to expand details
   - Hover shows variance tooltip
   - Color-coded variance column
   - Export filtered data

5. **Animations:**
   - Rows fade in on load
   - Smooth expand/collapse
   - Sort animation (rows reorder)

### 4.4 Other Tables

**Apply same pattern to:**
- Quotes table (`QuotesPage.tsx`)
- Projects table (`ProjectsPage.tsx`)
- Actuals ledger (`ActualsLedger.tsx`)
- Vendors table (`VendorsDataPage.tsx`)

**Consistent Features:**
- Same column config pattern
- Same filter UI
- Same export functionality
- Same keyboard shortcuts

---

<a name="phase-5"></a>
## Phase 5: Forms & Modals Enhancement

### 5.1 Modal Animation Enhancement

**Pattern:** Wrap all modals with Framer Motion `AnimatePresence`

**Files to Update:**
- `CreateQuoteModal.tsx`
- `LineItemModal.tsx`
- `ActualCostModal.tsx`
- `VendorModal.tsx`
- `CreateProjectModal` (in ProjectsPage.tsx)
- `ChangeOrderModal.tsx`

**Animation Spec:**
- Backdrop: Fade in (opacity 0 → 1)
- Modal: Scale in (0.95 → 1) + Fade
- Exit: Reverse animation
- Duration: 300ms
- Easing: ease-out

**Mobile Behavior:**
- Modals slide up from bottom
- Full height on small screens
- Swipe down to dismiss

**Code Template:**
```typescript
<AnimatePresence>
  {isOpen && (
    <>
      <motion.div
        className="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="modal"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### 5.2 Enhanced Form Input Components

**New Files:**

1. **`src/components/ui/Input.tsx`**
   - Floating labels (label moves up on focus)
   - Icon support (left/right positioned)
   - Error state with animated message
   - Success state with checkmark
   - Character counter
   - Clear button
   - Variants: default, filled, underline

2. **`src/components/ui/Select.tsx`**
   - Custom dropdown using Radix Select
   - Search/filter options
   - Multi-select support
   - Custom option rendering
   - Keyboard navigation
   - Loading state
   - Empty state

3. **`src/components/ui/DatePicker.tsx`**
   - Calendar popup (Radix Popover)
   - Range selection support
   - Quick presets (Today, Last 7 days, etc.)
   - Month/year navigation
   - Disable past/future dates
   - Animated calendar open/close

4. **`src/components/ui/Combobox.tsx`**
   - Searchable select
   - For: Vendors, Cost Codes, Projects
   - Fuzzy search
   - Recent selections
   - Add new option inline
   - Keyboard navigation

### 5.3 Multi-Step Form Wizard

**New File:** `src/components/ProjectWizard.tsx`

**Purpose:** Replace simple Create Project modal

**Steps:**
1. Basic Info (name, description)
2. Budget Setup (total budget, baseline)
3. Team Assignment (assign members)
4. Cost Code Selection (optional)

**Features:**
- Progress stepper (visual indicator)
- Smooth slide transitions between steps
- Form validation per step (can't proceed if invalid)
- Back/Next buttons
- Keyboard navigation (Ctrl+Enter to next)
- Save as draft
- Review screen before submit

**Step Transitions:**
- Current step slides out left
- Next step slides in from right
- Back: Reverse direction

---

<a name="phase-6"></a>
## Phase 6: Notifications & Feedback

### 6.1 Advanced Toast System

**Replace:** `src/components/Toast.tsx`
**With:** Sonner library

**Installation:**
```bash
npm install sonner
```

**Features:**
- Multiple toast types (success, error, warning, info, loading, promise)
- Toast positioning (top-left, top-right, bottom-center, etc.)
- Action buttons in toasts
- Rich content (icons, images, custom JSX)
- Progress bar for auto-dismiss
- Stack multiple toasts
- Swipe to dismiss (mobile)
- Keyboard shortcuts (Esc to dismiss all)
- Persistent toasts (no auto-dismiss)

**Usage Examples:**
```typescript
// Success with action
toast.success('Project created', {
  description: 'Commercial Building',
  action: {
    label: 'View',
    onClick: () => navigate(`/projects/${id}`)
  }
});

// Promise toast (loading → success/error)
toast.promise(
  createProject(data),
  {
    loading: 'Creating project...',
    success: 'Project created!',
    error: 'Failed to create project'
  }
);
```

**Update All Toast Calls In:**
- Project creation/update/delete
- Quote actions
- Line item operations
- Actual cost logging
- Settings changes

### 6.2 Empty States

**New File:** `src/components/EmptyState.tsx`

**Props:**
- `title` - Headline text
- `description` - Explanation text
- `icon` - Lucide icon component
- `action` - Primary CTA button
- `secondaryAction` - Secondary link/button

**Use Cases:**
- No projects yet
- No quotes for project
- No actual costs logged
- Search returns no results
- No team members
- No vendors added
- No cost codes

**Animation:**
- Icon bounces on mount
- Content fades in
- Button has subtle pulse

**Add To:**
- `ProjectsPage.tsx`
- `QuotesPage.tsx`
- `ActualsLedger.tsx`
- `VendorsDataPage.tsx`
- `CostCodesPage.tsx`
- `Dashboard.tsx` (for new users)

---

<a name="phase-7"></a>
## Phase 7: Button & Interactive Elements

### 7.1 Enhanced Button Component

**File:** `src/components/Button.tsx`

**New Variants:**
- `destructive` - Red gradient (delete actions)
- `success` - Green gradient (confirmations)
- `ghost-hover` - Transparent until hover
- `gradient` - Animated gradient background
- `link` - Styled like a link

**New Sizes:**
- `xs` - Extra small (icon buttons)
- `xl` - Extra large (hero CTAs)

**New Features:**
1. **Ripple Effect:**
   - Click creates expanding circle animation
   - Like Material Design ripple
   - Color matches button variant

2. **Icon Animation:**
   - Icons rotate/bounce on hover
   - Configurable animation type

3. **Loading State:**
   - Spinner smoothly replaces content
   - Button disabled during loading
   - Width doesn't jump

4. **Tooltip:**
   - Optional tooltip on hover
   - Explain why button is disabled

5. **Keyboard Shortcuts:**
   - Visual hint (e.g., "⌘K")
   - Trigger on key press

**Implementation:**
```typescript
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className={variants[variant]}
>
  {loading ? <Spinner /> : (
    <>
      {icon && <AnimatedIcon icon={icon} />}
      {children}
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </>
  )}
</motion.button>
```

### 7.2 Dropdown Menu Component

**New File:** `src/components/ui/DropdownMenu.tsx`

**Built with:** Radix UI Dropdown Menu

**Features:**
- Smooth open/close animation
- Keyboard navigation (↑↓)
- Sub-menus support
- Checkbox menu items
- Radio group items
- Dividers and labels
- Icons per item
- Keyboard shortcuts display
- Destructive action styling

**Use Cases:**
- Quote actions (Edit, Duplicate, Delete, Export)
- Project card options
- User profile menu
- Table row actions
- More options (...)

**Replace In:**
- `QuotesPage.tsx` - Create dropdown
- Project cards - Options menu
- Table rows - Actions column
- Navigation - User menu

**Animation:**
```typescript
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
>
```

---

<a name="phase-8"></a>
## Phase 8: Charts & Visualizations

### 8.1 Animated Charts

**File:** `src/components/Dashboard.tsx`

**Current:** Static Recharts
**Enhancement:** Add animations

**Recharts Animation Config:**
```typescript
<BarChart>
  <Bar
    dataKey="revenue"
    fill="url(#gradient)"
    animationDuration={800}
    animationEasing="ease-in-out"
    isAnimationActive={true}
  />
</BarChart>
```

**Features:**
1. **Data Animation:**
   - Bars grow from 0
   - Lines draw from left to right
   - Pie slices animate in

2. **Tooltips:**
   - Custom styled tooltips
   - Gradient backgrounds
   - Icon indicators
   - Animated entrance

3. **Grid Lines:**
   - Fade in after data
   - Subtle color

4. **Legends:**
   - Interactive (click to toggle series)
   - Hover highlights

5. **Responsive:**
   - Adjusts to container size
   - Mobile-friendly tooltips

### 8.2 Budget Health Indicator

**File:** `src/components/BudgetHealthIndicator.tsx`

**Current:** Simple text-based indicator
**Enhancement:** Visual circular progress

**Features:**
1. **Circular Progress:**
   - Donut chart style
   - Gradient stroke
   - Percentage in center
   - Status color (green/yellow/red)

2. **Count-Up Animation:**
   - Numbers count up from 0
   - Triggered on scroll into view
   - Easing function

3. **Pulse Animation:**
   - For critical states (>90% spent)
   - Subtle scaling pulse

4. **Hover Tooltip:**
   - Detailed breakdown
   - Budget vs actual amounts
   - Variance in dollars

**Library:** Use Recharts `PieChart` or custom SVG

---

<a name="phase-9"></a>
## Phase 9: Page-Specific Enhancements

### 9.1 Dashboard Page

**File:** `src/components/Dashboard.tsx`

**Enhancements:**
1. **Bento Grid** (covered in Phase 3)

2. **New Widgets:**
   - **Recent Activity Timeline**
     - Shows last 10 actions
     - Icons for each action type
     - Relative timestamps
     - Click to view details
   
   - **Quick Actions Panel**
     - Floating action button (bottom-right)
     - Radial menu on click
     - Common actions: New Project, New Quote, Log Expense
   
   - **Top Vendors Widget**
     - Shows 5 vendors by spend
     - Horizontal bar chart
     - Click to view vendor details
   
   - **Upcoming Deadlines**
     - List of quotes/projects nearing deadlines
     - Color-coded by urgency
     - Countdown timer

3. **Animations:**
   - All cards stagger in (0.1s between each)
   - Numbers count up
   - Charts animate data in
   - Time period selector smooth transition

### 9.2 View Project Page

**File:** `src/components/ViewProjectPage.tsx`

**Current Layout:** Vertical sections
**New Layout:** Tabbed interface

**Tabs:**
1. Overview - KPIs, summary, timeline
2. Budget vs Actuals - Enhanced table
3. Quotes - Embedded quotes list
4. Actuals Ledger - Enhanced table
5. Change Orders - List with filters
6. Team & Activity - Members + timeline

**Features:**
1. **Sticky Header:**
   - Project name
   - Status badge (animated pulse if active)
   - Quick actions (Edit, Share, Export, Delete)
   - Breadcrumbs

2. **Tab Animations:**
   - Content slides left/right on tab change
   - Active tab underline slides
   - Smooth height transition

3. **Floating Action Button:**
   - Bottom-right corner
   - Context-aware (changes per tab)
   - Overview → "New Quote"
   - Actuals → "Log Expense"
   - Bounces on page load

4. **Keyboard Shortcuts:**
   - ? → Show shortcuts panel
   - 1-6 → Switch tabs
   - N → New (context action)
   - S → Share

5. **Share Functionality:**
   - Generate shareable link
   - Copy to clipboard with toast
   - Permission selector

6. **Export:**
   - PDF report generation
   - Excel export
   - Email report

### 9.3 Projects Page - Kanban View

**File:** `src/components/ProjectsPage.tsx`

**New Feature:** View toggle

**Views:**
1. **List View** (current) - Table/grid of cards
2. **Kanban View** - Drag-and-drop columns
3. **Timeline View** - Gantt-style timeline

**Kanban Implementation:**

**New File:** `src/components/KanbanBoard.tsx`

**Library:** `@dnd-kit/core` for drag-and-drop

**Columns:**
- Planning
- In Progress
- Review
- Completed
- On Hold

**Features:**
1. **Drag & Drop:**
   - Smooth drag animation
   - Ghost card preview
   - Auto-scroll on drag to edge
   - Drop zone highlight

2. **Column Actions:**
   - Collapse/expand
   - Filter cards
   - Sort cards (priority, date)
   - Count badge

3. **Card Features:**
   - Mini version of project card
   - Priority flag
   - Progress bar
   - Team avatars
   - Quick actions on hover

4. **Animations:**
   - Cards reorder smoothly
   - New card flies in
   - Deleted card shrinks out

### 9.4 Quotes Page Enhancements

**File:** `src/components/QuotesPage.tsx`

**Enhancements:**
1. **Quick Preview:**
   - Hover on quote card → Popover appears
   - Shows: Line items count, total, status, project
   - Position: Adjacent to cursor
   - Delay: 500ms

2. **Inline Status Change:**
   - Click status badge → Dropdown
   - Change status without opening modal
   - Toast confirmation
   - Optimistic update

3. **Advanced Filters:**
   - **Multi-select Status**
   - **Date Range** (created, updated)
   - **Project Filter**
   - **Amount Range** (slider)
   - **Client Name** (search)
   - **Saved Filter Views** (save custom filters)

4. **Batch Actions Toolbar:**
   - Appears when selecting multiple quotes
   - Actions: Change Status, Assign Project, Delete, Export
   - Count selected
   - Clear selection button

---

<a name="phase-10"></a>
## Phase 10: Micro-Interactions & Polish

### 10.1 Hover States Everywhere

**Components to Enhance:**

1. **All Cards:**
   - Lift effect (translateY: -8px)
   - Shadow increase (spread + blur)
   - Scale: 1.02
   - Border glow (gradient)

2. **All Buttons:**
   - Scale: 1.02 on hover
   - Scale: 0.98 on click
   - Brightness increase
   - Shadow grows

3. **Table Rows:**
   - Background color change
   - Action buttons fade in from right
   - Hover line on left edge

4. **Links:**
   - Underline animation (width: 0 → 100%)
   - Color shift
   - Icon rotation

5. **Icons:**
   - Rotate 15deg on hover
   - Or bounce animation
   - Color change

### 10.2 Page Transitions

**File:** `src/App.tsx`

**Implementation:**
Wrap `<Routes>` with `AnimatePresence`

**Transition Types:**
1. **Fade:** Page fades out/in
2. **Slide:** Page slides left/right
3. **Scale:** Page scales down/up

**Example:**
```typescript
<AnimatePresence mode="wait">
  <motion.div
    key={location.pathname}
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    transition={{ duration: 0.3 }}
  >
    <Routes location={location}>
      {/* routes */}
    </Routes>
  </motion.div>
</AnimatePresence>
```

### 10.3 Scroll Animations

**New Hook:** `src/hooks/useScrollAnimation.ts`

**Purpose:** Trigger animations when elements scroll into view

**Uses:**
- Dashboard cards fade in as you scroll
- Stats counters trigger on visibility
- Feature sections slide in
- Images lazy load with fade

**Implementation:**
```typescript
import { useInView } from 'framer-motion';

const ref = useRef(null);
const isInView = useInView(ref, { once: true });

<motion.div
  ref={ref}
  initial={{ opacity: 0, y: 50 }}
  animate={isInView ? { opacity: 1, y: 0 } : {}}
>
```

### 10.4 Confirmation Dialog Enhancement

**File:** `src/components/ConfirmationModal.tsx`

**Enhancements:**
1. **Icon Animation:**
   - Delete → Trash icon shakes
   - Warning → Alert icon pulses
   - Success → Checkmark draws in

2. **Color Coding:**
   - Danger (red) - Delete actions
   - Warning (yellow) - Risky actions
   - Info (blue) - Informational
   - Success (green) - Confirmations

3. **Type to Confirm:**
   - For critical actions (Delete Project)
   - Must type project name to confirm
   - Real-time validation

4. **Keyboard Shortcuts:**
   - Enter → Confirm (focus cancel by default for safety)
   - Esc → Cancel
   - Show hints at bottom

---

<a name="phase-11"></a>
## Phase 11: Dark Mode Refinement

### Current State
Basic dark mode exists with class-based toggle

### Enhancements

**1. Theme Toggle Animation**
- Icon morphs (sun → moon)
- Rotate animation
- Color transition

**2. Smooth Color Transitions**
- Use CSS custom properties
- Transition: 200ms ease
- All colors transition smoothly

**3. Storage & Preference**
- Store in localStorage
- Detect system preference
- Respect prefers-color-scheme

**4. Dark Mode Optimizations**
- Adjust glassmorphism opacity
- Different shadow values
- Reduce glow intensities
- Optimize contrast

**5. Theme Provider**
- Context for theme state
- Toggle function
- System preference sync

---

<a name="phase-12"></a>
## Phase 12: Accessibility & Performance

### 12.1 Accessibility Improvements

**Keyboard Navigation:**
- Tab order logical
- All interactive elements focusable
- Skip to main content link
- Focus visible (ring indicator)
- Escape closes modals/dropdowns

**ARIA:**
- All icons have aria-label
- Buttons have descriptive labels
- Form inputs have labels
- Live regions for dynamic content
- Role attributes where needed

**Screen Readers:**
- Meaningful alt text
- Announce state changes
- Loading announcements
- Error announcements

**Color Contrast:**
- WCAG AA compliance
- Minimum 4.5:1 for text
- Audit with tools

**Motion Preferences:**
- Respect prefers-reduced-motion
- Disable animations if requested
- Provide toggle in settings

### 12.2 Performance Optimizations

**Code Splitting:**
```typescript
const Dashboard = lazy(() => import('./Dashboard'));
const ProjectsPage = lazy(() => import('./ProjectsPage'));
// Wrap with Suspense
```

**Virtualization:**
- Install react-virtual
- For tables with 100+ rows
- For long lists

**Memoization:**
```typescript
const expensiveValue = useMemo(() => 
  calculateBudgetVsActuals(data),
  [data]
);
```

**Debouncing:**
- Search inputs (300ms)
- Filter updates (200ms)

**Image Optimization:**
- WebP format
- Lazy loading
- Responsive sizes

**Bundle Analysis:**
- Run: `npm run build -- --analyze`
- Identify large dependencies
- Consider alternatives

---

<a name="component-mapping"></a>
## Component Mapping Summary

### Components to Enhance

| Current | Enhancement | Pattern |
|---------|------------|---------|
| `Button.tsx` | Variants, ripple, animations | Animated buttons |
| `Card.tsx` | Gradient borders, hover glow | Bento cards |
| `Dashboard.tsx` | Bento grid, animated charts | Variable-size cards |
| `Sidebar.tsx` | Micro-interactions, tooltips | Animated sidebar |
| `Toast.tsx` | Replace with Sonner | Modern toasts |
| All Modals | AnimatePresence, transitions | Slide/scale modals |
| `ProjectsPage.tsx` | Kanban, advanced table | Drag-drop boards |
| `BudgetVsActualsReport.tsx` | Advanced table | Sortable data table |
| Forms | Multi-step, better inputs | Wizards, floating labels |
| Loading states | Skeleton screens | Shimmer skeletons |

### New Components to Create

1. `CommandPalette.tsx` - ⌘K search
2. `Breadcrumbs.tsx` - Navigation
3. `SkeletonCard/Table/Chart.tsx` - Loading
4. `EmptyState.tsx` - Empty views
5. `ui/DataTable.tsx` - Advanced tables
6. `ui/Input.tsx` - Enhanced input
7. `ui/Select.tsx` - Custom select
8. `ui/DatePicker.tsx` - Date picker
9. `ui/Combobox.tsx` - Searchable select
10. `ui/DropdownMenu.tsx` - Menus
11. `ProjectWizard.tsx` - Multi-step form
12. `KanbanBoard.tsx` - Kanban view
13. `Timeline.tsx` - Activity timeline
14. `FloatingActionButton.tsx` - FAB

---

<a name="todo-list"></a>
## Implementation To-Do List

### Phase 1: Foundation & Animation System
- [ ] Install framer-motion, @radix-ui packages, cmdk, sonner
- [ ] Update tailwind.config.js with custom animations, shadows, design tokens
- [ ] Create src/utils/animations.ts with Framer Motion variants
- [ ] Create src/utils/transitions.ts with page transition configs

### Phase 2: Navigation & Layout
- [ ] Create src/components/CommandPalette.tsx with fuzzy search
- [ ] Add global Cmd/Ctrl+K keyboard listener in App.tsx
- [ ] Integrate CommandPalette into DashboardLayout.tsx
- [ ] Enhance Sidebar.tsx with Framer Motion animations
- [ ] Add Radix Tooltip to collapsed sidebar items
- [ ] Create src/components/Breadcrumbs.tsx
- [ ] Add Breadcrumbs to ViewProjectPage, ViewQuotePage, CostCodesPage

### Phase 3: Cards & Display
- [ ] Create SkeletonCard.tsx with shimmer animation
- [ ] Create SkeletonTable.tsx
- [ ] Create SkeletonChart.tsx
- [ ] Replace loading spinners in Dashboard.tsx
- [ ] Replace loading spinners in ViewProjectPage.tsx
- [ ] Replace loading spinners in QuotesPage.tsx
- [ ] Refactor Dashboard.tsx to Bento grid layout
- [ ] Add stagger animations to Dashboard cards
- [ ] Enhance Card.tsx with hover effects and variants
- [ ] Add hover animations to ProjectCard
- [ ] Add gradient borders and glow effects

### Phase 4: Advanced Data Tables
- [ ] Install @tanstack/react-table
- [ ] Create src/components/ui/DataTable.tsx base component
- [ ] Add column resizing, sticky headers to DataTable
- [ ] Add inline editing capability
- [ ] Add virtual scrolling for large datasets
- [ ] Add export menu (CSV, PDF, Excel)
- [ ] Add column visibility toggle
- [ ] Add advanced filters
- [ ] Refactor BudgetVsActualsReport.tsx with TanStack Table
- [ ] Apply advanced table to QuotesPage.tsx
- [ ] Apply advanced table to ProjectsPage.tsx
- [ ] Apply advanced table to ActualsLedger.tsx
- [ ] Apply advanced table to VendorsDataPage.tsx
- [ ] Add quick actions menu on row hover
- [ ] Add animated checkboxes for bulk selection

### Phase 5: Forms & Modals
- [ ] Wrap CreateQuoteModal.tsx with AnimatePresence
- [ ] Wrap LineItemModal.tsx with AnimatePresence
- [ ] Wrap ActualCostModal.tsx with AnimatePresence
- [ ] Wrap VendorModal.tsx with AnimatePresence
- [ ] Wrap CreateProjectModal with AnimatePresence
- [ ] Wrap ChangeOrderModal.tsx with AnimatePresence
- [ ] Add backdrop blur and scale animations to all modals
- [ ] Add mobile slide-up behavior
- [ ] Create src/components/ui/Input.tsx with floating labels
- [ ] Create src/components/ui/Select.tsx with Radix
- [ ] Create src/components/ui/DatePicker.tsx
- [ ] Create src/components/ui/Combobox.tsx
- [ ] Replace all form inputs with enhanced components
- [ ] Add inline validation with animated errors
- [ ] Create src/components/ProjectWizard.tsx
- [ ] Add progress stepper to wizard
- [ ] Add form validation per step
- [ ] Add save as draft to wizard

### Phase 6: Notifications & Feedback
- [ ] Install sonner package
- [ ] Replace Toast.tsx with Sonner implementation
- [ ] Update all toast.success calls
- [ ] Update all toast.error calls
- [ ] Add action buttons to important toasts
- [ ] Add promise toasts for async operations
- [ ] Create src/components/EmptyState.tsx
- [ ] Add EmptyState to ProjectsPage.tsx
- [ ] Add EmptyState to QuotesPage.tsx
- [ ] Add EmptyState to ActualsLedger.tsx
- [ ] Add EmptyState to VendorsDataPage.tsx
- [ ] Add EmptyState for search results
- [ ] Add bounce animation to EmptyState icons

### Phase 7: Buttons & Interactive
- [ ] Add destructive variant to Button.tsx
- [ ] Add success variant to Button.tsx
- [ ] Add ghost-hover variant to Button.tsx
- [ ] Add gradient variant to Button.tsx
- [ ] Add xs and xl sizes to Button.tsx
- [ ] Add ripple effect on click
- [ ] Add icon animation support
- [ ] Add tooltip for disabled state
- [ ] Create src/components/ui/DropdownMenu.tsx
- [ ] Replace dropdown in QuotesPage.tsx
- [ ] Add dropdown to ProjectCard
- [ ] Add dropdown to table row actions
- [ ] Add keyboard navigation to dropdowns
- [ ] Add sub-menu support

### Phase 8: Charts & Visualizations
- [ ] Add animationDuration to all Recharts
- [ ] Add animationEasing to charts
- [ ] Create custom gradient tooltips
- [ ] Add stagger to chart data points
- [ ] Enhance BudgetHealthIndicator.tsx with circular progress
- [ ] Add count-up animation to percentages
- [ ] Add pulse animation for critical states
- [ ] Add color transitions based on health

### Phase 9: Page-Specific Enhancements
- [ ] Create src/components/Timeline.tsx
- [ ] Add Timeline to Dashboard.tsx
- [ ] Create src/components/FloatingActionButton.tsx
- [ ] Refactor ViewProjectPage.tsx to tabs layout
- [ ] Add sticky header to ViewProjectPage
- [ ] Add keyboard shortcuts panel
- [ ] Add share project functionality
- [ ] Add export project report
- [ ] Create src/components/KanbanBoard.tsx
- [ ] Install @dnd-kit/core
- [ ] Add view toggle to ProjectsPage
- [ ] Implement drag-and-drop
- [ ] Add column collapse/expand
- [ ] Add quick preview popovers to QuotesPage
- [ ] Add inline status change to quotes
- [ ] Add advanced filters to QuotesPage
- [ ] Add saved filter views

### Phase 10: Micro-Interactions & Polish
- [ ] Add hover lift to all cards
- [ ] Add scale animations to all buttons
- [ ] Add highlight to table rows on hover
- [ ] Add underline animation to links
- [ ] Add icon animations on hover
- [ ] Wrap App.tsx routes with AnimatePresence
- [ ] Add page fade transitions
- [ ] Create src/hooks/useScrollAnimation.ts
- [ ] Add scroll animations to Dashboard cards
- [ ] Add parallax to Hero section
- [ ] Enhance ConfirmationModal with icon animations
- [ ] Add color-coding to confirmations
- [ ] Add "type to confirm" for dangerous actions

### Phase 11: Dark Mode Refinement
- [ ] Add theme transition animations
- [ ] Persist theme in localStorage
- [ ] Add system preference detection
- [ ] Animate theme toggle icon
- [ ] Adjust glassmorphism for dark mode
- [ ] Optimize shadows for dark mode
- [ ] Add CSS custom properties for colors

### Phase 12: Accessibility & Performance
- [ ] Audit keyboard navigation
- [ ] Add visible focus indicators
- [ ] Add ARIA labels to icon buttons
- [ ] Add screen reader announcements
- [ ] Add skip to main content link
- [ ] Run WCAG AA color contrast audit
- [ ] Implement React.lazy for routes
- [ ] Install react-virtual
- [ ] Add virtualization to long tables
- [ ] Add debouncing to search inputs
- [ ] Optimize images (WebP, lazy load)
- [ ] Add memoization to expensive calculations
- [ ] Run Lighthouse audit
- [ ] Add prefers-reduced-motion support
- [ ] Measure Core Web Vitals

---

## Notes for Implementation

**Decision Points (User Input Needed):**
- Color palette confirmation (current blue/purple gradient OK?)
- Animation speed preferences (default 300ms OK?)
- Which phases to prioritize if time-constrained
- Mobile experience priorities
- Any specific industry standards for construction FP&A

**Testing Checklist:**
- [ ] Visual review in Chrome
- [ ] Visual review in Firefox
- [ ] Visual review in Safari
- [ ] Mobile responsive check
- [ ] Dark mode check
- [ ] Keyboard navigation test
- [ ] Screen reader test
- [ ] Performance benchmarks

**Success Metrics:**
- Command Palette reduces average clicks by 50%
- Page load time < 2 seconds
- Lighthouse score > 90
- Zero keyboard navigation barriers
- WCAG AA compliant
- User feedback: "Modern and professional"

