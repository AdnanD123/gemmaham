# Contractors — Platform Documentation

## Role Overview

The **Contractor** is a tradesperson or service company (electrician, plumber, interior designer, etc.) that works on building construction and flat customization projects. They browse available projects, apply to buildings, get assigned by agencies, track their work progress, and manage their earnings. Their experience should feel like a project management tool — clear visibility into assignments, deadlines, progress, and financials.

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

### Scope Editor
- `ContractorScopeEditor` — powerful 3-tier system (base/upgrade/unavailable) per option type
- Price delta configuration for upgrades
- Bulk actions (mark all base, mark all unavailable)
- Links contractor capabilities to flat customization options

### Profile System
- Logo, business name, specialties, phone, description, website
- `ContractorProfileCard` shows first 3 categories + "+N" overflow
- Profile completion flag for gating

### Dashboard
- Stat cards: active/total/completed projects, revenue
- Revenue chart + project progress chart
- Assignment list grouped by status (in_progress, upcoming, completed)

---

## Needs Improvement

### P0 — Critical

| Area | Issue | Target State |
|------|-------|-------------|
| **My Applications Page** | Contractors can apply but have NO page to track application status | New `/contractor/applications` page showing all applications with status (pending/accepted/rejected), company response notes, and building links |
| **Progress Self-Reporting** | Only company can update contractor progress % | Contractors should update their own progress %, add notes, upload progress photos for their assigned scope |
| **Project Detail View** | Shows basic building info + assignment card + construction updates | Enhanced view: clear timeline with deadlines, their specific scope highlighted, progress input, photo upload, milestone markers |

### P1 — Important

| Area | Issue | Target State |
|------|-------|-------------|
| **Public Profile Page** | `/contractors/:id` route exists but is minimal | Full public profile: logo, name, company, all categories/subcategories, description, contact info, portfolio section, project history |
| **Financial Tracking** | Contract value exists in model but no financial views | Earnings dashboard: per-project amounts, total earnings, payment status (pending/received), simple table view |
| **Notification System** | No notifications for contractors | Bell + center: application accepted/rejected, new assignment, scope changes, deadline reminders |
| **Browse UX** | Basic grid of project cards, no filtering | Add filters: by category match (show projects needing my trades), by location, by phase. Sort by newest, deadline |

### P2 — Nice to Have

| Area | Issue | Target State |
|------|-------|-------------|
| **Document Uploads** | No way to share certificates, insurance, licenses | Profile section for uploading verification documents, visible to agencies |
| **Calendar/Availability** | No scheduling visibility | Simple availability indicator (available now / booked until date) |
| **Portfolio** | No showcase of past work | Photo gallery on public profile showing completed projects |

---

## Needs to Be Added

### My Applications Page (P0)
- **Route**: `/contractor/applications`
- **Display**: Card list of all submitted applications
  - Building name + cover image
  - Company name
  - Application date
  - Status badge (pending → yellow, accepted → green, rejected → red)
  - Proposed rate
  - Message/pitch preview
  - Company response notes (if rejected/accepted)
  - Link to building detail (if accepted → link to project)
- **Filters**: All / Pending / Accepted / Rejected tabs
- **Sidebar**: Add "My Applications" nav item between "Browse Projects" and "My Projects"

### Progress Self-Reporting (P0)
- **Where**: On project detail page (`/contractor/projects/:id`) and building detail page
- **Capabilities**:
  - Update progress % via slider or number input (only for their own assignment)
  - Add progress note (text) with timestamp
  - Upload progress photos (up to 3 per update)
  - Mark assignment as "completed" (sends notification to company)
- **Company side**: Company can still override any contractor's progress
- **Data Model Addition**: `progressUpdates` subcollection on building contractor document:
  ```
  { percent: number, note: string, photos: string[], createdAt: timestamp }
  ```

