# Skills & Technologies — Enhancement Roadmap

## Current Stack Assessment

| Layer | Current | Quality | Gap |
|-------|---------|---------|-----|
| **UI Components** | Custom components (Button, Modal, Toast, etc.) | Medium-High | No component library, limited variants |
| **Animations** | 3 custom keyframes + Tailwind `animate-pulse/spin` | Low | No page transitions, no micro-interactions, no scroll animations |
| **Forms** | Manual `useState` per field, no validation | Low | No validation, no error mapping, not scalable |
| **Charts** | Recharts (bar, pie) | Medium | Basic, no animated transitions, limited interactivity |
| **Images** | Raw `<img>` tags, no optimization | Low | No lazy loading, no placeholders, no responsive sizes |
| **Search** | Basic Firestore filters (price, bedrooms) | Low | No full-text search, no location/geo, no sort |
| **Tables** | Manual HTML tables | Low | No sorting, pagination, or column management |
| **Drag & Drop** | None | — | Needed for Kanban boards and photo reordering |
| **Maps** | None | — | Skipped for now — not needed yet |
| **Dates** | Raw date strings, split year/month selectors | Low | Poor UX, no proper date picker |
| **File Upload** | Manual file input with preview | Medium | No drag-drop zone, no progress bar |
| **Toasts** | Custom ToastContext | High | Works well, but could be lighter |
| **Skeletons** | Custom with `animate-pulse` | Low | No shimmer effect, basic shapes |
| **PDF** | None | — | Needed for contracts, brochures |
| **Real-time** | Raw Firestore `onSnapshot` | Medium | Works but verbose, no Suspense integration |

---

## Recommended Technology Additions

### Tier 1 — High Priority (Core Experience)

> **All Tier 1 libraries are free and open-source (MIT license) unless noted otherwise.**

#### 1. shadcn/ui — UI Component Foundation
- **Cost**: FREE (MIT) — you copy the code into your project, no dependency
- **What**: Copy-paste component library built on Radix UI + Tailwind CSS
- **Why**: You own the code (no dependency lock-in). Accessible, keyboard-navigable, works with your existing Tailwind 4 + CSS custom properties. Components can be restyled to match the neobrutalism theme
- **Impact**: Replaces and upgrades your custom Input, Select, Modal, Dialog, Dropdown, Tabs, Tooltip, etc. Saves time on building accessible primitives from scratch
- **Effort**: Medium — install Radix primitives, copy/adapt components one at a time
- **Key Components to Adopt**:
  - Dialog (upgrade Modal)
  - Select + Combobox (upgrade Select, add searchable dropdowns)
  - Tabs (standardize tabbed interfaces)
  - Dropdown Menu (context menus, action menus)
  - Popover (notification dropdown, filter panels)
  - Calendar + Date Picker (replace split year/month selectors)
  - Tooltip (add info tooltips across the app)
  - Sheet (mobile-friendly slide-out panels)
  - Command (command palette for power users)

#### 2. Conform + Zod — Form Handling & Validation
- **Cost**: FREE (MIT) — both libraries
- **What**: Conform is a form library built specifically for React Router 7. Zod provides schema-based validation
- **Why**: Native SSR support — forms work without JavaScript, then enhance on client. Zod schemas can be shared between web (Conform) and Cloud Functions (server validation). Eliminates all manual `useState` form patterns
- **Impact**: Every form in the app (login, registration, property creation, reservation, profile) gets proper validation with field-level error messages. Step-by-step form wizards become easier
- **Effort**: High — need to migrate all existing forms. Start with new forms, gradually migrate
- **Example**:
  ```
  Signup form: Zod schema validates email format, password strength, phone format
  Property form: Validates required fields, price > 0, bedrooms 1-20, area > 0
  Reservation form: Validates move-in date is future, required fields filled
  ```

#### 3. Sonner — Toast Notifications
- **Cost**: FREE (MIT)
- **What**: 2-3KB toast library, TypeScript-first, global observer pattern
- **Why**: Toasts persist across route changes (current custom implementation may not). Promise-based toasts show loading → success/error automatically (perfect for save/upload operations). Standard pairing with shadcn/ui
- **Impact**: Replace custom ToastContext with lighter, more capable solution. Promise toasts for all async operations (save property, submit reservation, upload photo)
- **Effort**: Low — drop-in replacement, minimal migration

