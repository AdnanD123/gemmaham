# Gemmaham (Roomify) — Project Documentation

## Overview

Gemmaham is a real estate platform built as a monorepo with npm workspaces. It supports **3 user roles** — tenants (users), agencies (companies), and contractors — and provides property listing, reservation management, contractor assignments, AI-powered 3D visualization, real-time messaging, document management, and financial tracking.

**Tech Stack**: React Router 7 (SSR) · Firebase (Auth, Firestore, Storage, Functions) · Tailwind CSS 4 · TypeScript · Vertex AI (Gemini) · Framer Motion · Zod

**Firebase Project**: `roomify-dev-349ab`

---

## Architecture

```
roomify/
├── packages/
│   ├── shared/        # TypeScript types & constants (@gemmaham/shared)
│   ├── web/           # React Router 7 frontend (SSR, Vite, Tailwind CSS 4)
│   └── functions/     # Firebase Cloud Functions (Node.js 20)
├── docs/
│   └── user-stories/  # Test/requirement specs (JSON)
├── firebase.json      # Firebase config & emulator ports
├── firestore.rules    # Firestore security rules
├── storage.rules      # Cloud Storage security rules
└── CLAUDE.md          # AI agent instructions
```

### Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| React | 19.2.4 | UI framework |
| React Router | 7.x | SSR routing |
| Firebase | 11.6.0 | Client SDK (Auth, Firestore, Storage) |
| firebase-admin | 13.0.0 | Server-side Firebase |
| firebase-functions | 6.3.0 | Cloud Functions runtime |
| @google-cloud/vertexai | 1.9.0 | AI 3D rendering |
| react-i18next | 16.5.4 | Internationalization |
| recharts | 3.7.0 | Analytics charts |
| lucide-react | 0.563.0 | Icon library |
| Tailwind CSS | 4.x | Utility-first styling |
| motion (Framer Motion) | 12.38.0 | Animations, page transitions, micro-interactions |
| zod | 4.3.6 | Schema-based form validation |
| clsx | 2.1.1 | Conditional class name utility |
| tailwind-merge | 3.5.0 | Tailwind class conflict resolution |
| date-fns | 4.1.0 | Date formatting, relative time, date math |
| react-compare-slider | 3.1.0 | Before/after image comparison slider |

---

## Roles & Access

| Role | Description | Key Capabilities |
|------|-------------|-----------------|
| **user** | Tenant / buyer | Browse properties, make reservations, select customizations, manage favorites, message companies |
| **company** | Real estate agency | List properties, manage reservations (list + Kanban), assign contractors, manage documents & milestones, view analytics & finances |
| **contractor** | Service provider | Browse projects, apply to buildings, manage assignments, self-report progress, upload documents & portfolio, manage finances, message companies |

Roles are stored as **Firebase Auth custom claims** and enforced via `<RoleGuard allowedRole="...">` and `<AuthGuard>` components.

---

## Routes (74 total)

### Public (12)
| Route | Description |
|-------|-------------|
| `/` | Landing page with featured properties |
| `/new-design` | Design showcase page |
| `/auth/login` | Email/password + Google OAuth login |
| `/auth/register` | Registration with role selection |
| `/auth/verify-email` | Email verification gate |
| `/profile/setup` | Profile completion gate |
| `/notifications` | Notification center (all authenticated roles) |
| `/flats` | Browse flats with enhanced filters |
| `/flats/:id` | Flat detail + photo gallery + 3D visualizer |
| `/houses/:id` | House detail page (matches flat detail quality) |
| `/buildings` | Browse buildings |
| `/buildings/:id` | Building detail |
| `/properties` | Unified property browsing (flats + houses) with location, size, sort |
| `/contractors/:id` | Public contractor profile with hero, categories, portfolio, stats |
| `/visualizer/:id` | Standalone 3D floor plan renderer |

### Company Dashboard (16)
| Route | Description |
|-------|-------------|
| `/company/dashboard` | Metrics overview with "Needs Attention" section |
| `/company/flats` | Manage flat listings |
| `/company/flats/new` | Create flat (4-step wizard) |
| `/company/flats/:id` | Edit flat + customization config |
| `/company/buildings` | Manage buildings |
| `/company/buildings/new` | Create building |
| `/company/buildings/:id` | Edit building + milestones + documents + construction tracking |
| `/company/properties` | All properties (flats + houses) |
| `/company/properties/houses/new` | Create house (4-step wizard) |
| `/company/properties/houses/:id` | Edit house |
| `/company/reservations` | Reservation management with Kanban board toggle |
| `/company/requests` | Review customization requests |
| `/company/messages` | Conversations with users and contractors |
| `/company/messages/:conversationId` | Direct conversation thread |
| `/company/contractors` | Contractor directory with availability filter |
| `/company/finances` | Financial tracking — revenue, costs, per-building P&L |

