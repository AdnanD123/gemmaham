# Contractors — Platform Documentation

## Role Overview

The **Contractor** is a tradesperson or service company (electrician, plumber, interior designer, etc.) that works on building construction and flat customization projects. They browse available projects, apply to buildings, get assigned by agencies, track their work progress, self-report completion, manage documents and portfolio, and track their earnings. Their experience feels like a project management tool with clear visibility into assignments, deadlines, progress, financials, and availability.

---

## Current State — What's Done Well

### Category & Subcategory System
- 14 main trade categories with 100+ subcategories (planning_engineering, structural_shell, hvac, electrical, etc.)
- `CategorySubcategoryPicker` component — hierarchical checkbox selection, summary count, compact mode
- Categories stored as structured arrays with derived flat keys for querying
- Robust enough for real-world trade classification

### Application Flow
- Browse buildings with status `planning` or `under_construction`
- `ApplicationModal` — message/pitch + proposed rate + currency
- Contractor's categories shown as read-only badges in modal
- Company sees applications via `ApplicationCard` with accept/reject actions
- Accept auto-creates contractor assignment on the building

### My Applications Page
- **`/contractor/applications` page** showing all submitted applications
- Card list with building name, company name, application date, status badge (pending/accepted/rejected)
- Proposed rate and message/pitch preview
- Company response notes visible (if rejected/accepted)
- **Filter tabs**: All / Pending / Accepted / Rejected
- Link to building detail (if accepted, link to project)
- Nav item in sidebar between "Browse Projects" and "My Projects"

### Progress Self-Reporting
- **ProgressReporter component** on project detail and building detail pages
- Contractors update their own progress % via slider or number input
- Add progress notes with timestamps
- Upload progress photos
- Mark assignment as "completed" (sends notification to company)
- Company can still override any contractor's progress

### Scope Editor
- `ContractorScopeEditor` — powerful 3-tier system (base/upgrade/unavailable) per option type
- Price delta configuration for upgrades
- Bulk actions (mark all base, mark all unavailable)
- Links contractor capabilities to flat customization options

### Profile System
- Logo, business name, specialties, phone, description, website
- `ContractorProfileCard` shows first 3 categories + "+N" overflow
- Profile completion flag for gating
- **Document uploads**: certificates, insurance, licenses (ContractorDocument type with certificate/insurance/license/other)
- **Portfolio section**: upload photos with captions and project names (ContractorPortfolioItem type)
- **Availability management**: set availability status (available/busy/unavailable), available-from date

### Public Contractor Profile
- **`/contractors/:id` — fully redesigned public profile page**
- Hero section with logo, name, company name
- All categories and subcategories displayed as organized badges
- Description / About section
- Contact info (phone, email, website)
- **Portfolio section**: grid of project photos with captions
- **Stats**: completed projects count, derived from assignment data
- Project history section

### Dashboard
- Stat cards: active/total/completed projects, revenue
- Revenue chart + project progress chart
- Assignment list grouped by status (in_progress, upcoming, completed)

### Financial Tracking
- **`/contractor/finances` page**
- Summary cards: Total Earnings, Pending Payments, Completed Projects value
- Project-by-project table: project name, trade, contract value, status, payment status
- Payment status tracking: pending / partial / received (tracked by contractor manually)
- Uses existing `contractValue` + `currency` from contractor assignment data
- No in-app payments — tracking only

### Notification System
- **Notification center page** (`/notifications`) for all roles including contractors
- **NotificationBell component** in navigation with unread count badge
- Notification types: application accepted/rejected, new assignment, scope changes, deadline reminders
- Click-to-navigate to relevant page, mark as read

### Availability & Filtering
- **AvailabilityBadge component** shows availability status with color coding
- Profile availability selector: available / busy / unavailable with available-from date
- **"Show available only" filter** in contractor directory for agencies browsing contractors

### Messaging
- Conversation list + thread view with real-time updates
- **Unread count badges** in sidebar navigation (useUnreadMessages hook)
- **Context bars** showing which building/project the conversation is about
- **Buyer/contractor tabs** in company messages view
- Sticky message input on mobile

### UI/UX Quality
- **Glass design system**: indigo primary, emerald secondary, coral accent, backdrop-blur effects, layered shadows
- **Framer Motion animations**: page transitions (PageTransition), card entrance animations (AnimatedCard), micro-interactions
- **Shimmer skeleton loaders** for all loading states
- **ContentLoader** for standardized loading transitions
- **Lazy loading** on all images
- i18n across all pages (EN, BS, DE)

### Mobile UX
- Sidebar hidden on mobile with hamburger menu toggle
- 44px touch targets for all interactive elements
- Responsive grids that adapt to screen size
- Sticky message input on mobile

### Accessibility
- Skip-to-content link, focus-visible rings, ARIA labels
- role and aria-modal on dialogs
- Contrast fixes, prefers-reduced-motion support

### Form Validation
- Zod schemas for contractor profile setup with field-level error messages
- useFormValidation hook for real-time validation feedback
- useFormDraft hook for auto-saving form state

---

## Phase 5 — Recently Completed

| Feature | Status | Details |
|---------|--------|---------|
| **Calendar View** | DONE | List/Calendar toggle on `/contractor/projects` with month grid, color-coded assignments, click-to-navigate |
| **Contractor Invitations** | DONE | New "Invitations" tab on `/contractor/applications` — accept/decline invitations from agencies |

## Remaining Improvements

### P2 — Nice to Have

