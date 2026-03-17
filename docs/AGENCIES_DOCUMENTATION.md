# Agencies (Companies) — Platform Documentation

## Role Overview

The **Agency** is a real estate company that lists properties (flats, houses, buildings), manages reservations from buyers, assigns and coordinates contractors for construction/customization, manages building documents and milestones, and tracks financial performance. Their experience feels like a streamlined project management tool — Kanban boards for tracking reservations, milestone timelines for construction, document management for collaboration, and clear visibility into deadlines and urgency.

---

## Current State — What's Done Well

### Dashboard with "Needs Attention"
- **PrioritySection component** at top of dashboard showing urgent items:
  - Pending reservation requests (count + "Review" link)
  - Pending contractor applications (count + "Review" link)
  - Pending customization requests (count + "Review" link)
  - Overdue milestones (count + "View" link)
  - Expiring reservations (within 2 days, count + "View" link)
- Quick stats row: Buildings, Properties, Revenue, Active Reservations
- Revenue and occupancy charts (compact, side by side)

### Reservation Management
- Clean 3-tab workflow: Requests -> Active -> History
- Grouped by property — reduces cognitive load when managing multiple flats
- Rich reservation cards with embedded user snapshot (name, email, phone, photo)
- **Additional booking info visible**: preferred move-in date, financing method, occupants, urgency level, special requirements
- Modal-based actions: rejection reason, meeting scheduling (date + notes), deposit confirmation
- Full status timeline with audit trail per reservation
- Logical status transitions with appropriate action buttons per state
- **Kanban board view** (KanbanBoard component): columns for each status (requested, approved, reserved, completed), list/board toggle, urgency indicators (color-coded borders based on time in status)

### Property Creation Wizard
- **FormWizard component** for multi-step property creation
- **4-step flat creation**: basic info -> specs -> photos (floor plan + gallery) -> review & publish
- **4-step house creation**: same wizard pattern with house-specific fields
- Progress indicator at top showing current step
- **Form drafts auto-save**: useFormDraft hook saves progress, DraftIndicator banner shows when draft available to resume
- Form validation via Zod schemas at each step

### Photo Management
- **PhotoUploader component**: upload multiple property photos with progress tracking
- **PhotoGallery component**: grid display with lightbox overlay + keyboard navigation
- `photos: string[]` field on both Flat and House types
- Floor plan upload (existing) + 3D render generation (existing) + property photo gallery
- Storage function `uploadPropertyPhoto` for generic photo uploads

### Customization Configuration System
- `CustomizationManager` — add customization options per flat with category, choices, default, price impact, deadline
- Copy options between flats (bulk copy saves time)
- Lock mechanism prevents user changes after deadline
- Contractor linking on each option
- `ContractorScopeEditor` — 3-tier system (base/upgrade/unavailable) with price deltas
- Building-level vs flat-level configuration hierarchy
- **Inline editing** with edit mode on option cards and AnimatePresence transitions

### Construction Milestones
- **BuildingMilestone type**: id, title, date, phase, description, completed status
- **MilestoneTimeline component**: visual timeline with:
  - Phase bars (foundation -> structure -> facade -> interior -> finishing -> handover)
  - Diamond markers for milestones
  - Today line (vertical indicator)
  - Overdue warnings with urgency coloring
- Milestone management integrated into building detail page
- Auto-warning when milestone approaching or overdue

### Construction Timeline
- `ConstructionTimeline` component with vertical visual timeline
- Add updates with title, description, phase, progress %, photos
- Phase badges and progress bars per update
- Photo gallery per update entry

### Document Management
- **DocumentManager component** for per-building document management
- Upload documents: building plans, permits, contracts, specifications
- Document types: `plan`, `permit`, `contract`, `specification`, `other`
- Each document: name, type, upload date, uploaded by, file link
- **Sharing controls**: mark documents as shared with contractors and/or shared with buyers
- Agency can share/unshare at any time
- Storage functions for building document upload and deletion (uploadBuildingDocument, deleteBuildingDocumentFile)
- BuildingDocument type in shared types

