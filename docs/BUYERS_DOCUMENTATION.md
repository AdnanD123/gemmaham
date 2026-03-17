# Buyers (Users/Tenants) — Platform Documentation

## Role Overview

The **Buyer** is a person looking to purchase, rent, or reserve a flat or house. They browse properties, make reservations, select customization options for their unit, manage their favorites, and communicate with agencies. Their experience feels like a modern property marketplace with clear status tracking for reservations and requests, a polished glass design system, and smooth animations throughout.

---

## Current State — What's Done Well

### Reservation Flow
- Full lifecycle: `requested -> approved -> reserved -> completed` with rejection/cancellation/expiry paths
- Queue position tracking ("You are #X of Y")
- 14-day auto-expiry via Cloud Function
- Status timeline with dates and reasons on each card
- Meeting scheduling, deposit tracking, company notes — all visible to user
- Cancel option available while in `requested` or `approved` state
- **Additional info collected at reservation time**: preferred move-in date, financing method (cash/mortgage/other), number of occupants, urgency level (browsing/3 months/urgent), special requirements

### Customization Selection
- Interactive option picker on flat detail page with pill buttons
- Price calculator showing base price + deltas for non-default choices
- Deadline countdown (red warning at <=7 days)
- Lock mechanism prevents changes after company locks option
- "My Selections" sidebar showing status of each request (pending/approved/rejected)
- Resubmit rejected requests with new notes from `/user/requests`
- **Inline editing** with edit mode on option cards and AnimatePresence transitions

### Flat Detail Page
- Comprehensive: floor plan, 3D render, specs, price, description
- **Photo gallery section**: PhotoGallery component with lightbox + keyboard navigation (arrow keys, Escape)
- Customization section with full interactivity
- "Reserve Flat" and "Message Company" CTAs
- Before/after image comparison slider for 3D renders
- **Framer Motion page transitions and card animations**
- **Lazy loading on all images**

### House Detail Page
- **Upgraded to match flat detail quality**: same photo layout, specs grid, description, reservation button, message company
- Photo gallery with lightbox
- Full specs grid with all house-specific fields (lot size, stories, garage, yard, pool, house type)
- Smooth page transitions

### Property Search & Filtering
- **Enhanced filter bar** on `/properties`, `/flats` pages
- **Location search** (text input)
- **Size range** (min/max m2)
- **Price range** (min/max)
- **Bedroom filter** (min bedrooms)
- **Sort options**: Newest first, Price low-to-high, Price high-to-low, Size large-to-small
- Results count display
- Empty state with friendly message when no results match

### Photo Gallery
- **PhotoGallery component**: grid display of property photos with lightbox overlay
- **Keyboard navigation**: arrow keys to navigate, Escape to close
- **PhotoUploader component**: agencies upload multiple photos per property
- `photos: string[]` field on both Flat and House types

### Wishlist / Favorites
- **FavoriteButton component** (heart icon) on property cards
- **useFavorites hook** manages saved properties (localStorage-based)
- **`/user/favorites` page** showing all saved properties in a grid with remove button and link to property detail

### Notification System
- **Notification center page** (`/notifications`) for all authenticated roles
- **NotificationBell component** in navigation with unread count badge
- Notification types: reservation status changes, meeting scheduled, customization approved/rejected, new messages, reservation expiring
- Mark as read, click-to-navigate to relevant page

### Profile Management
- **`/user/profile` edit page**: display name, phone, address, profile photo upload
- Document upload section (ID, proof of income)
- Social security number field
- Profile completion tracking

### Messaging
- Real-time Firestore subscriptions
- Text + card messages (card = property link with image/title)
- Auto-scroll, send on Enter, Shift+Enter for newline
- Conversation creation from property detail pages
- **Unread message badges** in sidebar navigation (useUnreadMessages hook)
- **Sticky message input** on mobile

### Document Viewing
- Users can view documents shared by agency (floor plans, contracts, building permits)
- Documents linked to specific building via DocumentManager
- Read-only for users, upload by agency

