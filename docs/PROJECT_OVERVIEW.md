# Gemmaham (Roomify) — Project Documentation

## Overview

Gemmaham is a real estate platform built as a monorepo with npm workspaces. It supports **3 user roles** — tenants (users), agencies (companies), and contractors — and provides property listing, reservation management, contractor assignments, AI-powered 3D visualization, and real-time messaging.

**Tech Stack**: React Router 7 (SSR) · Firebase (Auth, Firestore, Storage, Functions) · Tailwind CSS 4 · TypeScript · Vertex AI (Gemini)

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

---

## Roles & Access

| Role | Description | Key Capabilities |
|------|-------------|-----------------|
| **user** | Tenant / buyer | Browse properties, make reservations, select customizations, message companies |
| **company** | Real estate agency | List properties, manage reservations, assign contractors, view analytics |
| **contractor** | Service provider | Browse projects, apply to buildings, manage assignments, message companies |

Roles are stored as **Firebase Auth custom claims** and enforced via `<RoleGuard allowedRole="...">` and `<AuthGuard>` components.

---

## Routes (66 total)

### Public
| Route | Description |
|-------|-------------|
| `/` | Landing page with featured properties |
| `/auth/login` | Email/password + Google OAuth login |
| `/auth/register` | Registration with role selection |
| `/profile/setup` | Profile completion gate |
| `/flats` | Browse flats with filters |
| `/flats/:id` | Flat detail + 3D visualizer |
| `/houses/:id` | House detail page |
| `/buildings` | Browse buildings |
| `/buildings/:id` | Building detail |
| `/properties` | Unified property browsing (flats + houses) |
| `/contractors/:id` | Public contractor profile |
| `/visualizer/:id` | Standalone 3D floor plan renderer |

### Company Dashboard
| Route | Description |
|-------|-------------|
| `/company/dashboard` | Metrics overview |
| `/company/flats` | Manage flat listings |
| `/company/flats/new` | Create flat |
| `/company/flats/:id` | Edit flat + customization config |
| `/company/buildings` | Manage buildings |
| `/company/buildings/new` | Create building |
| `/company/buildings/:id` | Edit building + construction tracking |
| `/company/properties` | All properties (flats + houses) |
| `/company/properties/houses/new` | Create house |
| `/company/properties/houses/:id` | Edit house |
| `/company/reservations` | Queue management & approvals |
| `/company/requests` | Review customization requests |
| `/company/messages` | Conversations with users |
| `/company/analytics` | Revenue & occupancy charts |
| `/company/contractors` | Contractor directory |

### User Dashboard
| Route | Description |
|-------|-------------|
| `/user/dashboard` | User overview |
| `/user/reservations` | Reservation history & status |
| `/user/requests` | Customization requests |
| `/user/messages` | Conversations with companies |

### Contractor Dashboard
| Route | Description |
|-------|-------------|
| `/contractor/dashboard` | Projects overview |
| `/contractor/browse` | Browse available projects |
| `/contractor/projects` | Assigned projects |
| `/contractor/projects/:id` | Project detail |
| `/contractor/buildings` | Assigned buildings |
| `/contractor/buildings/:id` | Building detail |
| `/contractor/messages` | Conversations with companies |
| `/contractor/profile` | Edit profile |

---

## Data Model (Firestore)

### Top-Level Collections

| Collection | Key Fields |
|------------|------------|
| `users/{uid}` | email, displayName, role, companyId, profileCompleted, socialSecurityNumber |
| `companies/{id}` | name, email, phone, logo, description, address, ownerId |
| `flats/{id}` | companyId, buildingId, title, price, bedrooms, bathrooms, area, status, customizationConfig |
| `houses/{id}` | companyId, title, price, bedrooms, bathrooms, area, lotSize, stories, houseType, status |
| `buildings/{id}` | companyId, title, totalUnits, availableUnits, floors, status, currentPhase |
| `reservations/{id}` | propertyType, flatId/houseId, userId, companyId, status, queuePosition, expiresAt |
| `conversations/{id}` | userId, companyId, flatId/houseId, lastMessage, unreadCounts |
| `contractors/{id}` | email, displayName, companyName, categories, subcategoryKeys |
| `customizationRequests/{id}` | flatId, userId, reservationId, selectedOption, status |
| `applications/{id}` | Contractor applications to buildings |
| `rateLimits/{id}` | Rate limiting for AI renders |

### Subcollections

| Path | Purpose |
|------|---------|
| `users/{uid}/notifications/{id}` | User notifications |
| `flats/{id}/customizations/{id}` | Flat customization options |
| `buildings/{id}/updates/{id}` | Construction progress updates |
| `buildings/{id}/contractors/{id}` | Assigned contractors |
| `conversations/{id}/messages/{id}` | Chat messages |