### User Dashboard (8)
| Route | Description |
|-------|-------------|
| `/user/dashboard` | User overview |
| `/user/reservations` | Reservation history & status |
| `/user/requests` | Customization requests |
| `/user/messages` | Conversations with companies |
| `/user/messages/:conversationId` | Direct conversation thread |
| `/user/profile` | Profile editing — display name, phone, address, photo, documents |
| `/user/favorites` | Saved/wishlisted properties |

### Contractor Dashboard (13)
| Route | Description |
|-------|-------------|
| `/contractor/dashboard` | Projects overview |
| `/contractor/browse` | Browse available projects |
| `/contractor/applications` | Track all submitted applications with status tabs |
| `/contractor/projects` | Assigned projects |
| `/contractor/projects/:id` | Project detail with progress self-reporting |
| `/contractor/buildings` | Assigned buildings |
| `/contractor/buildings/:id` | Building detail |
| `/contractor/messages` | Conversations with companies |
| `/contractor/messages/:conversationId` | Direct conversation thread |
| `/contractor/finances` | Earnings dashboard — per-project amounts, payment status tracking |
| `/contractor/profile` | Edit profile + documents + portfolio + availability |

---

## Data Model (Firestore)

### Top-Level Collections

| Collection | Key Fields |
|------------|------------|
| `users/{uid}` | email, displayName, role, companyId, profileCompleted, socialSecurityNumber, documents[], phone, address, photoURL |
| `companies/{id}` | name, email, phone, logo, description, address, ownerId |
| `flats/{id}` | companyId, buildingId, title, price, bedrooms, bathrooms, area, status, photos[], customizationConfig, floorPlanUrl, renderedImageUrl |
| `houses/{id}` | companyId, title, price, bedrooms, bathrooms, area, lotSize, stories, houseType, status, photos[], coverImageUrl, floorPlanUrl, renderedImageUrl |
| `buildings/{id}` | companyId, title, totalUnits, availableUnits, floors, status, currentPhase, startDate, estimatedCompletion |
| `reservations/{id}` | propertyType, flatId/houseId, userId, companyId, status, queuePosition, expiresAt, preferredMoveIn, financingMethod, occupants, urgency, specialRequirements |
| `conversations/{id}` | userId, companyId, flatId/houseId/buildingId, lastMessage, unreadCounts, propertyType |
| `contractors/{id}` (profiles) | email, displayName, companyName, categories, subcategoryKeys, availability, availableFrom, documents[], portfolio[] |
| `customizationRequests/{id}` | flatId, userId, reservationId, selectedOption, status |
| `applications/{id}` | buildingId, contractorUserId, status, message, proposedRate, companyNotes |
| `rateLimits/{id}` | Rate limiting for AI renders |

### Subcollections

| Path | Purpose |
|------|---------|
| `users/{uid}/notifications/{id}` | User notifications |
| `flats/{id}/customizations/{id}` | Flat customization options |
| `buildings/{id}/updates/{id}` | Construction progress updates |
| `buildings/{id}/contractors/{id}` | Assigned contractors (with scopeConfig, progressPercent) |
| `buildings/{id}/documents/{id}` | Shared building documents (plans, permits, contracts) |
| `conversations/{id}/messages/{id}` | Chat messages |

### Key Enums & Types

