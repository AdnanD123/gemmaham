---
name: audit-ui
description: Audit React components for design system consistency — check Tailwind theme tokens, neobrutalism patterns, dark mode support, accessibility, and responsive design. Use to ensure UI quality.
allowed-tools: Read, Grep, Glob, Agent
---

# UI Design System Audit

Audit components for consistency with Gemmaham's neobrutalism design system.

## Design System Reference

### Theme Tokens (from app.css)
- Colors: `bg-background`, `bg-surface`, `bg-surface-highlight`, `bg-primary`, `bg-secondary`, `bg-accent`, `text-foreground`
- Fonts: `font-serif` (Instrument Serif — headings), `font-sans` (Inter — body)
- Shadow: `shadow-neobrutalism` (4px 4px 0px 0px rgba(0,0,0,1))
- Dark mode: `.dark` class on `<html>`, all tokens have dark variants

### Patterns to Check
- Buttons use `.btn` classes from app.css (primary, secondary, ghost, outline)
- Cards use `bg-surface rounded-3xl shadow-xl` pattern
- Badges use the `Badge` component from `components/ui/Badge.tsx`
- Modals use the `Modal` component (accessible, with ARIA roles)
- Loading states use skeleton components from `components/skeletons/`

## Workflow

### Step 1: Scan Components

If argument provided, audit that specific file/component.
If no argument, audit all components in `packages/web/components/` and `packages/web/app/routes/`.

### Step 2: Check Each Component For

**Theme Consistency**:
- [ ] Uses theme tokens (not hardcoded colors like `bg-blue-500`, `text-gray-700`)
- [ ] Uses `bg-surface` / `bg-background` for backgrounds (not `bg-white` / `bg-gray-900`)
- [ ] Uses `text-foreground` for text (not `text-black` / `text-white`)
- [ ] Uses `bg-primary` for accent elements (not `bg-orange-500`)

**Dark Mode**:
- [ ] No hardcoded light-only colors that break in dark mode
- [ ] Hover states work in both modes
- [ ] Borders use theme-aware colors

**Accessibility**:
- [ ] Interactive elements have focus indicators
- [ ] Images have alt text
- [ ] Buttons have accessible labels
- [ ] Forms have labels and error messages
- [ ] Color is not the only way to convey information

**Responsive Design**:
- [ ] Uses responsive Tailwind classes (sm:, md:, lg:)
- [ ] Grid/flex layouts adapt to mobile
- [ ] Text sizes are readable on mobile
- [ ] Touch targets are at least 44x44px

**Component Reuse**:
- [ ] Uses existing UI primitives (Button, Input, Modal, Badge, Toast) instead of custom implementations
- [ ] Doesn't duplicate logic that exists in shared components

### Step 3: Report

```
UI Audit Report

  Components scanned: <count>
  Issues found: <count>

  Theme consistency:  <count> issues
  Dark mode:          <count> issues
  Accessibility:      <count> issues
  Responsive:         <count> issues
  Component reuse:    <count> issues

Issues by file:
  components/FlatCard.tsx:
    [THEME] Line 42: Uses bg-white instead of bg-surface
    [A11Y]  Line 58: Image missing alt text

  routes/company.dashboard.tsx:
    [DARK]  Line 120: Hardcoded border-gray-200 breaks in dark mode
    [RESP]  Line 85: Grid doesn't collapse on mobile (missing sm: breakpoint)
```

### Step 4: Fix (if requested)

If the user asks to fix, apply corrections:
- Replace hardcoded colors with theme tokens
- Add missing alt text
- Add responsive breakpoints
- Replace custom implementations with existing UI components

## Important

- Only flag real issues — some Tailwind utility classes are fine (spacing, sizing)
- `bg-white` and `text-black` are almost always wrong — should be `bg-surface` and `text-foreground`
- Focus on the most impactful issues first (theme tokens > accessibility > responsive)