### UI/UX Quality
- **Glass design system**: indigo primary (#5856d6), emerald secondary, coral accent
- **Framer Motion animations**: page transitions (PageTransition), card entrance animations, micro-interactions
- **Shimmer skeleton loaders** for all loading states
- **ContentLoader** for standardized loading transitions
- **Lazy loading** on all images throughout the app
- i18n across all pages (EN, BS, DE)
- Auth with email/password + Google OAuth
- Profile setup gate before accessing dashboard

### Mobile UX
- Sidebar hidden on mobile with hamburger menu toggle
- **44px touch targets** for all interactive elements
- **Responsive grids** that adapt to screen size
- **Sticky message input** on mobile
- Cards stack full-width on small screens

### Accessibility
- **Skip-to-content** link for keyboard users
- **Focus-visible rings** on all interactive elements
- **ARIA labels** on buttons, form fields, and navigation
- **role and aria-modal** on dialogs
- **Contrast fixes** meeting WCAG guidelines
- **prefers-reduced-motion** support

### Form Validation
- **Zod schemas** for all forms with field-level error messages
- **useFormValidation hook** provides real-time validation feedback
- **useFormDraft hook** auto-saves form state, DraftIndicator banner shows when draft is available
- Translation keys for all validation messages (i18n)

---

## Remaining Improvements

### P2 — Nice to Have

| Area | Issue | Target State |
|------|-------|-------------|
| **Dashboard Enhancements** | Dashboard has stat cards and property list | Add notification feed widget, upcoming meetings widget, recent messages preview, quick actions |
| **Reservation Calendar** | Reservations shown in tab list only | Add meeting calendar view option alongside existing tab view |
| **Customization Price Summary** | Individual option prices shown per selection | Add total price impact summary per flat across all selections on `/user/requests` |

---

## Page-by-Page Breakdown

### `/` — Home / Landing
- **Purpose**: First impression, drive property discovery
- **Current**: Featured properties (flats + houses) with glass-styled cards, search bar, CTAs, smooth animations
- **Status**: Complete

### `/properties` — Browse All Properties
- **Purpose**: Main property discovery page
- **Current**: Type toggle, enhanced filter bar (location, rooms, size, price), sort dropdown, result count, property cards with photos and favorite button, responsive grid
- **Status**: Complete

### `/flats` — Browse Flats
- **Purpose**: Flat-specific browsing
- **Current**: Enhanced filter bar matching `/properties` UX, FlatCard grid with favorites
- **Status**: Complete

### `/flats/:id` — Flat Detail
- **Purpose**: Full property info + reservation + customization
- **Current**: Floor plan, 3D render, photo gallery with lightbox, customization picker, reserve/message CTAs, lazy-loaded images, page transitions
- **Status**: Complete

### `/houses/:id` — House Detail
- **Purpose**: Full house info + reservation
- **Current**: Matches flat detail quality — photo gallery, specs grid, description, reservation modal, message company
- **Status**: Complete

### `/buildings` & `/buildings/:id` — Browse & Detail
- **Purpose**: Browse construction projects, see building details
- **Current**: Status filter buttons, building cards, detail with units/updates, milestone timeline, document viewing
- **Status**: Complete

### `/user/dashboard` — User Dashboard
- **Purpose**: Hub showing reservation status and activity
- **Current**: Stat cards + property list grouped by status (in-progress, planned, completed), glass-themed cards with animations
- **Status**: Complete (P2 enhancements optional)

### `/user/reservations` — Reservations
- **Purpose**: Track all reservation requests and statuses
- **Current**: 3 tabs (requests/active/history), expandable cards with timeline, additional booking info visible
- **Status**: Complete

### `/user/requests` — Customization Requests
- **Purpose**: Track customization selections and their approval status
- **Current**: Filter tabs, grouped by flat, resubmit capability, inline editing with animations
- **Status**: Complete

### `/user/messages` — Messages
- **Purpose**: Conversations with agencies
- **Current**: Conversation list + thread view, real-time, unread indicators in sidebar, sticky input on mobile
- **Status**: Complete

### `/user/profile` — Profile
- **Purpose**: Edit profile, manage account
- **Current**: Edit all profile fields (display name, phone, address), upload profile photo, upload documents, form validation
- **Status**: Complete

### `/notifications` — Notifications
- **Purpose**: View all notifications
- **Current**: Full notification list with read/unread state, click-to-navigate, mark all as read, notification types for all relevant events
- **Status**: Complete

### `/user/favorites` — Favorites
- **Purpose**: Saved/wishlisted properties
- **Current**: Grid of saved properties with remove button, link to property detail, FavoriteButton on all property cards
- **Status**: Complete

---

## Key User Flows

### Flow 1: Property Discovery -> Reservation
```
Landing Page -> Browse Properties -> Apply Filters (location, price, rooms, size, sort)
-> Click Property Card -> View Detail (photo gallery, specs, 3D render)
-> Click "Reserve" -> Fill Additional Info (move-in date, financing, occupants, urgency, requirements)
-> Confirm -> Reservation Created (status: requested)
-> Wait for agency approval -> Get notification
-> If approved: schedule meeting, select customizations, track deposit
-> If rejected: see reason, browse other properties
```

### Flow 2: Customization Selection
```
Reservation approved -> Visit flat detail page
-> See customization options (flooring, kitchen, bathroom, etc.)
-> Select preferred option per category -> See price impact
-> Submit request with optional notes
-> Track on /user/requests -> Get notification on approval/rejection
-> If rejected: resubmit with different choice or notes
```

### Flow 3: Messaging
```
View property -> Click "Message Company"
-> Property card auto-attached to first message
-> Type question -> Send
-> See response in real-time -> Continue thread
-> Unread count in sidebar badge
```

### Flow 4: Favorites
```
Browse properties -> Click heart icon on cards to save
-> View all saved properties at /user/favorites
-> Remove properties or click through to detail pages
```

---

## UI/UX Guidelines

- **Design system**: Glass morphism with indigo primary, emerald secondary, coral accent, backdrop-blur, layered shadows
- **Property cards**: Photo thumbnail, key specs as icon+text pairs (bed, bath, m2, price), status badge, favorite heart icon
- **Filters**: Horizontal bar above results (not sidebar), responsive on mobile
- **Detail pages**: Hero image section (floor plan + 3D + photo gallery with lightbox), then specs grid, then description, then customizations, then CTAs
- **Dashboard**: Clean stat cards at top, property activity grouped by status
- **Notifications**: Bell icon with red badge count in navigation, dedicated page for full list
- **Animations**: Page transitions, card entrance animations, micro-interactions via Framer Motion
- **Loading**: Shimmer skeleton loaders matching final layout shape
- **Color coding**: Green = available/approved, Orange = pending/in-progress, Red = rejected/expired, Blue = reserved/informational
- **Empty states**: Friendly illustrations with action prompts ("No reservations yet -- browse properties")
- **Mobile**: Sidebar collapses to hamburger, 44px touch targets, sticky message input, responsive grids
- **Accessibility**: Skip-to-content, focus-visible rings, ARIA labels, prefers-reduced-motion support