- **FlatStatus / HouseStatus**: `available` | `reserved` | `sold`
- **ReservationStatus**: `requested` -> `approved` -> `reserved` -> `completed` (or `rejected` / `cancelled` / `expired`)
- **BuildingStatus**: `planning` -> `under_construction` -> `near_completion` -> `completed`
- **ConstructionPhase**: `foundation` -> `structure` -> `facade` -> `interior` -> `finishing` -> `handover`
- **ApplicationStatus**: `pending` | `accepted` | `rejected` | `withdrawn`
- **ContractorAvailability**: `available` | `busy` | `unavailable`
- **ContractorDocumentType**: `certificate` | `insurance` | `license` | `other`
- **BuildingDocumentType**: `plan` | `permit` | `contract` | `specification` | `other`
- **FinancingMethod**: `cash` | `mortgage` | `other`
- **UrgencyLevel**: `browsing` | `3months` | `urgent`
- **SortBy**: `newest` | `price_asc` | `price_desc` | `size_desc`
- **BuildingMilestone**: id, buildingId, title, date, phase, description, completed
- **ContractorPortfolioItem**: url, caption, projectName
- **ContractorDocument**: name, url, type, uploadedAt
- **BuildingDocument**: id, buildingId, name, type, url, uploadedBy, sharedWithContractors, sharedWithBuyers

---

## Cloud Functions (7)

| Function | Trigger | Purpose |
|----------|---------|---------|
| `generate3DView` | HTTP Callable | Converts 2D floor plans to photorealistic 3D renders via Vertex AI (Gemini). Rate limited: 10/user/day |
| `setUserClaims` | HTTP Callable | Sets Auth custom claims (role, companyId) after registration |
| `onReservationCreate` | Firestore onCreate | Calculates queue position, sets 14-day expiry, notifies company |
| `onReservationUpdate` | Firestore onUpdate | Sends notifications on status changes, meeting scheduling |
| `onMessageCreate` | Firestore onCreate | Updates conversation metadata (lastMessage, unread counts) |
| `expireReservations` | Scheduled | Expires reservations past their expiresAt date |
| `onUserCreate` | Auth beforeUserCreated | Blocked — requires Identity Platform (handled client-side instead) |

---

## Authentication Flow

1. User registers via email/password or Google OAuth (`/auth/register`)
2. Role selected during registration (user / company / contractor)
3. `setUserClaims` Cloud Function sets custom claims on Auth token
4. Email verification gate (`/auth/verify-email`)
5. `<AuthGuard>` enforces authentication + profile completion
6. `<RoleGuard allowedRole="company">` enforces role-based access
7. Auth context available via `useOutletContext<AuthContext>()` from root layout

---

## Features

### Property Management
- Create/edit/list **flats**, **houses**, and **buildings**
- **4-step creation wizard** (FormWizard component): basic info -> specs -> photos -> review
- Floor plan upload with drag-and-drop
- **Photo gallery**: up to multiple property photos per listing (PhotoUploader + PhotoGallery with lightbox + keyboard navigation)
- Featured property highlighting
- Customization configuration per flat (flooring, kitchen, bathroom, etc.)
- **Form drafts auto-save**: useFormDraft hook with DraftIndicator banner, integrated into creation wizards

### AI 3D Visualization
- Upload a 2D floor plan image
- Vertex AI (Gemini) generates photorealistic 3D top-down render
- Before/after comparison slider
- Export and share rendered images
- Rate limited to 10 renders per user per day

### Reservation System
- Users request reservations on flats or houses
- **Additional info collected at reservation time**: preferred move-in date, financing method, number of occupants, urgency level, special requirements
- Queue position management (auto-calculated)
- 14-day expiry with auto-expiration via scheduled function
- Workflow: `requested` -> `approved` -> `reserved` -> `completed`
- **Kanban board view** (KanbanBoard component) with list/board toggle on company reservations page
- Meeting scheduling within reservations
- Deposit tracking
- Full status history audit trail

### Customization Requests
- Companies configure customization options per flat
- Users select options during reservation
- Company reviews and approves selections
- Price impact tracking
- **Inline editing** with edit mode on option cards and AnimatePresence transitions

### Contractor Management
- 14 main categories, 100+ subcategories (planning, structural, HVAC, electrical, etc.)
- Contractors register profiles with specialties
- Apply to building projects
- Company reviews and assigns contractors
- Contractor-specific project views
- **Progress self-reporting**: ProgressReporter component for contractors to update their own progress %, add notes, upload photos
- **Documents & portfolio**: contractors upload certificates, insurance, licenses; portfolio photos with captions (ContractorDocument, ContractorPortfolioItem types)
- **Availability management**: AvailabilityBadge component, profile availability selector, "show available only" filter in contractor directory
- **Public contractor profile**: full redesign with hero section, categories, project history, stats

### Construction Milestones
- **BuildingMilestone type** with id, title, date, phase, description, completed status
- **MilestoneTimeline component**: visual timeline with phase bars, diamond markers, today line, overdue warnings
- Milestone management integrated into building detail page