#### 4. MiniSearch — Client-Side Property Search
- **Cost**: FREE (MIT) — runs entirely in the browser, no server/hosting needed
- **What**: Lightweight client-side full-text search engine with fuzzy matching and field boosting
- **Why**: Firestore queries are limited (no full-text search, no typo tolerance). MiniSearch loads your properties into an in-memory index and provides instant search with typo tolerance, field weighting (title > description), and faceted filtering — all with zero infrastructure cost
- **Impact**: Search bar on `/properties` page that searches across property titles, descriptions, addresses. Instant results as you type. Works offline
- **Limitation**: Best for up to ~5,000 properties. If the platform scales beyond that, consider Typesense (open-source, self-hostable, but requires a server) or Algolia (paid SaaS)
- **Effort**: Low — index properties from Firestore on page load, no backend changes

---

### Tier 2 — Medium Priority (Polish & Delight)

> **All Tier 2 libraries are free and open-source (MIT license).**

#### 5. Motion (Framer Motion) — Animations & Micro-interactions
- **Cost**: FREE (MIT)
- **What**: Declarative animation library for React (~32KB). Layout animations, gesture handling, page transitions, scroll-triggered effects
- **Why**: The current app has almost no animations. Motion adds the "feel" that makes a platform feel premium — smooth card transitions when filtering, page enter/exit animations, hover micro-interactions, animated number counters on dashboards
- **Impact Areas**:
  - **Page transitions**: Smooth fade/slide between routes
  - **Property cards**: Staggered entrance animation when grid loads, smooth reflow when filters change
  - **Kanban board**: Smooth card movement between columns
  - **Dashboard stats**: Animated number counting on load
  - **Modals**: Spring-based open/close instead of instant show/hide
  - **Notifications**: Slide-in from top/right
  - **Photo gallery**: Smooth lightbox open/close with shared layout animation
  - **Progress bars**: Animated fill on load/update
- **Effort**: Low per-component — can be added incrementally. Start with page transitions and card animations

#### 6. TanStack Table — Data Tables
- **Cost**: FREE (MIT)
- **What**: Headless table library (~30KB) with sorting, filtering, pagination, column resize
- **Why**: The app has several table-heavy views (property performance, financial tracking, reservation lists, contractor lists) that currently use basic HTML tables or card lists. TanStack Table adds sortable columns, pagination, and search — essential for agencies managing 50+ properties
- **Impact**: Upgrade analytics property performance table, financial tracking tables, contractor management lists. All with consistent sorting/pagination
- **Effort**: Medium — headless means you style it with Tailwind (matches your design system)

#### 7. Tremor — Dashboard Components
- **Cost**: FREE (Apache 2.0)
- **What**: React components built on Tailwind for dashboards (~50KB). KPI cards, area charts, bar charts, donut charts, tables, badges
- **Why**: Built specifically for Tailwind, so it drops into your existing design system. Provides polished dashboard primitives (stat cards with trend indicators, sparklines, progress bars) that would take significant effort to build from scratch
- **Impact**: Upgrade company analytics dashboard, contractor earnings view, reservation stats. Consistent, polished dashboard UX
- **Effort**: Low-Medium — components are ready to use, need theme customization to match neobrutalism
- **Note**: Can replace Recharts for most chart needs, or use alongside it

#### 8. Image Optimization Pipeline — BlurHash + Sharp + Lazy Loading
- **Cost**: FREE (all MIT) — Sharp, BlurHash, and native browser APIs. Note: Sharp runs in Cloud Functions which count toward your Firebase usage quota
- **What**: Multi-layer image strategy:
  1. **Sharp** (in Cloud Functions): On upload, generate thumbnails (300px, 800px) + WebP versions
  2. **BlurHash**: Generate blur placeholder hash server-side, store in Firestore alongside property
  3. **Native `loading="lazy"`**: Browser-native lazy loading for below-fold images
  4. **Responsive `srcset`**: Serve appropriate image size based on viewport
- **Why**: Property photos are the heaviest assets on the page. Without optimization, the browsing experience is slow — images pop in with no placeholder, full-size images load on mobile, and scrolling triggers many simultaneous downloads
- **Impact**: Perceived load time drops dramatically. Property cards show blur placeholder instantly, then crisp image fades in. Mobile data usage reduced by 60-70% with responsive sizes
- **Effort**: Medium — Cloud Function for processing, Firestore schema update for image variants, component wrapper for lazy + blur

#### 9. date-fns — Date Handling
- **Cost**: FREE (MIT)
- **What**: Lightweight date utility library (~5-10KB tree-shaken). Handles formatting, relative time, date math, timezone support
- **Why**: The app currently uses raw date strings and awkward split year/month selectors. Proper date handling is needed for: reservation dates, construction deadlines, meeting scheduling, milestone tracking, deadline urgency calculations
- **Impact**: Better date pickers (via shadcn Calendar component), correct timezone handling, relative time display ("3 days ago"), deadline countdown ("5 days remaining"), date range calculations for analytics
- **Effort**: Low — mostly formatting utilities. Pair with shadcn/ui Calendar for date picker UX

