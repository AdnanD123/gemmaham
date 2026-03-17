# Skills & Technologies — Enhancement Roadmap

## Current Stack Assessment

| Layer | Current | Quality | Status |
|-------|---------|---------|--------|
| **UI Components** | Custom components (Button, Modal, Toast, AnimatedCard, FormWizard, ContentLoader, etc.) | High | 68 component files, 16 UI primitives |
| **Animations** | Motion (Framer Motion) — page transitions, card animations, micro-interactions, AnimatePresence | High | INSTALLED (motion 12.38.0) |
| **Forms** | Zod schemas + useFormValidation hook + useFormDraft hook | High | INSTALLED (zod 4.3.6) — 6 validation schemas, field-level errors, auto-save drafts |
| **Charts** | Recharts (bar, pie, area) with ChartContainer wrapper | Medium-High | 4 chart components + container |
| **Images** | Lazy loading on all images, PhotoGallery with lightbox + keyboard nav | High | PhotoUploader + PhotoGallery components |
| **Search** | MiniSearch full-text search + enhanced filters (location, size, price, sort) | High | INSTALLED (minisearch) — usePropertySearch hook, fuzzy matching, prefix search |
| **Tables** | Manual HTML tables | Low | No sorting, pagination, or column management |
| **Drag & Drop** | None | — | Not needed yet (Kanban is click-based, not drag) |
| **Maps** | None | — | Skipped — not needed yet |
| **Dates** | date-fns for formatting + relative time + date math | High | INSTALLED (date-fns 4.1.0) |
| **File Upload** | Manual file input with preview, uploadPropertyPhoto, uploadBuildingDocument, etc. | Medium-High | 14 storage upload functions |
| **Toasts** | Custom ToastContext | High | Works well |
| **Skeletons** | Shimmer skeleton loaders (5 skeleton components) | High | ChartSkeleton, DashboardSkeleton, FlatCardSkeleton, MessageSkeleton, ReservationSkeleton |
| **PDF** | @react-pdf/renderer — property brochures, reservation confirmations, contractor summaries | High | INSTALLED (@react-pdf/renderer) — 3 PDF templates, lazy-loaded |
| **Real-time** | Raw Firestore `onSnapshot` + custom hooks | Medium | useMessages, useNotifications, useUnreadMessages |
| **Class Utilities** | clsx + tailwind-merge | High | INSTALLED (clsx 2.1.1, tailwind-merge 3.5.0) |
| **Milestones** | MilestoneTimeline with phase bars, diamond markers, today line | High | BuildingMilestone type + component |
| **Kanban** | KanbanBoard component (click-based, not drag) | High | List/board toggle on reservations |
| **Documents** | DocumentManager component + BuildingDocument type | High | Per-building doc management with sharing controls |
| **Accessibility** | Skip-to-content, focus-visible, ARIA, prefers-reduced-motion | High | Phase 4 complete |
| **Mobile** | Sidebar hidden, 44px targets, responsive grids, sticky input | High | Phase 4 complete |

---

## Installed Libraries (Current)

| Library | Version | License | Status | Purpose |
|---------|---------|---------|--------|---------|
| motion (Framer Motion) | 12.38.0 | MIT | INSTALLED | Page transitions, card animations, micro-interactions, AnimatePresence |
| zod | 4.3.6 | MIT | INSTALLED | Schema-based form validation — 6 schemas (login, register, profile, contractor profile, flat, house) |
| clsx | 2.1.1 | MIT | INSTALLED | Conditional class name utility |
| tailwind-merge | 3.5.0 | MIT | INSTALLED | Tailwind class conflict resolution |
| date-fns | 4.1.0 | MIT | INSTALLED | Date formatting, relative time, date math, deadline calculations |
| react-compare-slider | 3.1.0 | MIT | INSTALLED | Before/after image comparison slider for 3D renders |
| recharts | 3.7.0 | MIT | INSTALLED | Analytics charts (revenue, occupancy, property type, progress) |
| lucide-react | 0.563.0 | ISC | INSTALLED | Icon library |
| react-i18next | 16.5.4 | MIT | INSTALLED | Internationalization (3 languages) |

---

## Recommended Technology Additions (Remaining)

### Tier 1 — High Priority (Core Experience)

> **All libraries are free and open-source (MIT license) unless noted otherwise.**

#### 1. shadcn/ui — UI Component Foundation
- **Cost**: FREE (MIT) — you copy the code into your project, no dependency
- **What**: Copy-paste component library built on Radix UI + Tailwind CSS
- **Why**: Accessible, keyboard-navigable components. Upgrades existing Input, Select, Modal, Dialog. Adds Calendar/Date Picker, Combobox, Command palette, Tooltip, Sheet
- **Impact**: Replaces manual date handling in some forms, adds missing Combobox for location search, improves accessibility on all interactive elements
- **Effort**: Medium — install Radix primitives, copy/adapt components one at a time
- **Key Components to Adopt**:
  - Calendar + Date Picker (for remaining split year/month selectors)
  - Combobox (searchable dropdowns for location)
  - Command (command palette for power users)
  - Tooltip (info tooltips)
  - Sheet (mobile-friendly slide-out panels)