### Document Management
- **DocumentManager component** for per-building document management
- Upload building plans, permits, contracts, specifications
- Documents can be shared with contractors and/or buyers (sharedWithContractors, sharedWithBuyers flags)
- Storage functions for building document upload and deletion

### Photo Gallery System
- **PhotoUploader component**: upload multiple property photos with progress
- **PhotoGallery component**: lightbox viewer with keyboard navigation (arrow keys, Escape)
- `photos: string[]` field on both Flat and House types
- Storage function `uploadPropertyPhoto` for generic property photo uploads

### Search & Filtering
- **Enhanced search** on property browse pages: location text search, size range (min/max m2), price range, bedroom filter
- **Sort options**: newest first, price low-to-high, price high-to-low, size large-to-small
- **PropertyFilters and FlatFilters** components with responsive filter bars
- SortBy type: `newest` | `price_asc` | `price_desc` | `size_desc`
- Unified PropertyFilters and per-type FlatFilters/HouseFilters interfaces

### Favorites / Wishlist
- **useFavorites hook** for managing saved properties (localStorage-based)
- **FavoriteButton component** (heart icon) on property cards
- **`/user/favorites` page** showing all saved properties with remove option

### Messaging
- Real-time conversations between users <-> companies and contractors <-> companies
- **Unread message tracking**: useUnreadMessages hook, unread badges in sidebar navigation
- **Buyer/contractor tabs** in company messages view with context bars
- Message cards linking to properties
- Cloud Function updates conversation metadata
- **Sticky message input** on mobile

### Financial Tracking
- **`/company/finances`** page: revenue summary, contractor costs per building, per-building P&L
- **`/contractor/finances`** page: earnings dashboard, per-project amounts, payment status tracking
- Summary cards with key financial metrics

### Analytics (Company)
- Monthly revenue chart
- Occupancy breakdown (available / reserved / sold)
- Revenue by property type (flat vs house)
- Date range filtering (30d, 90d, 1y, all-time)

### Notifications
- **Notification center page** (`/notifications`) for all authenticated roles
- **NotificationBell component** with unread count badge
- Notification types: reservation status changes, new requests, meeting scheduled, customization updates, application acceptance/rejection, contractor assigned
- Mark as read, click-to-navigate to relevant page

### Company Dashboard
- **"Needs Attention" section** (PrioritySection component): pending reservation requests, pending contractor applications, pending customization requests, overdue milestones, expiring reservations
- Quick stats row with clickable stat cards
- Revenue and occupancy charts

---

## Design System

**Theme**: Glass morphism with layered depth and smooth animations

| Property | Light Mode | Dark Mode |
|----------|-----------|-----------|
| Background | Gradient layers | Dark gradient layers |
| Surface | Glass effect with `backdrop-blur` | Dark glass with `backdrop-blur` |
| Primary | `#5856d6` (indigo) | Indigo variant |
| Secondary | Emerald | Emerald variant |
| Accent | Coral | Coral variant |
| Font (headings) | Instrument Serif | Instrument Serif |
| Font (body) | Inter | Inter |