### Contractor Management
- **Dual approach**: Manual entry (name, trade, details) + search & assign (find registered contractors)
- `ContractorSearch` — filter by category, subcategory, name, or email
- **Availability filter**: "show available only" toggle using AvailabilityBadge
- Assignment creates structured record with status, progress, scope config
- "Already Assigned" prevention
- Auto-notification to registered contractors
- **Contractor self-reporting**: contractors update their own progress via ProgressReporter, company reviews

### Financial Tracking
- **`/company/finances` page**
- Revenue tracking from completed reservations
- Contractor costs per building (sum of contract values from assigned contractors)
- Per-building P&L: revenue from sold flats minus contractor costs
- Summary cards: Total Revenue, Total Costs, Net Profit, Properties Sold, Active Reservations

### Building Detail Page (Tabbed Interface)
- 6+ well-organized tabs: Details, Units, Updates, Contractors, Applications, Customizations
- Units tab shows all flats with visual status bars
- Applications tab for reviewing contractor applications
- **Milestones** integrated into timeline/updates view
- **Documents tab** for building document management
- Comprehensive information density without overwhelming

### Analytics
- 4 charts: Monthly revenue, occupancy donut, revenue by property type, property performance table
- Date range selector (30d, 90d, 1y, all)
- Real-time calculation from reservation data

### Notification System
- **Notification center page** (`/notifications`) for all roles including agencies
- **NotificationBell component** in navigation with unread count badge
- Notification types: new reservation requests, contractor applications, customization requests, milestone deadlines, reservation expiring
- Click-to-navigate, mark as read

### Messaging
- Conversation list + thread view with real-time updates
- **Unread count badges** in sidebar navigation (useUnreadMessages hook)
- **Buyer/contractor tabs**: separate tabs for buyer conversations vs contractor conversations
- **Context bars** showing property/building context in thread header
- Direct conversation routes (`/company/messages/:conversationId`)

