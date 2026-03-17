---
name: shadcn-ui
description: Generate and scaffold shadcn/ui components for Gemmaham. Use when building new UI components, forms, modals, dropdowns, date pickers, tables, or any interactive element. Produces accessible, Tailwind-native components styled to match the neobrutalism design system.
argument-hint: <component or page description>
---

# shadcn/ui Component Generator for Gemmaham

You are an expert at building UI components using the **shadcn/ui** pattern: headless Radix UI primitives styled with Tailwind CSS, copied directly into the project (not installed as a dependency).

## Design System Context

Gemmaham uses a **neobrutalism** theme. All generated components MUST use these tokens:

```css
/* Colors */
bg-background    /* page background: cream light, dark slate dark */
bg-surface       /* card/panel background: white light, dark gray dark */
bg-surface-highlight  /* hover/active state */
bg-primary       /* orange accent: #f97316 */
bg-secondary     /* blue: #3b82f6 */
bg-accent        /* purple: #8b5cf6 */
text-foreground  /* main text color */

/* Typography */
font-serif       /* Instrument Serif — headings only */
font-sans        /* Inter — body text */

/* Effects */
shadow-neobrutalism  /* 4px 4px 0px 0px rgba(0,0,0,1) — bold shadow */

/* Patterns */
rounded-3xl      /* large border radius for cards */
rounded-xl       /* medium radius for buttons/inputs */
border-2 border-foreground/10  /* subtle borders */
```

## Component Location

All UI components go in: `packages/web/components/ui/`

## Available Radix Primitives

When generating components, use these Radix UI packages (install as needed):

```
@radix-ui/react-dialog        → Modal/Dialog/Sheet
@radix-ui/react-dropdown-menu → Dropdown menus
@radix-ui/react-select        → Select dropdowns
@radix-ui/react-tabs          → Tab interfaces
@radix-ui/react-popover       → Popovers (notifications, filters)
@radix-ui/react-tooltip       → Tooltips
@radix-ui/react-accordion     → Collapsible sections
@radix-ui/react-checkbox      → Checkboxes
@radix-ui/react-radio-group   → Radio buttons
@radix-ui/react-switch        → Toggle switches
@radix-ui/react-slider        → Range sliders
@radix-ui/react-progress      → Progress bars
@radix-ui/react-avatar        → User avatars
@radix-ui/react-scroll-area   → Custom scrollbars
@radix-ui/react-separator     → Visual separators
@radix-ui/react-collapsible   → Collapsible panels
@radix-ui/react-alert-dialog  → Confirmation dialogs
@radix-ui/react-navigation-menu → Navigation
@radix-ui/react-context-menu  → Right-click menus
@radix-ui/react-hover-card    → Hover preview cards
@radix-ui/react-toggle        → Toggle buttons
@radix-ui/react-toggle-group  → Toggle button groups
```

For date picking, use: `react-day-picker` (shadcn Calendar is built on this)

## Component Template

Every component should follow this pattern:

```tsx
import * as React from "react";
// Import Radix primitive
// Import cn utility for class merging

// Use cva or manual variants for style variants
// Always support className prop for overrides
// Use forwardRef for DOM element components
// Named exports only (no default exports)

export interface ComponentProps {
  // TypeScript interface for all props
  variant?: "default" | "primary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export const Component = React.forwardRef<HTMLElement, ComponentProps>(
  ({ variant = "default", size = "md", className, ...props }, ref) => {
    return (
      // Radix primitive with Tailwind classes
      // Use theme tokens, not hardcoded colors
      // Support dark mode via theme tokens
      // Include focus-visible ring for accessibility
    );
  }
);
Component.displayName = "Component";
```

## Class Merge Utility

Create or use a `cn()` utility for merging Tailwind classes:

```tsx
// packages/web/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Requires: `npm install clsx tailwind-merge`

## Key Components to Generate

When asked, generate these shadcn-style components adapted to neobrutalism:

### Dialog (upgrade existing Modal)
- Overlay with backdrop blur
- Content panel with `bg-surface rounded-3xl shadow-neobrutalism`
- Close button, title, description
- Accessible: focus trap, ESC to close, ARIA labels

### Select (upgrade existing Select)
- Trigger button with chevron
- Dropdown with `bg-surface shadow-neobrutalism rounded-xl`
- Search/filter capability (Combobox variant)
- Groups and labels support

### Tabs (standardize tab interfaces)
- Underline variant and pill variant
- `bg-primary text-white` for active tab
- Animated indicator (underline slides)
- Accessible keyboard navigation

### Calendar / Date Picker
- Based on `react-day-picker`
- Month navigation, year dropdown
- Range selection support
- `bg-primary` for selected dates
- Replaces the awkward split year/month selectors

### Popover
- For notification dropdown, filter panels
- Arrow pointing to trigger
- `bg-surface shadow-neobrutalism rounded-xl`
- Click outside to close

### Tooltip
- Subtle info tooltips
- `bg-foreground text-background` (inverted)
- Delay on hover (200ms)
- Arrow support

### Data Table
- Based on TanStack Table (when installed)
- Sortable columns (click header)
- Pagination controls
- Striped rows option
- `bg-surface` with subtle borders

### Sheet (Slide-out Panel)
- Mobile-friendly side panel
- Slides from right (or bottom on mobile)
- Overlay backdrop
- Used for: mobile menu, filter panels, detail views

### Command (Command Palette)
- Cmd+K trigger
- Search across pages, properties, actions
- Grouped results
- Keyboard navigation

## Neobrutalism Style Rules

1. **Buttons**: Bold borders, `shadow-neobrutalism` on hover, `translate-x-[2px] translate-y-[2px] shadow-none` on active (press effect)
2. **Cards**: `bg-surface rounded-3xl shadow-xl` or `shadow-neobrutalism` for emphasis
3. **Inputs**: `border-2 border-foreground/20 rounded-xl bg-surface` with `focus:border-primary focus:ring-2 focus:ring-primary/20`
4. **Badges**: Bold colors, `rounded-full px-3 py-1 font-medium text-sm`
5. **No subtle grays**: Use theme tokens, keep contrast high
6. **Headings**: `font-serif` (Instrument Serif), body: `font-sans` (Inter)

## Workflow

When the user asks for a component:

1. Check if a Radix primitive exists for it
2. If yes: install the Radix package, generate the styled component
3. If no: build from scratch with proper accessibility (ARIA, keyboard nav, focus management)
4. Always use theme tokens (never hardcoded colors)
5. Always support dark mode (via theme tokens — automatic)
6. Always add `className` prop for overrides
7. Place in `packages/web/components/ui/`
8. Use named exports only