#### 2. Sonner — Toast Notifications
- **Cost**: FREE (MIT)
- **What**: 2-3KB toast library, TypeScript-first, global observer pattern
- **Why**: Toasts persist across route changes. Promise-based toasts for async operations (save property, upload photo)
- **Impact**: Replace custom ToastContext with lighter, more capable solution
- **Effort**: Low — drop-in replacement, minimal migration

#### 3. MiniSearch — Client-Side Property Search — INSTALLED
- **Cost**: FREE (MIT)
- **Status**: INSTALLED and integrated. `usePropertySearch` hook in `packages/web/lib/hooks/usePropertySearch.ts`
- **What**: Lightweight client-side full-text search with fuzzy matching and field boosting
- **Integration**: Search bar on `/properties` page via PropertyFilters component, indexes title/description/address with fuzzy: 0.2, prefix: true

---

### Tier 2 — Medium Priority (Polish & Delight)

> **All libraries are free and open-source (MIT license).**

#### 4. TanStack Table — Data Tables
- **Cost**: FREE (MIT)
- **What**: Headless table library (~30KB) with sorting, filtering, pagination, column resize
- **Why**: Financial tracking tables, property performance tables, contractor lists — all need sortable columns and pagination
- **Impact**: Upgrade company analytics, financial tracking, contractor management tables
- **Effort**: Medium — headless means you style it with Tailwind

#### 5. Tremor — Dashboard Components
- **Cost**: FREE (Apache 2.0)
- **What**: React components built on Tailwind for dashboards
- **Why**: Polished stat cards with trend indicators, sparklines, progress bars
- **Impact**: Upgrade company/contractor dashboards with more polished metrics
- **Effort**: Low-Medium — need theme customization to match glass design

#### 6. Image Optimization Pipeline — BlurHash + Sharp
- **Cost**: FREE (all MIT) — Sharp runs in Cloud Functions
- **What**: On upload: generate thumbnails + WebP. BlurHash for blur placeholders
- **Why**: Property photos are heaviest assets. Optimization reduces load times significantly
- **Impact**: Blur placeholders on cards, responsive image sizes, faster mobile loading
- **Effort**: Medium — Cloud Function for processing, schema update for variants

---

### Tier 3 — Lower Priority (Advanced Features)

> **All libraries are free and open-source.**

#### 7. @react-pdf/renderer — PDF Generation — INSTALLED
- **Cost**: FREE (MIT)
- **Status**: INSTALLED and integrated. 3 PDF templates in `packages/web/components/pdf/`
- **What**: Write PDFs using React components (lazy-loaded for SSR compatibility)
- **Templates**: PropertyBrochurePDF, ReservationConfirmationPDF, ContractorAssignmentPDF
- **Integration**: PDFDownloadButton wrapper on flat/house detail pages

#### 8. react-dropzone — File Upload UX
- **Cost**: FREE (MIT)
- **What**: Drag-and-drop file upload zone
- **Why**: Current uploads use basic file inputs. Dropzone adds visual feedback, multi-file support
- **Impact**: Better photo upload experience, document upload UX
- **Effort**: Low — wrapper component

#### 9. TanStack Virtual — Virtual Scrolling
- **Cost**: FREE (MIT)
- **What**: Virtualization for large lists
- **Why**: As listings grow, rendering 100+ cards hurts performance
- **Impact**: Smooth scrolling on large property lists, contractor directory
- **Effort**: Low-Medium

#### 10. ReactFire — Firebase Hooks
- **Cost**: FREE (MIT)
- **What**: Official Firebase + React integration with hooks and Suspense
- **Why**: Current Firebase usage is manual onSnapshot in useEffect. ReactFire provides cleaner hooks
- **Impact**: Cleaner code, automatic loading states via Suspense
- **Effort**: Medium — gradual migration

---

## Skill Categories Summary

### Animation & Motion Design — COMPLETE
| Skill | Tool | Status |
|-------|------|--------|
| Page transitions | Motion (Framer Motion) | DONE — PageTransition component on all routes |
| Card animations | Motion | DONE — AnimatedCard component, staggered entrance |
| Micro-interactions | Motion | DONE — Button hover, toggle, icon animations |
| Modal animations | Motion + AnimatePresence | DONE — Spring-based open/close on modals |
| Loading shimmer | CSS keyframes | DONE — 5 shimmer skeleton components |