### UI/UX Quality
- **Glass design system**: indigo primary (#5856d6), emerald secondary, coral accent, backdrop-blur effects, layered shadows
- **Framer Motion animations**: page transitions (PageTransition), card entrance animations (AnimatedCard), micro-interactions
- **Shimmer skeleton loaders** for all loading states
- **ContentLoader** for standardized loading transitions
- **Lazy loading** on all images
- **Unified sidebar-only navigation** (slim utility bar in root layout)
- i18n across all pages (EN, BS, DE)

### Mobile UX
- Sidebar hidden on mobile with hamburger menu toggle
- 44px touch targets for all interactive elements
- Responsive grids that adapt to screen size
- Kanban board scrolls horizontally on mobile
- Forms stack vertically, cards full-width
- Sticky message input on mobile

### Accessibility
- Skip-to-content link, focus-visible rings, ARIA labels
- role and aria-modal on dialogs
- Contrast fixes, prefers-reduced-motion support

### Form Validation & Drafts
- Zod schemas for property creation (flat, house) with field-level errors
- useFormValidation hook for real-time feedback
- **useFormDraft hook** auto-saves form progress to localStorage
- **DraftIndicator banner** shows when draft available to resume
- Integrated into property creation wizards

---

## Remaining Improvements

### P1 — Important

| Area | Issue | Target State |
|------|-------|-------------|
| **Team Management** | Single-user model per company | `/company/settings/team` — invite team members by email, assign roles (owner/manager/agent), manage permissions |
| **Date Pickers** | Some date inputs use split year/month dropdowns | Use proper HTML5 date inputs or date picker component consistently across all forms |

### P2 — Nice to Have

| Area | Issue | Target State |
|------|-------|-------------|
| **Building Updates** | No edit on existing construction updates | Add edit capability and date field per update |
| **Contractor Invitation** | Agencies browse contractors but cannot invite directly | "Invite to Apply" button on contractor cards (sends message about a specific building) |
| **PDF Generation** | No downloadable documents | "Download Brochure" on properties, "Download Confirmation" on reservations |

---

## Page-by-Page Breakdown

### `/company/dashboard` — Dashboard
- **Purpose**: Command center for daily operations
- **Current**: "Needs Attention" section (PrioritySection) with urgent item counts and links, clickable stat cards, revenue + occupancy charts
- **Status**: Complete

### `/company/buildings` — Building List
- **Purpose**: Overview of all construction projects
- **Current**: Card grid with status, progress, unit count, milestone indicators
- **Status**: Complete

### `/company/buildings/new` — Create Building
- **Purpose**: Add new construction project
- **Current**: Building creation form with all fields, cover photo upload
- **Status**: Complete

### `/company/buildings/:id` — Building Detail (Tabbed)
- **Purpose**: Full building management hub
- **Current**: 6+ tabs (Details, Units, Updates, Contractors, Applications, Customizations), milestone management with MilestoneTimeline, document management with DocumentManager, contractor progress from self-reporting
- **Status**: Complete

### `/company/properties` — Properties Overview
- **Purpose**: Manage all flats and houses
- **Current**: Tab toggle (Buildings vs Houses), card grid with status indicators
- **Status**: Complete

### `/company/flats/new` — Create Flat
- **Purpose**: Create new flat listing
- **Current**: 4-step FormWizard (basic info -> specs -> photos -> review), Zod validation per step, photo gallery upload, form draft auto-save
- **Status**: Complete

### `/company/flats/:id` — Edit Flat
- **Purpose**: Edit flat listing and configure customizations
- **Current**: Edit form with all fields, floor plan + 3D generation, photo gallery, customization manager with inline editing
- **Status**: Complete

### `/company/properties/houses/new` — Create House
- **Purpose**: Create new house listing
- **Current**: 4-step FormWizard matching flat creation pattern, HouseForm with all fields, photo gallery upload, form draft auto-save
- **Status**: Complete

### `/company/properties/houses/:id` — Edit House
- **Purpose**: Edit house listing
- **Current**: Edit form with all house-specific fields, photo gallery management
- **Status**: Complete

### `/company/reservations` — Reservation Management
- **Purpose**: Process and track all reservations
- **Current**: 3 tabs (Requests/Active/History) + Kanban board toggle (list/board view), grouped by property, rich cards with additional booking info, urgency indicators on expiring reservations
- **Status**: Complete

### `/company/requests` — Customization Requests
- **Purpose**: Review and respond to user customization selections
- **Current**: 4 filter tabs, grouped by flat, bulk approve, response templates, inline editing with AnimatePresence
- **Status**: Complete

### `/company/contractors` — Contractor Directory
- **Purpose**: Find contractors for projects
- **Current**: Category/subcategory/name filters, contractor cards with AvailabilityBadge, "show available only" filter, link to public profile
- **Status**: Complete

### `/company/finances` — Finances
- **Purpose**: Financial tracking and cost management
- **Current**: Revenue summary, contractor costs per building, per-building P&L, summary cards (Total Revenue, Total Costs, Net Profit)
- **Status**: Complete

### `/company/messages` — Messages
- **Purpose**: Conversations with buyers and contractors
- **Current**: Conversation list + thread view, unread count in sidebar, buyer/contractor tabs, context bars showing property/building in header
- **Status**: Complete

### `/notifications` — Notifications
- **Purpose**: View all notifications
- **Current**: Full notification list with read/unread, click-to-navigate, mark as read
- **Status**: Complete

---

## Key User Flows

### Flow 1: Property Listing (New Flat in Building)
```
Dashboard -> Buildings -> Select Building -> Units tab
-> Click "Add Unit" -> Step 1: Basic info (title, price, currency)
-> Step 2: Specs (bedrooms, bathrooms, area, unit number)
-> Step 3: Photos (upload floor plan + property photos gallery)
-> Step 4: Review & Publish (auto-save draft available if interrupted)
-> Flat created -> Configure customization options (inline editing)
-> Property live on marketplace
```

### Flow 2: Reservation Processing
```
Notification: "New reservation request" -> Dashboard "Needs Attention" section
-> Click -> Reservations page (list view or Kanban board)
-> Review reservation card (user info, property, notes, additional info: move-in date, financing, occupants, urgency)
-> Approve -> Schedule meeting (date + notes)
-> Meeting completed -> Confirm deposit (amount)
-> Mark as Reserved -> User selects customizations
-> Review customization requests -> Approve/reject each (inline editing)
-> All complete -> Mark Completed
```

### Flow 3: Construction Management
```
Create Building -> Set phases, dates
-> Add milestones (title, date, phase, description) -> MilestoneTimeline displays
-> Upload documents (plans, permits, specs) -> Share with contractors/buyers
-> Post to marketplace -> Contractors apply
-> Review applications -> Accept qualified contractors
-> Configure scope for each contractor
-> Track progress: milestone timeline with phase bars + today line + overdue warnings
-> Contractors self-report progress + photos via ProgressReporter
-> Company reviews, adds construction updates
-> Milestone approaching -> Notification + overdue warning
-> Building complete -> All flats available for reservation
```

### Flow 4: Contractor Coordination
```
Building detail -> Contractors tab
-> Option A: Search registered contractors (filter by availability) -> Assign
-> Option B: Manual entry for unregistered contractors
-> Configure scope (base/upgrade/unavailable per option type)
-> Set contract value, start/end dates
-> Contractor works -> Self-reports progress via ProgressReporter
-> Company reviews progress photos and updates
-> Contractor marks complete -> Company confirms
-> Cost tracked in financial dashboard (/company/finances)
```

### Flow 5: Financial Overview
```
Dashboard -> Finances page
-> See total revenue from property sales
-> See total contractor costs per building
-> Per-building P&L: (sum of sold flat prices) - (sum of contractor values)
-> Identify most/least profitable buildings
-> Summary cards: Total Revenue, Total Costs, Net Profit
```

---

## UI/UX Guidelines

- **Design system**: Glass morphism with indigo primary (#5856d6), emerald secondary, coral accent, layered shadows, backdrop-blur effects
- **Dashboard**: "Needs Attention" cards at top with counts and urgency colors (PrioritySection). Morning briefing pattern -- "here's what you need to do today"
- **Kanban board**: Clean columns with card counts. Cards show essential info only (property, user, days in status). Color-coded borders for urgency. Click to expand (not drag-to-move for status changes)
- **Milestone timeline**: MilestoneTimeline with phase bars, diamond markers, today line, overdue warnings with urgency coloring
- **Property wizard**: FormWizard with step indicator at top, validation per step, auto-save drafts, DraftIndicator banner
- **Photo gallery manager**: PhotoUploader for uploads, PhotoGallery for display with lightbox
- **Document manager**: DocumentManager component with upload, type selection, sharing toggles
- **Financial tables**: Summary cards at top (big numbers), detailed tables below
- **Animations**: Page transitions, card entrance animations, micro-interactions via Framer Motion
- **Loading**: Shimmer skeleton loaders matching final layout shape
- **Color coding**:
  - Status: Green = completed/available, Orange = in-progress/pending, Red = overdue/rejected/expired, Blue = reserved/upcoming
  - Urgency: Green border = on track, Yellow = approaching deadline, Red = overdue/critical
- **Empty states**: Action-oriented ("No buildings yet -- create your first building to start listing properties")
- **Mobile**: Sidebar collapses to hamburger, Kanban scrolls horizontally, forms stack vertically, cards full-width, 44px touch targets
- **Accessibility**: Skip-to-content, focus-visible rings, ARIA labels, prefers-reduced-motion support