### Financial Tracking (P1)
- **Route**: `/contractor/finances` or section within dashboard
- **Display**:
  - Summary cards: Total Earnings, Pending Payments, Completed Projects value
  - Project-by-project table:
    | Project | Trade | Contract Value | Status | Payment Status |
  - Payment status: `pending` / `partial` / `received` (tracked by contractor manually)
- **Data**: Uses existing `contractValue` + `currency` from Contractor assignment
- **Note**: No in-app payments — this is tracking only. Contractor marks payment status themselves

### Enhanced Public Profile (P1)
- **Route**: `/contractors/:id`
- **Layout**:
  - Hero section: Logo + name + company name + tagline
  - Categories & subcategories displayed as organized badges
  - Description / About section
  - Contact info (phone, email, website) — only shown if contractor opts in
  - Portfolio section: Grid of project photos with captions (pulled from completed assignments)
  - Stats: X completed projects, Y years active (derived from data)
  - "Contact" button → creates conversation with contractor (if company is viewing)

### Notification System (P0)
- **Notification Bell** in navbar with unread count
- **Notification Types**:
  - Application accepted → link to new project
  - Application rejected → link to applications page with reason
  - New assignment added → link to project
  - Scope configuration changed → link to project
  - Deadline approaching (7 days) → link to project
  - Company updated your progress → link to project
- **Center Page**: `/contractor/notifications` — full list, mark read, click to navigate

### Enhanced Project View (P1)
- **Current**: Basic building info + "My Assignment" card + construction updates list
- **Target Layout**:
  - **Header**: Building title, address, company name, status
  - **My Assignment Card** (prominent):
    - Trade, category, subcategories
    - Status badge (upcoming → in_progress → completed)
    - Progress bar with editable % (self-report)
    - Start date, end date, deadline indicator
    - Contract value
    - "Update Progress" button → modal with %, note, photos
    - "Mark Complete" button (when progress = 100%)
  - **Timeline Section**:
    - Visual timeline showing all construction phases
    - Current phase highlighted
    - My assignment period highlighted on timeline
    - Deadline markers with urgency coloring (green → yellow → red)
  - **Progress History**: List of my progress updates with photos
  - **Documents Section**: Shared documents from agency (plans, specs, permits)
  - **Construction Updates**: Building-wide updates from agency (read-only)

### Document Management (P2)
- **Profile Documents**: Upload section on `/contractor/profile`
  - Certificate uploads (trade license, insurance, qualifications)
  - Visible to agencies when reviewing applications
  - Simple list: filename, upload date, download link
- **Project Documents**: Per-building shared documents
  - Agency uploads plans, specs, permits
  - Contractor can view and download
  - Organized by document type

---

## Page-by-Page Breakdown

### `/contractor/dashboard` — Dashboard
- **Purpose**: Overview of all activity and quick stats
- **Current**: Stat cards, revenue chart, progress chart, assignment list by status
- **Target**: Add notification feed (latest 5), upcoming deadlines widget, pending applications count, quick link to browse projects. Make stat cards clickable (navigate to relevant page)
- **Priority**: P1

### `/contractor/browse` — Browse Projects
- **Purpose**: Discover buildings to apply to
- **Current**: Grid of ProjectCards for planning/under_construction buildings
- **Target**: Add filters (category match — "show projects that need my trade", location, phase). Sort by newest, deadline. Show "Already Applied" badge. Highlight projects matching contractor's categories
- **Priority**: P1

### `/contractor/applications` — My Applications (NEW)
- **Purpose**: Track all submitted applications
- **Current**: Does not exist
- **Target**: Tabbed list (all/pending/accepted/rejected), application cards with status, company notes, building link
- **Priority**: P0

### `/contractor/projects` — My Projects
- **Purpose**: List all assigned projects
- **Current**: Grouped by status (in_progress, upcoming, completed), basic cards
- **Target**: Enhanced cards with progress bar, deadline indicator, urgency coloring. Quick-update progress from card. Sort by deadline/urgency
- **Priority**: P1

