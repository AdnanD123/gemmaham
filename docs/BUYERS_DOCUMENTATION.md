# Buyers (Users/Tenants) — Platform Documentation

## Role Overview

The **Buyer** is a person looking to purchase, rent, or reserve a flat or house. They browse properties, make reservations, select customization options for their unit, and communicate with agencies. Their experience should feel like a modern property marketplace (Willhaben-inspired) with clear status tracking for their reservations and requests.

---

## Current State — What's Done Well

### Reservation Flow
- Full lifecycle: `requested → approved → reserved → completed` with rejection/cancellation/expiry paths
- Queue position tracking ("You are #X of Y")
- 14-day auto-expiry via Cloud Function
- Status timeline with dates and reasons on each card
- Meeting scheduling, deposit tracking, company notes — all visible to user
- Cancel option available while in `requested` or `approved` state

### Customization Selection
- Interactive option picker on flat detail page with pill buttons
- Price calculator showing base price + deltas for non-default choices
- Deadline countdown (red warning at ≤7 days)
- Lock mechanism prevents changes after company locks option
- "My Selections" sidebar showing status of each request (pending/approved/rejected)
- Resubmit rejected requests with new notes from `/user/requests`

### Flat Detail Page
- Comprehensive (~850 lines): floor plan, 3D render, specs, price, description
- Customization section with full interactivity
- "Reserve Flat" and "Message Company" CTAs
- Before/after image comparison slider for 3D renders

### Messaging
- Real-time Firestore subscriptions
- Text + card messages (card = property link with image/title)
- Auto-scroll, send on Enter, Shift+Enter for newline
- Conversation creation from property detail pages

### General
- i18n across all pages (EN, BS, DE)
- Auth with email/password + Google OAuth
- Profile setup gate before accessing dashboard
- Skeleton loaders for async states

---

## Needs Improvement

### P0 — Critical

| Area | Issue | Target State |
|------|-------|-------------|
| **House Detail Page** | Much simpler than flat detail — no customization section, no 3D, minimal layout | Should match flat detail page: same photo layout, specs, customization support, 3D render, reservation button |
| **Notification UI** | Hook exists (`useNotifications`) but NO visual integration | Notification bell in navbar with unread count badge + dropdown/center page listing all notifications |
| **Profile Editing** | No way to edit profile after initial setup — no password change, no photo update, no account deletion | Add `/user/profile` edit page with all fields editable |

### P1 — Important

| Area | Issue | Target State |
|------|-------|-------------|
| **Property Search** | Only basic filters (price, bedrooms). No sort, no location, no visual feedback | Willhaben-style filter bar: location, rooms, size (m²), price range + sort (newest, price asc/desc) |
| **Property Cards** | Functional but plain — single image, basic info | More visual cards: larger thumbnail, key specs as icons, status badge, hover effect, favorite button |
| **Additional Info on Reservation** | All user info collected at signup, nothing at reservation time | Collect additional info when user submits reservation (e.g., preferred move-in date, financing status, special requirements). Examples: employment status, budget confirmation, family size, urgency level |
| **Photo Gallery** | Properties only show floor plan + 3D render | Top section: floor plan + 3D render (side by side or comparison slider). Below: gallery section with up to 5 property photos (interior, exterior, neighborhood) |

### P2 — Nice to Have

| Area | Issue | Target State |
|------|-------|-------------|
| **Wishlist/Favorites** | No way to save properties for later | Heart icon on property cards, `/user/favorites` page |
| **Mobile UX** | Tailwind responsive classes exist but mobile experience not optimized | Test and polish mobile layouts — especially property detail, customization picker, messaging |
| **Accessibility** | Limited ARIA labels, minimal keyboard navigation | Add ARIA labels to interactive elements, ensure tab navigation works |

---

## Needs to Be Added

### Notification System (P0)
- **Notification Bell** in navbar for all authenticated users
  - Unread count badge (red circle with number)
  - Dropdown showing latest 5 notifications with "View All" link
- **Notification Center** page (`/user/notifications`)
  - List of all notifications with read/unread state
  - Click navigates to relevant page (reservation, message, request)
  - "Mark all as read" button
- **Notification Types**: reservation status change, meeting scheduled, customization approved/rejected, new message received, reservation expiring soon

### Property Photo Gallery (P1)
- **Upload**: Agencies upload up to 5 photos per property (separate from floor plan and 3D)
- **Display Layout**:
  - Hero section: Floor plan + 3D render (existing comparison slider)
  - Gallery section below: Grid/carousel of property photos
  - Lightbox on click for full-screen viewing
- **Data Model Change**: Add `photos: string[]` field to Flat and House types

### Enhanced Search & Filtering (P1)
- **Filter Bar** on `/properties`, `/flats`, `/buildings` pages:
  - Location (text input or dropdown by city/area)
  - Rooms (min bedrooms selector)
  - Size range (min/max m²)
  - Price range (min/max with currency)
  - Property type toggle (flat/house/building)
- **Sort Options**: Newest first, Price low→high, Price high→low, Size large→small
- **Results Count**: "Showing X of Y properties"
- **Empty State**: Friendly message when no results match filters

### Profile Edit Page (P0)
- **Route**: `/user/profile`
- **Editable Fields**: Display name, phone, address, profile photo
- **Additional Info Section** (collected over time):
  - Documents (ID, proof of income — upload capability)
  - Social security number
  - Employment status
  - These fields unlock progressively (marked as "needed for reservation" etc.)
- **Account Actions**: Change password, sign out from all devices

### Reservation Enhancement (P1)
- **Additional Info Form** shown when creating reservation:
  - Preferred move-in date
  - Financing method (cash, mortgage, other)
  - Special requirements (text field)
  - Family size / occupants
  - Urgency level (just browsing, planning within 3 months, urgent)
