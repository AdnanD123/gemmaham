# Agencies (Companies) — Platform Documentation

## Role Overview

The **Agency** is a real estate company that lists properties (flats, houses, buildings), manages reservations from buyers, assigns and coordinates contractors for construction/customization, and tracks financial performance. Their experience should feel like a streamlined project management tool — Kanban-inspired boards for tracking reservations and construction, clear visibility into deadlines and urgency, and easy property management.

---

## Current State — What's Done Well

### Reservation Management
- Clean 3-tab workflow: Requests → Active → History
- Grouped by property — reduces cognitive load when managing multiple flats
- Rich reservation cards with embedded user snapshot (name, email, phone, photo)
- Modal-based actions: rejection reason, meeting scheduling (date + notes), deposit confirmation
- Full status timeline with audit trail per reservation
- Logical status transitions with appropriate action buttons per state

### Customization Configuration System
- `CustomizationManager` — add customization options per flat with category, choices, default, price impact, deadline
- Copy options between flats (bulk copy saves time)
- Lock mechanism prevents user changes after deadline
- Contractor linking on each option
- `ContractorScopeEditor` — 3-tier system (base/upgrade/unavailable) with price deltas
- Building-level vs flat-level configuration hierarchy

### Construction Timeline
- `ConstructionTimeline` component with vertical visual timeline
- Add updates with title, description, phase, progress %, photos
- Phase badges and progress bars per update
- Photo gallery per update entry

### Contractor Management
- **Dual approach**: Manual entry (name, trade, details) + search & assign (find registered contractors)
- `ContractorSearch` — filter by category, subcategory, name, or email
- Assignment creates structured record with status, progress, scope config
- "Already Assigned" prevention
- Auto-notification to registered contractors

### Building Detail Page (Tabbed Interface)
- 6 well-organized tabs: Details, Units, Updates, Contractors, Applications, Customizations
- Units tab shows all flats with visual status bars
- Applications tab for reviewing contractor applications
- Comprehensive information density without overwhelming

### Analytics
- 4 charts: Monthly revenue, occupancy donut, revenue by property type, property performance table
- Date range selector (30d, 90d, 1y, all)
- Real-time calculation from reservation data

---

## Needs Improvement

### P0 — Critical

| Area | Issue | Target State |
|------|-------|-------------|
| **Dashboard** | Shows 5 stat cards + 2 charts + first 5 pending reservations only | Action-oriented dashboard: "needs attention" section (urgent items), pending counts with links, upcoming deadlines, recent activity feed, quick actions |
| **Property Forms** | Long single-page forms for flats/houses — overwhelming | Step-by-step wizard: Step 1 (basic info), Step 2 (specs), Step 3 (photos), Step 4 (review & publish). Progress indicator at top |
| **Photo Management** | Only floor plan + 3D render per property | Add photo gallery: up to 5 property photos + floor plan + 3D render. Drag-to-reorder, delete, replace |

### P1 — Important

| Area | Issue | Target State |
|------|-------|-------------|
| **Reservation Board** | Tab-based list view only | Add Kanban board option: columns for each status (requested, approved, reserved, completed). Cards are draggable. Visual urgency indicators (expiring soon = red border). Toggle between list/board view |
| **Date Pickers** | Split year/month dropdowns for building dates — cumbersome | Use proper HTML5 date inputs or date picker component. Single field for start date and completion date |
| **Construction Milestones** | Timeline shows updates but no milestone/deadline tracking | Add milestone markers on timeline (e.g., "Foundation complete by March 15"), visual urgency when approaching deadline, overdue highlighting |
| **Notification System** | No notifications for agencies | Bell + center: new reservation requests, contractor applications, customization requests, approaching deadlines, construction milestones due |

### P2 — Nice to Have

| Area | Issue | Target State |
|------|-------|-------------|
| **Customization Options** | Can only add/delete/lock — no inline editing | Allow editing existing options (update choices, price impact, deadline) |
| **Building Updates** | No edit on construction updates, no date field | Add edit capability, date field per update, milestone flag |
| **Form Drafts** | No save-as-draft for long property forms | Auto-save draft state, resume incomplete listings |

---

## Needs to Be Added

