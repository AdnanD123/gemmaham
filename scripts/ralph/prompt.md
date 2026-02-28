# Ralph Agent Task

Implement and verify features from user stories until all are complete.

## Project Context

- **Monorepo**: npm workspaces with `packages/shared`, `packages/web`, `packages/functions`
- **Stack**: React Router 7 (SSR), React 19, TypeScript 5.9, Tailwind CSS 4, Firebase
- **Build**: `npm run build` from root runs web build
- **Dev server**: `npm run dev` starts at http://localhost:5173

## Workflow Per Iteration

1. Read `scripts/ralph/log.md` to understand what previous iterations completed.

2. Search `docs/user-stories/` for features with `"passes": false`.

3. If no features remain with `"passes": false`:
   - Output: <promise>FINISHED</promise>

4. Pick ONE feature — the highest priority non-passing feature based on dependencies and logical order.

5. Verify the feature by checking the codebase:
   - Read the relevant source files referenced in the acceptance steps
   - Verify each step by inspecting the actual code (imports, exports, component structure, route registration, etc.)
   - Run `npm run build` to confirm no TypeScript errors
   - Run `node scripts/verify-user-stories.mjs` to check story format

6. If a step fails verification:
   - Fix the issue in the source code
   - Re-verify until all steps pass

7. Once all steps pass:
   - Update the user story's `passes` property to `true`
   - Append to `scripts/ralph/log.md` (keep it short but helpful)

8. The iteration ends here. The next iteration picks up the next feature.

## Verification Approach

Since this is a frontend project without unit tests, verify by:
- **Reading source files** to confirm exports, imports, component structure
- **Running `npm run build`** to confirm TypeScript compilation
- **Checking route registration** in `packages/web/app/routes.ts`
- **Checking i18n keys** in `packages/web/lib/i18n/en.json`, `bs.json`, `de.json`
- **Checking component props** match expected interfaces (e.g., RoleGuard uses `allowedRole` not `role`)

## Key Directories

- Types: `packages/shared/src/types.ts`
- Routes: `packages/web/app/routes.ts`, `packages/web/app/routes/`
- Components: `packages/web/components/`
- Lib: `packages/web/lib/` (firestore.ts, storage.ts, revenue.ts)
- i18n: `packages/web/lib/i18n/` (en.json, bs.json, de.json)
- Firebase rules: `firestore.rules`, `storage.rules`

## Completion

When ALL user stories have `"passes": true`, output:

<promise>FINISHED</promise>