- **Glass design system**: indigo primary (#5856d6), emerald secondary, coral accent
- **Layered shadows** with multiple levels of depth
- **Backdrop-blur effects** on cards and surfaces
- **Framer Motion animations**: page transitions (PageTransition), card entrance animations (AnimatedCard), micro-interactions
- **Shimmer skeleton loaders** (upgraded from basic pulse)
- **ContentLoader** for standardized loading transitions
- Dark mode toggle saved in `localStorage` (`gemmaham-theme`)
- Responsive mobile-first design with sidebar-only navigation

### Navigation
- **Unified sidebar-only navigation** (removed top navbar links, slim utility bar in root layout)
- Sidebar hidden on mobile with hamburger toggle (MobileMenu component)
- HomeSidebar for public pages
- Role-specific sidebars (CompanySidebar via routes, ContractorSidebar via routes)

---

## Components (68 files)

### UI Primitives (`components/ui/`)
Button, Input, Textarea, Select, Modal, ConfirmDialog, Badge, Toast, LanguageSwitcher, ThemeToggle, Skeleton, AnimatedCard, ContentLoader, DraftIndicator, FormWizard, PageTransition

### Key Components
- **Guards**: AuthGuard, RoleGuard, ProfileGate
- **Layout**: Navbar, HomeSidebar, MobileMenu
- **Cards**: FlatCard, HouseCard, BuildingCard, PropertyCard, ProjectCard, StatCard, ContractorProfileCard
- **Property**: PhotoGallery, PhotoUploader, PropertyFilters, FlatFilters, FavoriteButton
- **Reservations**: ReservationCard, ReservationTimeline, KanbanBoard, ApplicationCard, ApplicationList, ApplicationModal
- **Customization**: CustomizationManager, ContractorScopeEditor, FlatScopeManager
- **Construction**: ConstructionTimeline, MilestoneTimeline, ProgressReporter, DocumentManager
- **Contractor**: AvailabilityBadge, ContractorList, ContractorSearch, CategorySubcategoryPicker
- **Messaging**: MessageThread, MessageInput, ConversationList, NotificationBell
- **Analytics**: RevenueChart, OccupancyChart, RevenueByPropertyChart, ProjectProgressChart, ChartContainer
- **Dashboard**: DashboardPropertyList, PrioritySection
- **Forms**: HouseForm, Upload, FormWizard, DraftIndicator
- **Skeletons**: ChartSkeleton, DashboardSkeleton, FlatCardSkeleton, MessageSkeleton, ReservationSkeleton

### Hooks (9)
- **useAuth** — Firebase authentication state management
- **useContractor** — Contractor profile data fetching
- **useFavorites** — Property wishlist/favorites (localStorage)
- **useFormDraft** — Auto-save form drafts with DraftIndicator integration
- **useFormValidation** — Zod schema-based field-level form validation
- **useMessages** — Real-time message subscriptions
- **useNotifications** — Notification fetching and management
- **useTheme** — Dark/light mode toggle
- **useUnreadMessages** — Unread message count for sidebar badges

---

## Accessibility (Phase 4)

- **Skip-to-content** link for keyboard users
- **Focus-visible rings** on all interactive elements
- **ARIA labels** on buttons, form fields, and navigation
- **role and aria-modal** attributes on dialogs and modals
- **Contrast fixes** meeting WCAG guidelines
- **prefers-reduced-motion** support — respects user system preference to disable animations
- **44px minimum touch targets** on mobile

---

## Mobile UX (Phase 4)

- Sidebar hidden on mobile with hamburger menu toggle
- **44px touch targets** for all interactive elements
- **Responsive grids** that adapt to screen size
- **Sticky message input** that stays visible while scrolling conversations
- Cards stack full-width on small screens
- Form wizards stack vertically on mobile

---

## Form Validation

- **Zod schemas** in `packages/web/lib/validation.ts` for: login, register, profile setup, contractor profile setup, flat creation, house creation
- **useFormValidation hook** provides field-level error display with i18n translation keys
- **useFormDraft hook** auto-saves form state to localStorage with DraftIndicator banner
- FormWizard component supports multi-step forms with validation per step

---

## Internationalization (i18n)

| Language | Code | Status |
|----------|------|--------|
| English | `en` | Default / fallback |
| Bosnian | `bs` | Complete |
| German | `de` | Complete |

- Framework: `react-i18next`
- ~1,500+ translation keys per language
- Language preference saved in `localStorage` (`gemmaham-lang`)
- Server-side defaults to English to prevent hydration mismatch

---

## Commands

```bash
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Build web app (runs TypeScript checks)
npm run dev:functions    # Watch-build Cloud Functions
npm run build:functions  # Build Cloud Functions
npm run user-stories:verify  # Validate user story JSON format
```

### Firebase Emulators

| Service | Port |
|---------|------|
| Auth | 9099 |
| Firestore | 8080 |
| Storage | 9199 |
| Functions | 5001 |
| Emulator UI | 4000 |

---

## Environment Variables

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_FUNCTIONS_REGION  # default: us-central1
```

---

## Statistics

| Metric | Count |
|--------|-------|
| Routes | 74 |
| Components | 68 files |
| Hooks | 9 custom hooks |
| Cloud Functions | 7 |
| Firestore Collections | 12 top-level + 6 subcollections |
| Languages | 3 (EN, BS, DE) |
| Contractor Categories | 14 main + 100+ subcategories |
| Translation Keys | ~1,500+ per language |
| User Stories | 20+ test spec files |
| Zod Validation Schemas | 6 (login, register, profile, contractor profile, flat, house) |
| Storage Upload Functions | 14 |