### Kanban-Style Project Board (P1)
- **Route**: Toggle on `/company/reservations` (list view ↔ board view)
- **Columns**: Requested | Approved | Reserved | Completed (+ rejected/expired collapsed)
- **Cards**: Property name, user name, days in status, urgency indicator
- **Urgency Rules**:
  - Green border: < 7 days in status
  - Yellow border: 7-12 days in status
  - Red border: > 12 days or expiring within 2 days
- **Interaction**: Click card → expand details with action buttons (same actions as list view)
- **Not draggable for status change** (status changes require deliberate action with notes/modals — drag would skip important steps)
- **Sort within column**: By date (oldest first) or urgency

### Construction Kanban / Timeline (P1)
- **Route**: New tab or view on building detail page
- **Purpose**: Visual overview of all construction phases and contractor assignments
- **Layout**: Horizontal timeline with:
  - Phase blocks (foundation → structure → facade → interior → finishing → handover)
  - Current phase highlighted with progress bar
  - Contractor assignments shown as bars spanning their active period
  - Milestone markers (diamond icons) with dates and labels
  - Today line (vertical red dashed line)
  - Deadline flags with urgency coloring
- **Milestone Management**:
  - Add milestone: title, date, phase, description
  - Auto-warning when milestone approaching (7 days) or overdue
  - Link milestones to contractor assignments

### Property Photo Gallery (P0)
- **Upload Interface** on flat/house creation and edit forms:
  - Floor plan upload (existing)
  - 3D render generation (existing)
  - Property photos section: upload up to 5 photos
  - Drag-to-reorder
  - Each photo: thumbnail preview, delete button, optional caption
  - File type: JPEG/PNG, max 5MB each
- **Data Model Addition**: Add `photos: { url: string, caption?: string, order: number }[]` to Flat and House types
- **Storage Path**: `properties/{propertyId}/photos/{filename}`

### Financial Tracking Dashboard (P1)
- **Route**: Enhanced `/company/analytics` or new `/company/finances` section
- **Revenue Tracking** (existing analytics, improved):
  - Total revenue (from completed reservations)
  - Revenue by property (table with property name, price, status)
  - Monthly revenue trend (existing chart)
- **Cost Tracking** (NEW):
  - Contractor costs per building (sum of contract values from assigned contractors)
  - Cost breakdown by trade category
  - Per-building P&L: revenue from sold flats - contractor costs
- **Summary Cards**: Total Revenue, Total Costs, Net Profit, Properties Sold, Active Reservations
- **No external payment integration** — all amounts from existing model data (property prices, contract values)

### Document Management (P1)
- **Per-Building Document Section** (new tab or section in building detail):
  - Upload documents: building plans, permits, contracts, specifications
  - Document types: `plan`, `permit`, `contract`, `specification`, `other`
  - Each document: name, type, upload date, uploaded by, file
  - **Sharing**: Mark documents as shared with contractors (visible on their project detail) or shared with buyers (visible on property detail)
  - **Access Control**: Agency can share/unshare at any time
- **Storage Path**: `buildings/{buildingId}/documents/{filename}`
- **Data Model**: `buildings/{id}/documents/{id}` subcollection:
  ```
  { name, type, url, uploadedBy, sharedWithContractors: boolean, sharedWithBuyers: boolean, createdAt }
  ```

### Team Management (P1 — Recommended)
- **Route**: `/company/settings/team`
- **Roles within company**:
  - **Owner**: Full access (current single-user model)
  - **Manager**: Can manage properties, reservations, contractors. Cannot delete company or manage team
  - **Agent**: Can view properties, handle reservations and messages assigned to them. Cannot create/delete properties
- **Features**:
  - Invite team member by email
  - Assign role
  - View team list with role badges
  - Remove team member
- **Data Model**: `companies/{id}/members/{uid}` subcollection with `role` field
- **Auth**: Extend custom claims to include company role, update RoleGuard to check permissions
- **Why**: Real agencies have multiple agents. Without this, only one person can manage everything — bottleneck for any serious agency

### Notification System (P0)
- **Notification Bell** in navbar with unread count
- **Notification Types**:
  - New reservation request → link to reservations
  - Contractor application received → link to building applications tab
  - Customization request submitted → link to requests page
  - Contractor marked assignment complete → link to building contractors tab
  - Milestone deadline approaching (7 days) → link to building
  - Reservation expiring (2 days) → link to reservation
- **Center Page**: `/company/notifications` — full list, mark read

