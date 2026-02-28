# Gemmaham - AI Agent Instructions

## Project Overview

Real estate platform with 3 roles: user, company (agency), contractor. Monorepo with npm workspaces.

## Architecture

- **packages/shared** — TypeScript types and constants (imported as `@gemmaham/shared`)
- **packages/web** — React Router 7 (SSR) frontend with Tailwind CSS 4
- **packages/functions** — Firebase Cloud Functions

## Commands

- `npm run dev` — Start dev server (http://localhost:5173)
- `npm run build` — Build web app (runs TypeScript checks)
- `node scripts/verify-user-stories.mjs` — Verify user story JSON format

## Patterns

- Auth context: `useOutletContext<AuthContext>()` from root.tsx
- Role guard: `<RoleGuard allowedRole="company">` — uses `allowedRole` prop, NOT `role`; reads auth internally
- Auth guard: `<AuthGuard>` — wraps user routes, checks auth + profile
- Types: Import from `@gemmaham/shared`
- Firebase: Client SDK in `packages/web/lib/firebase.ts` (guarded with `typeof window`)
- Routes: React Router 7 convention `routes/entity.action.tsx`
- i18n: react-i18next with EN, BS, DE in `packages/web/lib/i18n/`

## TypeScript Guidelines

- Use named exports
- Avoid `any` type casts
- Prefer existing patterns when adding new features
- No barrel index files

## Data Model (Firestore)

- `companies/{id}`, `users/{uid}`, `flats/{id}`, `houses/{id}`
- `buildings/{id}`, `reservations/{id}`, `conversations/{id}/messages/{id}`
- Roles: "company" | "user" | "contractor" — stored as Firebase Auth custom claims

## Design System

- Neobrutalism theme with CSS custom properties in `packages/web/app/app.css`
- Colors: `--color-primary`, `--color-surface`, `--color-foreground`
- Components use Tailwind utility classes with `bg-surface`, `text-foreground`, etc.