### UI/UX Design — PARTIALLY COMPLETE
| Skill | Tool | Status |
|-------|------|--------|
| Glass design system | Tailwind CSS 4 + CSS custom properties | DONE |
| Sidebar navigation | Custom components | DONE — Unified sidebar-only nav |
| Form wizards | FormWizard component | DONE — 4-step property creation |
| Form drafts | useFormDraft hook + DraftIndicator | DONE — Auto-save, resume |
| Kanban board | KanbanBoard component | DONE — List/board toggle |
| Photo lightbox | PhotoGallery component | DONE — Keyboard navigation |
| Milestone timeline | MilestoneTimeline component | DONE — Phase bars, today line, overdue |
| Document management | DocumentManager component | DONE — Upload, share, delete |
| Availability badges | AvailabilityBadge component | DONE — Color-coded status |
| Accessible components | shadcn/ui + Radix | REMAINING |
| Date picking | shadcn Calendar | REMAINING |
| Combobox / Autocomplete | shadcn Combobox | REMAINING |
| Data tables | TanStack Table | REMAINING |
| Dashboard widgets | Tremor | REMAINING |

### Data & Search — PARTIALLY COMPLETE
| Skill | Tool | Status |
|-------|------|--------|
| Filter bar | PropertyFilters, FlatFilters | DONE — Location, size, price, sort |
| Sort options | SortBy type | DONE — newest, price_asc, price_desc, size_desc |
| Full-text search | MiniSearch | REMAINING — fuzzy matching, typo tolerance |

### Forms & Validation — COMPLETE
| Skill | Tool | Status |
|-------|------|--------|
| Schema validation | Zod | DONE — 6 schemas with i18n error keys |
| Field-level errors | useFormValidation hook | DONE |
| Multi-step wizards | FormWizard component | DONE — 4-step property creation |
| Auto-save drafts | useFormDraft hook | DONE — localStorage persistence |
| Inline editing | AnimatePresence transitions | DONE — Customization option cards |

### Performance & Optimization — PARTIALLY COMPLETE
| Skill | Tool | Status |
|-------|------|--------|
| Lazy loading | Native `loading="lazy"` | DONE — All images |
| Shimmer skeletons | CSS keyframes | DONE — 5 skeleton components |
| Content loader | ContentLoader component | DONE — Standardized loading |
| Image optimization | Sharp (Cloud Fn) | REMAINING |
| Blur placeholders | BlurHash | REMAINING |
| Virtual scrolling | TanStack Virtual | REMAINING |

### Documents & Media — COMPLETE
| Skill | Tool | Status |
|-------|------|--------|
| Photo gallery | PhotoGallery + PhotoUploader | DONE — Lightbox, keyboard nav |
| Building documents | DocumentManager | DONE — Upload, share, type categorization |
| Contractor documents | Storage functions | DONE — Certificates, insurance, licenses |
| Contractor portfolio | Storage functions | DONE — Photos with captions |
| Property photos | uploadPropertyPhoto | DONE — Generic upload function |
| File management | 14 storage upload functions | DONE |
| PDF generation | @react-pdf/renderer | DONE — 3 templates, lazy-loaded |

### Real-time & State — COMPLETE
| Skill | Tool | Status |
|-------|------|--------|
| Messages | useMessages hook | DONE — Real-time subscriptions |
| Notifications | useNotifications hook | DONE — Bell + center page |
| Unread tracking | useUnreadMessages hook | DONE — Sidebar badges |
| Favorites | useFavorites hook | DONE — localStorage persistence |

### Accessibility — COMPLETE
| Skill | Tool | Status |
|-------|------|--------|
| Skip-to-content | Native HTML | DONE |
| Focus-visible | CSS focus-visible | DONE |
| ARIA labels | HTML attributes | DONE |
| Dialog accessibility | role + aria-modal | DONE |
| Contrast | CSS fixes | DONE |
| Reduced motion | prefers-reduced-motion | DONE |
| Touch targets | 44px minimum | DONE |

### Mobile UX — COMPLETE
| Skill | Tool | Status |
|-------|------|--------|
| Responsive sidebar | MobileMenu component | DONE — Hidden on mobile, hamburger toggle |
| Touch targets | Tailwind utilities | DONE — 44px minimum |
| Responsive grids | Tailwind responsive classes | DONE |
| Sticky inputs | CSS sticky | DONE — Message input on mobile |

---

## Implementation Phases — Status

### Phase 1 — Foundation (Structure & Forms) — COMPLETE
1. **Zod** — DONE — 6 validation schemas, field-level errors, i18n translation keys
2. **useFormValidation hook** — DONE — Real-time validation feedback
3. **useFormDraft hook + DraftIndicator** — DONE — Auto-save form progress
4. **date-fns** — DONE — Date formatting, relative time, deadline calculations
5. **clsx + tailwind-merge** — DONE — Class name utilities

