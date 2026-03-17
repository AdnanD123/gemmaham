---
name: implement
description: Full lifecycle feature implementation for Gemmaham — plan, code, review, commit. Use when asked to implement a feature, fix a bug, or build a new page.
argument-hint: <feature description>
---

# Implement Feature — Gemmaham Full Lifecycle

You are orchestrating the complete implementation of a feature from idea to committed code.

The feature description is: $ARGUMENTS

---

## Phase 1: Analysis & Planning

**Launch a Plan agent** to analyze the feature and create an implementation plan.

Provide the agent with Gemmaham's architecture:
- Monorepo: `packages/shared` (types), `packages/web` (React Router 7 SSR), `packages/functions` (Firebase Cloud Functions)
- Auth: `useOutletContext<AuthContext>()`, `<RoleGuard allowedRole="...">`, `<AuthGuard>`
- Types: Import from `@gemmaham/shared`
- Routes: React Router 7 convention `routes/entity.action.tsx`
- Styling: Tailwind CSS 4 with CSS custom properties (neobrutalism theme)
- i18n: react-i18next with EN, BS, DE in `packages/web/lib/i18n/`
- Firebase: Client SDK in `packages/web/lib/firebase.ts`, Firestore functions in `packages/web/lib/firestore.ts`
- UI Components: `packages/web/components/ui/` (Button, Modal, Input, Select, Toast, etc.)

The agent should provide:
1. Brief summary (2-3 sentences)
2. Files to create (with full paths)
3. Existing files to modify (with full paths)
4. Implementation steps in order
5. New types needed in `@gemmaham/shared`
6. New i18n keys needed
7. Firestore schema changes (if any)
8. Potential gotchas

**Show the plan to the developer and ask for confirmation before proceeding.**

---

## Phase 2: Branch Setup

After confirmation:

1. Pull latest main: `git checkout main && git pull`
2. Create feature branch: `git checkout -b feature/<kebab-case-description>`
3. Confirm branch created

---

## Phase 3: Implementation

**Launch a general-purpose Agent** to implement the feature.

Include the confirmed plan and these project standards:

- TypeScript strict — no `any` types
- Named exports only
- Import types from `@gemmaham/shared`
- Auth via `useOutletContext<AuthContext>()`
- Role guard: `allowedRole` prop (NOT `role`)
- Firebase client guarded with `typeof window`
- All user-facing strings via `t("key")` — add keys to all 3 i18n files
- Tailwind CSS with theme tokens (`bg-surface`, `text-foreground`, `bg-primary`)
- Use existing UI components from `components/ui/`
- Follow existing patterns — look at similar pages/components for reference
- Loading states with skeleton loaders
- Error handling with toast notifications
- Empty states with helpful messages

**Wait for completion.**

---

## Phase 4: Quality Checks

Run these in sequence:

1. **Build shared** (if types changed): `cd packages/shared && npm run build`
2. **Build web**: `npm run build`
3. **Translation check**: Verify new i18n keys exist in en.json, bs.json, de.json

If anything fails, fix the issues and retry.

---

## Phase 5: Code Review

Launch `/review-code` skill to review all changes against Gemmaham standards.

If the review finds issues, fix them and re-run checks.

---

## Phase 6: Commit

1. Stage specific files: `git add <files>` (not `git add .`)
2. Commit with descriptive message:
   ```
   feat: <what was implemented>

   Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
   ```
3. Show summary:
   ```
   Implementation Complete!

     Branch:    feature/<name>
     Files:     <count> changed
     Build:     PASS
     i18n:      PASS
     Review:    PASS

   Changes committed. Ready for PR when you're ready (/done).
   ```

---

## Error Handling

- If build fails: Fix TypeScript errors, rebuild, and continue
- If i18n keys missing: Add placeholder translations to BS/DE with `[TODO]` prefix
- If git hook fails: Fix the issue, create a NEW commit (never --amend or --no-verify)
- If implementation is unclear: Ask the developer for clarification before proceeding

## Important Rules

- ALWAYS wait for developer confirmation after Phase 1
- ALWAYS build and verify before committing
- NEVER skip the review phase
- NEVER use `any` as a type fix
- NEVER hardcode user-facing strings — always use i18n
- If changing shared types, always rebuild shared before checking web