### Enhanced Dashboard (P0)
- **Layout Redesign**:
  - **"Needs Attention" Section** (top):
    - Pending reservation requests (count + "Review" link)
    - Pending contractor applications (count + "Review" link)
    - Pending customization requests (count + "Review" link)
    - Overdue milestones (count + "View" link)
    - Expiring reservations (within 2 days, count + "View" link)
  - **Quick Stats Row**: Buildings, Properties, Revenue, Active Reservations (clickable → relevant page)
  - **Recent Activity Feed**: Last 10 actions across the system (new reservation, application, message, status change) with timestamps and links
  - **Charts**: Keep revenue + occupancy charts (smaller, side by side)

---

## Page-by-Page Breakdown

### `/company/dashboard` — Dashboard
- **Purpose**: Command center for daily operations
- **Current**: 5 stat cards, 2 charts, first 5 pending reservations
- **Target**: "Needs attention" alerts, clickable stats, recent activity feed, compact charts, quick actions
- **Priority**: P0

### `/company/buildings` — Building List
- **Purpose**: Overview of all construction projects
- **Current**: Card grid with status, progress, unit count
- **Target**: Add deadline/urgency indicators, milestone approaching warnings, sort/filter options
- **Priority**: P1

### `/company/buildings/new` — Create Building
- **Purpose**: Add new construction project
- **Current**: Single-page form with all fields
- **Target**: Step wizard (basic info → location → construction details → cover photo → review). Proper date inputs
- **Priority**: P1

### `/company/buildings/:id` — Building Detail (Tabbed)
- **Purpose**: Full building management hub
- **Current**: 6 tabs (Details, Units, Updates, Contractors, Applications, Customizations)
- **Target**: Add milestone management to Updates tab. Add document management tab. Enhanced contractor view with progress from self-reporting. Construction Kanban/timeline view option. Urgency indicators on approaching deadlines
- **Priority**: P0 (milestones), P1 (documents, Kanban)

### `/company/properties` — Properties Overview
- **Purpose**: Manage all flats and houses
- **Current**: Tab toggle (Buildings vs Houses), card grid
- **Target**: Unified list with type badges, sort/filter, status indicators, quick actions (change status, feature/unfeature)
- **Priority**: P1

### `/company/flats/new` & `/company/flats/:id` — Flat Management
- **Purpose**: Create and edit flat listings
- **Current**: Long single-page form + floor plan upload + 3D generation
- **Target**: Step wizard (basic info → specs → photos [floor plan + gallery] → 3D generation → review). Photo gallery upload (5 photos)
- **Priority**: P0 (photos), P1 (wizard)

### `/company/properties/houses/new` & `/company/properties/houses/:id` — House Management
- **Purpose**: Create and edit house listings
- **Current**: HouseForm component, comprehensive but long
- **Target**: Same step wizard pattern as flats. Photo gallery support. Match flat feature parity
- **Priority**: P0 (photos), P1 (wizard)

### `/company/reservations` — Reservation Management
- **Purpose**: Process and track all reservations
- **Current**: 3 tabs (Requests/Active/History), grouped by property, rich cards
- **Target**: Add Kanban board toggle (list ↔ board view). Urgency indicators on expiring reservations. Keep current list view as default (it works well)
- **Priority**: P1

