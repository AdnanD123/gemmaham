---
name: check-types
description: Run TypeScript type checking across all packages and report errors. Use after making type changes in @gemmaham/shared or when builds fail.
allowed-tools: Bash, Read, Grep, Glob
---

# TypeScript Type Check

Run full TypeScript checking across the monorepo and report issues clearly.

## Workflow

### Step 1: Build shared package first (other packages depend on it)

```bash
cd packages/shared && npm run build
```

If this fails, report the errors — they must be fixed first since `packages/web` and `packages/functions` import from `@gemmaham/shared`.

### Step 2: Check web package

```bash
cd packages/web && npx tsc --noEmit
```

### Step 3: Check functions package

```bash
cd packages/functions && npx tsc --noEmit
```

### Step 4: Report

```
TypeScript Check

  @gemmaham/shared:     PASS | FAIL (<n> errors)
  @gemmaham/web:        PASS | FAIL (<n> errors)
  @gemmaham/functions:  PASS | FAIL (<n> errors)

Errors (if any):
  packages/web/app/routes/company.dashboard.tsx:42
    TS2345: Argument of type 'string' is not assignable to parameter of type 'number'

  <group errors by file for clarity>
```

### Step 5: Fix (if requested)

If the user asks to fix, address errors in dependency order:
1. Fix `@gemmaham/shared` errors first
2. Rebuild shared: `cd packages/shared && npm run build`
3. Then fix `web` and `functions` errors

## Important

- Always build shared before checking web/functions
- Group errors by file for readability
- If there are >20 errors, summarize by category (missing types, wrong types, import errors, etc.)
- Never use `any` type as a fix — find the correct type