### Phase 2 — Visual Polish (Animation & Images) — COMPLETE
6. **Motion (Framer Motion)** — DONE — PageTransition on all routes, AnimatedCard, micro-interactions, AnimatePresence
7. **Lazy loading** — DONE — Native loading="lazy" on all images
8. **Shimmer skeletons** — DONE — 5 skeleton components (Chart, Dashboard, FlatCard, Message, Reservation)
9. **PhotoUploader + PhotoGallery** — DONE — Upload, lightbox, keyboard nav
10. **ContentLoader** — DONE — Standardized loading transitions

### Phase 3 — Core Features (Milestones, Kanban, Documents) — COMPLETE
11. **KanbanBoard** — DONE — Reservation Kanban with list/board toggle, click-based (not drag)
12. **MilestoneTimeline** — DONE — Phase bars, diamond markers, today line, overdue warnings
13. **DocumentManager** — DONE — Per-building document management with sharing controls
14. **Enhanced public contractor profile** — DONE — Hero, categories, portfolio, stats
15. **Enhanced messaging** — DONE — Unread badges, buyer/contractor tabs, context bars

### Phase 4 — Polish (Mobile, Accessibility, Customization) — COMPLETE
16. **Mobile UX** — DONE — Sidebar hidden, 44px targets, responsive grids, sticky input
17. **Accessibility** — DONE — Skip-to-content, focus-visible, ARIA, prefers-reduced-motion
18. **Inline editing** — DONE — Customization option cards with AnimatePresence
19. **Form drafts** — DONE — useFormDraft + DraftIndicator in creation wizards
20. **Contractor documents & portfolio** — DONE — Upload certificates, insurance, portfolio photos
21. **Contractor availability** — DONE — AvailabilityBadge, profile selector, directory filter

### Phase 5 — Production Readiness — COMPLETE
22. **Team management** — DONE — Multi-user agencies with invite flow, roles (owner/manager/agent)
23. **Date picker standardization** — DONE — All forms use HTML5 date inputs
24. **Construction update editing** — DONE — Inline edit form on timeline updates
25. **Contractor invitations** — DONE — Agency-initiated invite-to-apply flow
26. **Full-text search** — DONE — MiniSearch with fuzzy matching on properties page
27. **Customization price summary** — DONE — Total impact card, per-flat subtotals, per-request prices
28. **Contractor calendar** — DONE — Month grid view with color-coded assignments
29. **PDF generation** — DONE — Property brochures, reservation confirmations, contractor summaries

### Remaining (Future Phases)
- shadcn/ui components (Calendar, Combobox, Command palette)
- Sonner (toast replacement)
- TanStack Table (sortable/paginated data tables)
- Tremor (enhanced dashboard widgets)
- Image optimization pipeline (Sharp + BlurHash)
- react-dropzone (drag-and-drop file upload zones)
- TanStack Virtual (virtual scrolling for large lists)
- ReactFire (Firebase hooks with Suspense)

---

## Cost & Bundle Summary

### Currently Installed (FREE)

| Library | License | Size (gzipped) |
|---------|---------|----------------|
| motion (Framer Motion) | MIT | ~32KB |
| zod | MIT | ~13KB |
| clsx | MIT | ~1KB |
| tailwind-merge | MIT | ~5KB |
| date-fns | MIT | ~5-10KB (tree-shaken) |
| react-compare-slider | MIT | ~3KB |
| recharts | MIT | ~50KB |
| minisearch | MIT | ~5KB |
| @react-pdf/renderer | MIT | ~527KB (lazy-loaded) |

### Remaining Recommended (all FREE)

| Library | License | Size (gzipped) |
|---------|---------|----------------|
| shadcn/ui (Radix primitives) | MIT | ~5-15KB per component |
| Sonner | MIT | ~3KB |
| TanStack Table | MIT | ~30KB |
| Tremor | Apache 2.0 | ~50KB |
| Sharp (Cloud Functions) | Apache 2.0 | Server-side only |
| BlurHash | MIT | ~3KB |
| react-dropzone | MIT | ~8KB |
| TanStack Virtual | MIT | ~10KB |
| ReactFire | MIT | ~12KB |

### Paid Alternatives (NOT recommended now, but good to know for future scaling)

| Tool | What | Cost | When to consider |
|------|------|------|-----------------|
| Mapbox GL | Property maps with markers, clustering, geocoding | Free tier: 50k loads/month, then ~$5/1k | When you need map-based property browsing |
| Typesense Cloud | Hosted search with geo-filtering | Free tier: 2 collections, then $29.50/mo | When you have 5,000+ properties and need server-side search |
| Algolia | Premium search-as-a-service | Free tier: 10k searches/month, then $1/1k | When you need analytics on search behavior |
| AG Grid | Enterprise data grid | Free community edition, Enterprise $999/dev/year | When you need Excel-like spreadsheet features |