### `/contractor/projects/:id` — Project Detail
- **Purpose**: Full view of assignment + building + progress
- **Current**: Building info + assignment card + construction updates
- **Target**: Enhanced assignment card with self-report, visual timeline, progress history, shared documents, deadline markers (see "Enhanced Project View" above)
- **Priority**: P0

### `/contractor/buildings` & `/contractor/buildings/:id` — Buildings
- **Purpose**: Building-centric view of assignments
- **Current**: Grid of assigned buildings, detail with stats + assignment + updates
- **Target**: Consider merging with projects view (they overlap). If kept separate, add same enhancements as project detail
- **Priority**: P2

### `/contractor/finances` — Finances (NEW)
- **Purpose**: Track earnings and payment status
- **Current**: Does not exist
- **Target**: Summary cards + project earnings table with manual payment status tracking
- **Priority**: P1

### `/contractor/profile` — Profile Edit
- **Purpose**: Manage contractor profile and capabilities
- **Current**: Logo, name, business name, categories, phone, description, website
- **Target**: Add document upload section (certificates, insurance). Add portfolio photos section. Preview of public profile link
- **Priority**: P1

### `/contractors/:id` — Public Profile
- **Purpose**: Public-facing contractor profile for agencies
- **Current**: Minimal or non-functional
- **Target**: Full profile page with logo, categories, description, portfolio, stats, contact button
- **Priority**: P1

### `/contractor/messages` — Messages
- **Purpose**: Conversations with agencies
- **Current**: Conversation list + thread view
- **Target**: Add unread count in sidebar, improve context (show which building/project the conversation is about)
- **Priority**: P2

### `/contractor/notifications` — Notifications (NEW)
- **Purpose**: View all notifications
- **Current**: Does not exist
- **Target**: Full notification list with read/unread, click-to-navigate
- **Priority**: P0

---

## Key User Flows

### Flow 1: Find & Apply to Project
```
Dashboard → Browse Projects → Filter by trade/location
→ See project card (building info, phase, company)
→ Click "Apply Now" → ApplicationModal opens
→ Write pitch message, set proposed rate → Submit
→ Application tracked on /contractor/applications (status: pending)
→ Get notification when accepted/rejected
→ If accepted: project appears in /contractor/projects
```

### Flow 2: Work on Assignment
```
Notification: "Assignment added" → Go to project detail
→ See assignment: trade, scope, start/end date, deadline
→ Start work → Update progress (%, note, photos) periodically
→ Track on visual timeline → See how my work fits in building phases
→ Upload progress photos → Company reviews
→ At 100% → Click "Mark Complete" → Company confirms
→ Project moves to completed → Earnings tracked in finances
```

### Flow 3: Track Finances
```
Dashboard → Finances page
→ See total earnings, pending payments, completed value
→ Per-project table: building name, trade, contract value, status
→ Mark payments as received when paid externally
→ Overview of all financial activity
```

### Flow 4: Manage Profile & Applications
```
Profile → Edit business info, categories, upload certificates
→ Browse → Apply to projects matching skills
→ Applications → Track statuses, read company responses
→ Public profile visible to agencies reviewing applications
```

---

## UI/UX Guidelines

- **Project cards**: Emphasis on deadline/urgency — color-coded borders (green = on track, yellow = approaching deadline, red = overdue). Progress bar prominent. Trade badge visible
- **Timeline visualization**: Horizontal timeline bar showing all construction phases, contractor's assignment period highlighted, current date marker, deadline flags
- **Progress reporting**: Simple modal — slider for %, text note, photo upload (drag-drop). One-click "Mark Complete" when done
- **Dashboard**: Action-oriented — "What needs attention" at top (deadlines, pending applications), stats below, then project list
- **Finances**: Clean table layout, summary cards at top, no charts needed (simple table is clearer for tracking)
- **Color coding**: Green = completed/accepted, Yellow = in_progress/pending, Red = overdue/rejected, Blue = upcoming/informational
- **Empty states**: Encouraging prompts ("No projects yet — browse available projects to apply")
- **Mobile**: Cards should stack cleanly, progress update modal should work well on mobile
