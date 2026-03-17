---
name: review-code
description: Review current code changes against Gemmaham project standards (TypeScript, Tailwind, Firebase, React Router 7, i18n). Use before committing or after implementing a feature.
allowed-tools: Bash, Read, Grep, Glob, Agent
---

# Gemmaham Code Review

Review all current code changes for quality, correctness, and adherence to Gemmaham project standards.

## Step 1: Gather Changes

Run in parallel:
1. `git branch --show-current`
2. `git status --short`
3. `git diff` (staged + unstaged)
4. `git diff --cached` (staged only)

If on a feature branch, also: `git diff main...HEAD`

## Step 2: Review Against Standards

Launch a general-purpose Agent to review with this checklist:

### Must-Have Standards

1. **TypeScript**: No `any` types, proper interfaces, named exports only
2. **Imports**: Use `@gemmaham/shared` for shared types (never relative paths to packages/shared)
3. **Auth Pattern**: `useOutletContext<AuthContext>()` from root.tsx — NOT a custom hook
4. **Role Guard**: `<RoleGuard allowedRole="company">` — prop is `allowedRole`, NOT `role`
5. **Auth Guard**: `<AuthGuard>` wraps user routes, checks auth + profile
6. **Firebase**: Client SDK guarded with `typeof window` check
7. **Routes**: Follow React Router 7 convention `routes/entity.action.tsx`
8. **i18n**: All user-facing strings use `t("key")` — no hardcoded text
9. **Styling**: Tailwind utility classes, use CSS custom properties (`bg-surface`, `text-foreground`, `bg-primary`)
10. **No barrel files**: No `index.ts` re-exports

### Code Quality

- No `console.log` statements left in
- No dead/unreachable code
- No commented-out code blocks
- No hardcoded colors (use Tailwind theme tokens)
- Proper error handling with toast notifications
- Loading states with skeleton loaders
- Empty states with helpful messages

### Security

- No sensitive data in client code
- Firestore queries scoped to authenticated user where appropriate
- File uploads validate type and size
- No XSS vectors (dangerouslySetInnerHTML, etc.)

### i18n

- New UI strings added to all 3 language files (en.json, bs.json, de.json)
- Translation keys follow existing naming convention (dot-separated, camelCase)

## Step 3: Run Automated Checks

```bash
npm run build  # TypeScript + build check
```

## Step 4: Report

```
Code Review — Gemmaham

  Branch:      <branch-name>
  Files changed: <count>

  Standards:   PASS | <n> issues
  TypeScript:  PASS | FAIL
  i18n:        PASS | <n> missing keys
  Security:    PASS | <n> concerns

Issues found:
  [file:line] Description of issue
  [file:line] Description of issue

Overall: PASS | NEEDS_FIXES
```

## Step 5: Fix

If issues are found, fix them directly. Then re-run the checks to confirm.

## Important

- Review ALL changed files, not just the latest commit
- Fix issues directly rather than just reporting (unless ambiguous)
- Never use `--no-verify` to bypass checks
- If unsure about a fix, ask the developer