---

### Tier 3 — Lower Priority (Advanced Features)

> **All Tier 3 libraries are free and open-source.**

#### 10. @hello-pangea/dnd — Drag & Drop for Kanban
- **Cost**: FREE (Apache 2.0)
- **What**: Fork of react-beautiful-dnd, purpose-built for list-based drag-and-drop
- **Why**: Needed for the Kanban-style reservation board and construction project board. Smooth animations, excellent accessibility, keyboard DnD support
- **Impact**: Enables Kanban board view for reservations and construction phase management
- **Effort**: Medium — new feature, needs state management for drag operations
- **Note**: Per user's decision, reservation Kanban cards are NOT draggable for status change (status changes require deliberate actions). DnD would be used for: photo reordering, priority ordering, timeline arrangement

#### 11. dnd-kit — Photo Reordering & Grid DnD
- **Cost**: FREE (MIT)
- **What**: Flexible DnD library supporting grids, lists, and custom layouts
- **Why**: Needed for property photo gallery management (drag to reorder photos), potentially for dashboard widget arrangement
- **Impact**: Photo gallery manager where agencies drag-to-reorder property photos
- **Effort**: Low — isolated to photo management component

#### 12. @react-pdf/renderer — PDF Generation
- **Cost**: FREE (MIT)
- **What**: Write PDFs using React components and CSS Flexbox
- **Why**: Generate property brochures (photo + specs + floor plan + price), reservation confirmations, contractor assignment summaries. Agencies can share professional documents with buyers
- **Impact**: "Download Brochure" button on property detail, "Download Confirmation" on completed reservations, "Download Contract Summary" for contractor assignments
- **Effort**: Medium — need to design PDF templates, handle image embedding

#### 13. react-dropzone — File Upload UX
- **Cost**: FREE (MIT)
- **What**: Drag-and-drop file upload zone component
- **Why**: Current file uploads use basic `<input type="file">`. react-dropzone provides a proper drop zone with visual feedback, file type validation, multiple file support
- **Impact**: Property photo uploads (drag 5 photos), document uploads (contracts, permits), profile photo upload — all with drag-drop, preview, and progress
- **Effort**: Low — wrapper component, pairs with Firebase Storage `uploadBytesResumable` for progress tracking

#### 14. TanStack Virtual — Virtual Scrolling
- **Cost**: FREE (MIT)
- **What**: Virtualization for large lists (only renders visible items)
- **Why**: As property listings grow, rendering 100+ cards simultaneously hurts performance. Virtual scrolling renders only ~10-15 visible items
- **Impact**: Smooth scrolling on property browse pages, contractor directory, message lists with hundreds of conversations
- **Effort**: Low-Medium — wrap existing list components with virtualizer

#### 15. ReactFire — Firebase Hooks
- **Cost**: FREE (MIT)
- **What**: Official Firebase + React integration with hooks and Suspense support
- **Why**: Current Firebase usage wraps `onSnapshot` manually in `useEffect` with cleanup. ReactFire provides `useFirestoreCollectionData`, `useUser`, etc. with automatic cleanup and Suspense integration
- **Impact**: Cleaner code, automatic loading states via Suspense boundaries, less boilerplate for real-time subscriptions
- **Effort**: Medium — gradual migration of existing Firebase hooks

---

## Skill Categories Summary

### Animation & Motion Design
| Skill | Tool | Use Case |
|-------|------|----------|
| Page transitions | Motion | Smooth route changes |
| Card animations | Motion | Property grid load, filter transitions |
| Micro-interactions | Motion | Button hover, toggle switches, icon animations |
| Number animations | Motion | Dashboard stat counters |
| Scroll animations | Motion / CSS | Reveal elements on scroll (landing page) |
| Loading shimmer | CSS keyframes | Upgrade skeleton loaders from pulse to shimmer |

### UI/UX Design
| Skill | Tool | Use Case |
|-------|------|----------|
| Accessible components | shadcn/ui + Radix | All interactive elements |
| Date picking | shadcn Calendar | Construction dates, meeting scheduling |
| Combobox / Autocomplete | shadcn Combobox | Location search, contractor search |
| Command palette | shadcn Command | Power user navigation (Cmd+K) |
| Sheet panels | shadcn Sheet | Mobile-friendly side panels |
| Data tables | TanStack Table | Property management, financial tracking |
| Dashboard widgets | Tremor | Analytics, KPI cards, trend indicators |

### Data & Search
| Skill | Tool | Use Case |
|-------|------|----------|
| Full-text search | MiniSearch | Property search with typo tolerance (client-side, free) |
| Faceted filtering | MiniSearch + Firestore | Multi-criteria property filtering |