### Key Enums

- **FlatStatus / HouseStatus**: `available` · `reserved` · `sold`
- **ReservationStatus**: `requested` → `approved` → `reserved` → `completed` (or `rejected` / `cancelled` / `expired`)
- **BuildingStatus**: `planning` → `under_construction` → `near_completion` → `completed`
- **ConstructionPhase**: `foundation` → `structure` → `facade` → `interior` → `finishing` → `handover`
- **ApplicationStatus**: `pending` · `accepted` · `rejected` · `withdrawn`

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
4. `<AuthGuard>` enforces authentication + profile completion
5. `<RoleGuard allowedRole="company">` enforces role-based access
6. Auth context available via `useOutletContext<AuthContext>()` from root layout

---

## Features

### Property Management
- Create/edit/list **flats**, **houses**, and **buildings**
- Floor plan upload with drag-and-drop
- Featured property highlighting
- Customization configuration per flat (flooring, kitchen, bathroom, etc.)

### AI 3D Visualization
- Upload a 2D floor plan image
- Vertex AI (Gemini) generates photorealistic 3D top-down render
- Before/after comparison slider
- Export and share rendered images
- Rate limited to 10 renders per user per day

### Reservation System
- Users request reservations on flats or houses
- Queue position management (auto-calculated)
- 14-day expiry with auto-expiration via scheduled function
- Workflow: `requested` → `approved` → `reserved` → `completed`
- Meeting scheduling within reservations
- Deposit tracking
- Full status history audit trail

### Customization Requests
- Companies configure customization options per flat
- Users select options during reservation
- Company reviews and approves selections
- Price impact tracking

### Contractor Management
- 14 main categories, 100+ subcategories (planning, structural, HVAC, electrical, etc.)
- Contractors register profiles with specialties
- Apply to building projects
- Company reviews and assigns contractors
- Contractor-specific project views

### Messaging
- Real-time conversations between users ↔ companies and contractors ↔ companies
- Unread message counts
- Message cards linking to properties
- Cloud Function updates conversation metadata

### Analytics (Company)
- Monthly revenue chart
- Occupancy breakdown (available / reserved / sold)
- Revenue by property type (flat vs house)
- Date range filtering (30d, 90d, 1y, all-time)

### Notifications
- Reservation status changes
- New reservation requests
- Meeting scheduled alerts
- Customization request updates
- Application acceptance/rejection

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

## Design System

**Theme**: Neobrutalism with bold shadows and clean typography

| Property | Light Mode | Dark Mode |
|----------|-----------|-----------|
| Background | `#fdfbf7` (warm beige) | `#0f172a` |
| Surface | `#ffffff` | `#1e293b` |
| Primary | `#f97316` (orange) | `#fb923c` |
| Secondary | `#3b82f6` (blue) | `#60a5fa` |
| Accent | `#8b5cf6` (purple) | `#a78bfa` |
| Font (headings) | Instrument Serif | Instrument Serif |
| Font (body) | Inter | Inter |

- Dark mode toggle saved in `localStorage` (`gemmaham-theme`)
- Neobrutalist box shadow: `4px 4px 0px 0px rgba(0,0,0,1)`
- Responsive mobile-first design

---

## Components (43+ custom + 11 UI primitives)

### UI Primitives (`lib/ui/`)
Button, Input, Textarea, Select, Modal, ConfirmDialog, Badge, Toast, LanguageSwitcher, ThemeToggle, Skeleton

### Key Components
- **Guards**: AuthGuard, RoleGuard, ProfileGate
- **Layout**: Navbar, Sidebar, CompanySidebar, ContractorSidebar, MobileMenu
- **Cards**: FlatCard, HouseCard, BuildingCard, PropertyCard, ProjectCard
- **Reservations**: ReservationCard, ReservationTimeline, ApplicationCard, ApplicationList
- **Customization**: CustomizationManager, CustomizationOption, FlatScopeManager, ContractorScopeEditor
- **Messaging**: MessageThread, MessageInput, ConversationList, NotificationBell
- **Analytics**: RevenueChart, OccupancyChart, RevenueByPropertyChart, ProjectProgressChart, ConstructionTimeline
- **Forms**: HouseForm, CategorySubcategoryPicker, ContractorSearch

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
| Routes | 66 |
| Components | 54+ |
| Cloud Functions | 7 |
| Firestore Collections | 12 top-level + 5 subcollections |
| Languages | 3 (EN, BS, DE) |
| Contractor Categories | 14 main + 100+ subcategories |
| Translation Keys | ~1,500+ per language |
| User Stories | 20+ test spec files |