### `/company/requests` — Customization Requests
- **Purpose**: Review and respond to user customization selections
- **Current**: 4 filter tabs, grouped by flat, bulk approve, response templates
- **Target**: Keep current UX (it's effective). Add notification when new request arrives. Add price impact summary per flat
- **Priority**: P2

### `/company/analytics` — Analytics
- **Purpose**: Business performance overview
- **Current**: Date range selector, 4 charts (revenue, occupancy, revenue by type, property performance)
- **Target**: Add cost tracking section (contractor costs per building). Add net profit calculation. Add property-level P&L table. Keep existing charts
- **Priority**: P1

### `/company/contractors` — Contractor Directory
- **Purpose**: Find contractors for projects
- **Current**: Category/subcategory/name filters, contractor cards
- **Target**: Add "Invite to Apply" button (sends message to contractor about a specific building). Show contractor's availability status. Link to full public profile
- **Priority**: P2

### `/company/messages` — Messages
- **Purpose**: Conversations with buyers and contractors
- **Current**: Conversation list + thread view
- **Target**: Add unread count in sidebar. Separate tabs for buyer conversations vs contractor conversations. Show property/building context in thread header
- **Priority**: P1

### `/company/finances` — Finances (NEW)
- **Purpose**: Financial tracking and cost management
- **Current**: Does not exist (partially in analytics)
- **Target**: Revenue summary, cost breakdown by building/contractor, per-building P&L, summary cards
- **Priority**: P1

### `/company/settings/team` — Team Management (NEW)
- **Purpose**: Manage company staff and permissions
- **Current**: Does not exist
- **Target**: Team member list, invite by email, assign roles (owner/manager/agent), remove members
- **Priority**: P1

### `/company/notifications` — Notifications (NEW)
- **Purpose**: View all notifications
- **Current**: Does not exist
- **Target**: Full notification list with read/unread, click-to-navigate
- **Priority**: P0

---

## Key User Flows

### Flow 1: Property Listing (New Flat in Building)
```
Dashboard → Buildings → Select Building → Units tab
→ Click "Add Unit" → Step 1: Basic info (title, price, currency)
→ Step 2: Specs (bedrooms, bathrooms, area, unit number)
→ Step 3: Photos (upload floor plan + 5 property photos)
→ Step 4: 3D Generation (generate from floor plan)
→ Step 5: Review & Publish
→ Flat created → Configure customization options
→ Property live on marketplace
```

### Flow 2: Reservation Processing
```
Notification: "New reservation request" → Dashboard "Needs Attention"
→ Click → Reservations page (or Kanban board)
→ Review reservation card (user info, property, notes, additional info)
→ Approve → Schedule meeting (date + notes)
→ Meeting completed → Confirm deposit (amount)
→ Mark as Reserved → User selects customizations
→ Review customization requests → Approve/reject each
→ All complete → Mark Completed
```

### Flow 3: Construction Management
```
Create Building → Set phases, dates, milestones
→ Post to marketplace → Contractors apply
→ Review applications → Accept qualified contractors
→ Configure scope for each contractor
→ Track progress: visual timeline with phase blocks + contractor bars
→ Contractors self-report progress + photos
→ Company reviews, adds construction updates
→ Milestone approaching → Get notification → Review status
→ Building complete → All flats available for reservation
```

### Flow 4: Contractor Coordination
```
Building detail → Contractors tab
→ Option A: Search registered contractors → Assign
→ Option B: Manual entry for unregistered contractors
→ Configure scope (base/upgrade/unavailable per option type)
→ Set contract value, start/end dates
→ Contractor works → Self-reports progress
→ Company reviews progress photos and updates
→ Contractor marks complete → Company confirms
→ Cost tracked in financial dashboard
```

### Flow 5: Financial Overview
```
Dashboard → Finances / Analytics
→ See total revenue from property sales
→ See total contractor costs per building
→ Per-building P&L: (sum of sold flat prices) - (sum of contractor values)
→ Identify most/least profitable buildings
→ Monthly revenue trend → plan future projects
```

---

## UI/UX Guidelines

- **Dashboard**: "Needs attention" cards at top with counts and urgency colors. Think of it as a morning briefing — "here's what you need to do today"
- **Kanban board**: Clean columns with card counts. Cards show essential info only (property, user, days in status). Color-coded borders for urgency. Not drag-to-move (status changes are deliberate actions)
- **Construction timeline**: Horizontal Gantt-like visualization. Phase blocks with progress fills. Contractor assignment bars overlaid. Milestone diamonds. Today line. Zoom levels (month/quarter)
- **Property wizard**: Multi-step form with progress bar at top (Step 1 of 5). Each step focused. Back/next navigation. Save as draft
- **Photo gallery manager**: Grid of thumbnails with + button. Drag to reorder. Click to preview. X to delete. Upload progress indicator
- **Financial tables**: Clean, scannable. Summary cards at top (big numbers). Table below with sortable columns. Color for profit (green) vs loss (red)
- **Notifications**: Red badge on bell. Dropdown for quick view. Types grouped by icon (reservation, contractor, construction, message)
- **Color coding**:
  - Status: Green = completed/available, Orange = in-progress/pending, Red = overdue/rejected/expired, Blue = reserved/upcoming
  - Urgency: Green border = on track, Yellow = approaching deadline, Red = overdue/critical
- **Empty states**: Action-oriented ("No buildings yet — create your first building to start listing properties")
- **Mobile**: Sidebar collapses to hamburger. Kanban scrolls horizontally. Forms stack vertically. Cards full-width