| Area | Issue | Target State |
|------|-------|-------------|
| **Browse UX** | Basic grid of project cards | Add filters by category match (show projects needing my trades), by location, by phase. Sort by newest, deadline |
| **Enhanced Project View** | Project detail shows assignment + building info + progress | Add visual timeline with contractor's assignment period highlighted, progress history with photos, deadline markers with urgency coloring |

---

## Page-by-Page Breakdown

### `/contractor/dashboard` — Dashboard
- **Purpose**: Overview of all activity and quick stats
- **Current**: Stat cards (active/total/completed projects, revenue), revenue chart, progress chart, assignment list by status
- **Status**: Complete

### `/contractor/browse` — Browse Projects
- **Purpose**: Discover buildings to apply to
- **Current**: Grid of ProjectCards for planning/under_construction buildings, "Already Applied" badge on applied projects
- **Status**: Complete (P2 filter enhancements optional)

### `/contractor/applications` — My Applications
- **Purpose**: Track all submitted applications and invitations
- **Current**: Tabbed list (all/pending/accepted/rejected/invitations), application cards with status, company notes, building link, proposed rate. Invitations tab shows incoming invitations from agencies with accept/decline actions.
- **Status**: Complete

### `/contractor/projects` — My Projects
- **Purpose**: List all assigned projects
- **Current**: Grouped by status (in_progress, upcoming, completed), project cards with progress bar
- **Status**: Complete

### `/contractor/projects/:id` — Project Detail
- **Purpose**: Full view of assignment + building + progress
- **Current**: Building info, assignment card with trade/status/progress, ProgressReporter component for self-reporting (%, notes, photos), construction updates, document viewing
- **Status**: Complete

### `/contractor/buildings` & `/contractor/buildings/:id` — Buildings
- **Purpose**: Building-centric view of assignments
- **Current**: Grid of assigned buildings, detail with stats, assignment info, construction updates, milestone timeline
- **Status**: Complete

### `/contractor/finances` — Finances
- **Purpose**: Track earnings and payment status
- **Current**: Summary cards (total earnings, pending, completed), project earnings table with manual payment status tracking
- **Status**: Complete

### `/contractor/profile` — Profile Edit
- **Purpose**: Manage contractor profile and capabilities
- **Current**: Logo, name, business name, categories, phone, description, website, **document upload section** (certificates, insurance, licenses), **portfolio photos** with captions, **availability selector** (available/busy/unavailable with date)
- **Status**: Complete

### `/contractors/:id` — Public Profile
- **Purpose**: Public-facing contractor profile for agencies
- **Current**: Full profile page with hero section, logo, categories/subcategories as badges, description, contact info, portfolio grid with captions, project stats
- **Status**: Complete

### `/contractor/messages` — Messages
- **Purpose**: Conversations with agencies
- **Current**: Conversation list + thread view, unread count in sidebar, context bars showing building/project
- **Status**: Complete

### `/notifications` — Notifications
- **Purpose**: View all notifications
- **Current**: Full notification list with read/unread, click-to-navigate, mark as read
- **Status**: Complete

---

## Key User Flows

### Flow 1: Find & Apply to Project
```
Dashboard -> Browse Projects -> See project cards (building info, phase, company)
-> Click "Apply Now" -> ApplicationModal opens
-> Write pitch message, set proposed rate -> Submit
-> Application tracked on /contractor/applications (status: pending)
-> Get notification when accepted/rejected
-> If accepted: project appears in /contractor/projects
```

### Flow 2: Work on Assignment
```
Notification: "Assignment added" -> Go to project detail
-> See assignment: trade, scope, start/end date, deadline
-> Start work -> Update progress (%, note, photos) via ProgressReporter
-> See construction updates from company
-> Upload progress photos -> Company reviews
-> At 100% -> Click "Mark Complete" -> Company confirms
-> Project moves to completed -> Earnings tracked in finances
```

### Flow 3: Track Finances
```
Dashboard -> Finances page
-> See total earnings, pending payments, completed value
-> Per-project table: building name, trade, contract value, status
-> Mark payments as received when paid externally
-> Overview of all financial activity
```

### Flow 4: Manage Profile & Applications
```
Profile -> Edit business info, categories, upload certificates/insurance/licenses
-> Add portfolio photos with captions
-> Set availability status (available/busy/unavailable)
-> Browse -> Apply to projects matching skills
-> Applications -> Track statuses, read company responses
-> Public profile visible to agencies reviewing applications
```

---

## UI/UX Guidelines

- **Design system**: Glass morphism with indigo primary, emerald secondary, coral accent, layered shadows, backdrop-blur
- **Project cards**: Progress bar prominent, trade badge visible, status-colored borders
- **Progress reporting**: ProgressReporter component — slider for %, text note, photo upload. One-click "Mark Complete" when done
- **Dashboard**: Stat cards with key metrics, revenue chart, project list by status
- **Finances**: Clean table layout, summary cards at top (big numbers), per-project table with payment status
- **Public profile**: Hero section, organized category badges, portfolio grid, stats
- **Availability**: Color-coded badges (green = available, yellow = busy, red = unavailable)
- **Animations**: Page transitions, card entrance animations, micro-interactions via Framer Motion
- **Loading**: Shimmer skeleton loaders matching final layout shape
- **Color coding**: Green = completed/accepted/available, Yellow = in_progress/pending/busy, Red = overdue/rejected/unavailable, Blue = upcoming/informational
- **Empty states**: Encouraging prompts ("No projects yet -- browse available projects to apply")
- **Mobile**: Sidebar collapses to hamburger, 44px touch targets, sticky message input, responsive grids
- **Accessibility**: Skip-to-content, focus-visible rings, ARIA labels, prefers-reduced-motion support