- This info is stored on the Reservation and visible to the agency

### Document Sharing (P2)
- Users can view documents shared by agency (floor plans, contracts, building permits)
- Documents linked to specific property or reservation
- Read-only for users, upload by agency

---

## Page-by-Page Breakdown

### `/` — Home / Landing
- **Purpose**: First impression, drive property discovery
- **Current**: Featured flats carousel + CTAs
- **Target**: Featured properties (flats + houses), search bar hero section, category quick-links (buy, rent, new builds), recent listings
- **Priority**: P1

### `/properties` — Browse All Properties
- **Purpose**: Main property discovery page (Willhaben-style)
- **Current**: Type toggle + basic filters, card grid
- **Target**: Full filter bar (location, rooms, size, price, type), sort dropdown, result count, improved cards with photos and favorite button, responsive grid
- **Priority**: P1

### `/flats` — Browse Flats
- **Purpose**: Flat-specific browsing
- **Current**: Price + bedroom filters, FlatCard grid
- **Target**: Same enhanced filter bar, unified with `/properties` UX pattern
- **Priority**: P1

### `/flats/:id` — Flat Detail
- **Purpose**: Full property info + reservation + customization
- **Current**: Excellent — floor plan, 3D, customization picker, reserve/message CTAs
- **Target**: Add photo gallery section, improve mobile layout, ensure house detail matches this quality
- **Priority**: P1 (photo gallery)

### `/houses/:id` — House Detail
- **Purpose**: Full house info + reservation
- **Current**: Minimal compared to flat detail
- **Target**: Match flat detail: photo gallery (hero + 5 photos), specs grid, description, reservation modal, message company, customization section (if applicable)
- **Priority**: P0

### `/buildings` & `/buildings/:id` — Browse & Detail
- **Purpose**: Browse construction projects, see building details
- **Current**: Status filter buttons, building cards, detail with units/updates
- **Target**: Add photo gallery, improve construction progress visualization, show available flats within building
- **Priority**: P1

### `/user/dashboard` — User Dashboard
- **Purpose**: Hub showing reservation status and activity
- **Current**: Stat cards + property list grouped by status (in-progress, planned, completed)
- **Target**: Add notification feed, upcoming meetings widget, recent messages preview, quick actions (browse properties, check reservations)
- **Priority**: P1

### `/user/reservations` — Reservations
- **Purpose**: Track all reservation requests and statuses
- **Current**: 3 tabs (requests/active/history), expandable cards with timeline
- **Target**: Keep current UX (it's good), add meeting calendar view option, improve mobile card layout
- **Priority**: P2

### `/user/requests` — Customization Requests
- **Purpose**: Track customization selections and their approval status
- **Current**: Filter tabs, grouped by flat, resubmit capability
- **Target**: Keep current UX, add price summary per flat (total impact of selections)
- **Priority**: P2

### `/user/messages` — Messages
- **Purpose**: Conversations with agencies
- **Current**: Conversation list + thread view, real-time
- **Target**: Add unread indicator in sidebar nav, improve mobile thread layout
- **Priority**: P2

### `/user/profile` — Profile (NEW)
- **Purpose**: Edit profile, manage account
- **Current**: Does not exist (only `/profile/setup` for initial setup)
- **Target**: Edit all profile fields, upload documents, change password, account settings
- **Priority**: P0

### `/user/notifications` — Notifications (NEW)
- **Purpose**: View all notifications
- **Current**: Does not exist
- **Target**: Full notification list with read/unread, click-to-navigate, mark all read
- **Priority**: P0

### `/user/favorites` — Favorites (NEW)
- **Purpose**: Saved/wishlisted properties
- **Current**: Does not exist
- **Target**: Grid of saved properties with remove button, link to property detail
- **Priority**: P2

---

## Key User Flows

### Flow 1: Property Discovery → Reservation
```
Landing Page → Browse Properties → Apply Filters (location, price, rooms)
→ Click Property Card → View Detail (photos, specs, 3D render)
→ Click "Reserve" → Fill Additional Info (move-in date, financing, requirements)
→ Confirm → Reservation Created (status: requested)
→ Wait for agency approval → Get notification
→ If approved: schedule meeting, select customizations, track deposit
→ If rejected: see reason, browse other properties
```

### Flow 2: Customization Selection
```
Reservation approved → Visit flat detail page
→ See customization options (flooring, kitchen, bathroom, etc.)
→ Select preferred option per category → See price impact
→ Submit request with optional notes
→ Track on /user/requests → Get notification on approval/rejection
→ If rejected: resubmit with different choice or notes
```

### Flow 3: Messaging
```
View property → Click "Message Company"
→ Property card auto-attached to first message
→ Type question → Send
→ See response in real-time → Continue thread
→ Unread count in navbar and sidebar
```

---

## UI/UX Guidelines

- **Property cards**: Willhaben-inspired — large thumbnail, key specs as icon+text pairs (bed, bath, m², price), status badge, favorite heart icon
- **Filters**: Horizontal bar above results (not sidebar), collapsible on mobile
- **Detail pages**: Hero image section (floor plan + 3D + gallery), then specs grid, then description, then customizations, then CTAs (reserve, message)
- **Dashboard**: Clean stat cards at top, then activity feed / upcoming items, quick action buttons
- **Notifications**: Bell icon with red badge count, dropdown for quick view, dedicated page for full list
- **Color coding**: Green = available/approved, Orange = pending/in-progress, Red = rejected/expired, Blue = reserved/informational
- **Empty states**: Friendly illustrations with action prompts ("No reservations yet — browse properties")
- **Loading**: Skeleton cards matching final layout shape