### Forms & Validation
| Skill | Tool | Use Case |
|-------|------|----------|
| Schema validation | Zod | All forms — shared between client & server |
| Progressive forms | Conform | Multi-step property creation wizard |
| SSR form handling | Conform | Forms work without JS |
| File validation | Zod + react-dropzone | Photo uploads with type/size checks |

### Performance & Optimization
| Skill | Tool | Use Case |
|-------|------|----------|
| Image optimization | Sharp (Cloud Fn) | Generate thumbnails + WebP on upload |
| Blur placeholders | BlurHash | Instant placeholder while images load |
| Lazy loading | Native `loading="lazy"` | Below-fold images |
| Virtual scrolling | TanStack Virtual | Large property lists |
| Responsive images | `srcset` | Serve right size for viewport |

### Document & Export
| Skill | Tool | Use Case |
|-------|------|----------|
| PDF generation | @react-pdf/renderer | Property brochures, reservation confirmations |
| File management | react-dropzone + Firebase Storage | Photo gallery, document uploads |

### Real-time & State
| Skill | Tool | Use Case |
|-------|------|----------|
| Firebase hooks | ReactFire | Cleaner real-time subscriptions |
| Suspense integration | ReactFire + React 19 | Automatic loading states |
| Optimistic updates | Zustand + Firebase | Instant UI feedback on actions |

---

## Implementation Order (Recommended)

### Phase 1 — Foundation (Structure & Forms)
1. **Conform + Zod** — Migrate forms starting with auth and property creation
2. **shadcn/ui** — Install core components (Dialog, Select, Tabs, Calendar, Popover)
3. **Sonner** — Replace custom toast system
4. **date-fns** — Fix date handling, replace split selectors with Calendar

### Phase 2 — Visual Polish (Animation & Images)
5. **Motion** — Add page transitions, card animations, dashboard number animations
6. **Image pipeline** — Sharp thumbnails, BlurHash, lazy loading
7. **Skeleton upgrade** — Shimmer effect instead of pulse
8. **react-dropzone** — Upgrade all file upload areas

### Phase 3 — Core Features (Search & Interaction)
9. **MiniSearch** — Client-side property search with typo tolerance
10. **TanStack Table** — Data tables for management views
11. **@hello-pangea/dnd** — Kanban board views

### Phase 4 — Advanced (Dashboard & Documents)
12. **Tremor** — Enhanced dashboard components
13. **@react-pdf/renderer** — Property brochures, confirmations
14. **TanStack Virtual** — Virtual scrolling for large lists
15. **ReactFire** — Gradual migration of Firebase hooks

---

## Cost & Bundle Summary

### Cost: Everything is FREE

| Library | License | Cost | Size (gzipped) |
|---------|---------|------|----------------|
| shadcn/ui (Radix primitives) | MIT | FREE | ~5-15KB per component |
| Conform | MIT | FREE | ~8KB |
| Zod | MIT | FREE | ~13KB |
| Sonner | MIT | FREE | ~3KB |
| MiniSearch | MIT | FREE | ~5KB |
| Motion (Framer Motion) | MIT | FREE | ~32KB |
| TanStack Table | MIT | FREE | ~30KB |
| Tremor | Apache 2.0 | FREE | ~50KB |
| Sharp (Cloud Functions) | Apache 2.0 | FREE (library) | Server-side only |
| BlurHash | MIT | FREE | ~3KB |
| date-fns | MIT | FREE | ~5-10KB (tree-shaken) |
| @hello-pangea/dnd | Apache 2.0 | FREE | ~30KB |
| dnd-kit | MIT | FREE | ~20KB |
| @react-pdf/renderer | MIT | FREE | ~80KB |
| react-dropzone | MIT | FREE | ~8KB |
| TanStack Virtual | MIT | FREE | ~10KB |
| ReactFire | MIT | FREE | ~12KB |

**Total if all added**: ~300KB gzipped (loaded on-demand via code-splitting, not all at once)
**Realistic first load increase**: ~50-70KB (only Tier 1 loads initially, rest lazy-loaded)

### Paid Alternatives (NOT recommended now, but good to know for future scaling)

| Tool | What | Cost | When to consider |
|------|------|------|-----------------|
| Mapbox GL | Property maps with markers, clustering, geocoding | Free tier: 50k loads/month, then ~$5/1k | When you need map-based property browsing |
| Typesense Cloud | Hosted search with geo-filtering | Free tier: 2 collections, then $29.50/mo | When you have 5,000+ properties and need server-side search |
| Algolia | Premium search-as-a-service | Free tier: 10k searches/month, then $1/1k | When you need analytics on search behavior |
| AG Grid | Enterprise data grid | Free community edition, Enterprise $999/dev/year | When you need Excel-like spreadsheet features |
